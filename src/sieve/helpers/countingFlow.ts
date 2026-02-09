/**
 * Max-flow based counting observation.
 *
 * Replaces O(2^N) bitmask enumeration with polynomial Dinic's algorithm.
 *
 * Flow network for a given axis (row or col):
 *   Source → Line_i:    capacity = starsNeeded_i
 *   Line_i → Region_j:  capacity = unknowns of region j in line i
 *   Region_j → Sink:    capacity = starsNeeded_j
 *
 * Two use cases:
 *   1. Violation detection (L9): maxFlow < totalDemand → contradiction
 *   2. Tight set extraction (L3): Dulmage-Mendelsohn decomposition of residual graph
 */

import { Coord } from "./types";
import type { BoardState } from "./boardAnalysis";

// ── Types ──────────────────────────────────────────────────────────────

export type CountingFlowRegionInfo = {
  starsNeeded: number;
  unknownsByAxis: number[];
  unknownCoords: Coord[];
};

export type CountingFlowInput = {
  size: number;
  axisNeeded: number[];
  regionInfos: CountingFlowRegionInfo[];
};

export type TightSetContrib = {
  regionIndex: number;
  inside: number;
  maxContrib: number;
  starsNeeded: number;
  unknownCoords: Coord[];
};

export type TightSetInfo = {
  mask: number;
  regionContribs: TightSetContrib[];
};

export type CountingFlowResult = {
  feasible: boolean;
  tightSets: TightSetInfo[];
};

// ── Dinic's Max-Flow ───────────────────────────────────────────────────

// Adjacency list edge representation
type Edge = { to: number; cap: number; rev: number };

function buildGraph(n: number): Edge[][] {
  const g: Edge[][] = [];
  for (let i = 0; i < n; i++) g.push([]);
  return g;
}

function addEdge(g: Edge[][], from: number, to: number, cap: number): void {
  g[from].push({ to, cap, rev: g[to].length });
  g[to].push({ to: from, cap: 0, rev: g[from].length - 1 });
}

function dinicMaxFlow(g: Edge[][], s: number, t: number): number {
  const n = g.length;
  const level = new Int32Array(n);
  const iter = new Int32Array(n);

  function bfs(): boolean {
    level.fill(-1);
    const queue: number[] = [s];
    level[s] = 0;
    let head = 0;
    while (head < queue.length) {
      const v = queue[head++];
      for (const e of g[v]) {
        if (e.cap > 0 && level[e.to] < 0) {
          level[e.to] = level[v] + 1;
          queue.push(e.to);
        }
      }
    }
    return level[t] >= 0;
  }

  function dfs(v: number, pushed: number): number {
    if (v === t) return pushed;
    for (; iter[v] < g[v].length; iter[v]++) {
      const e = g[v][iter[v]];
      if (e.cap > 0 && level[v] < level[e.to]) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          e.cap -= d;
          g[e.to][e.rev].cap += d;
          return d;
        }
      }
    }
    return 0;
  }

  let flow = 0;
  while (bfs()) {
    iter.fill(0);
    let d: number;
    while ((d = dfs(s, Infinity)) > 0) {
      flow += d;
    }
  }
  return flow;
}

// ── Violation Check (L9) ──────────────────────────────────────────────

export function hasCountingViolation(input: CountingFlowInput): boolean {
  const { size, axisNeeded, regionInfos } = input;

  // Quick check: any region needs stars but has zero unknowns?
  for (const ri of regionInfos) {
    if (ri.starsNeeded > 0) {
      let total = 0;
      for (let i = 0; i < size; i++) total += ri.unknownsByAxis[i];
      if (total < ri.starsNeeded) return true;
    }
  }

  let totalDemand = 0;
  for (let i = 0; i < size; i++) {
    if (axisNeeded[i] < 0) return true;
    totalDemand += axisNeeded[i];
  }
  if (totalDemand === 0) return false;

  // Build flow network
  const R = regionInfos.length;
  const nodeCount = 2 + size + R; // source, sink, lines, regions
  const source = 0;
  const sink = nodeCount - 1;
  // Lines: 1..size, Regions: size+1..size+R

  const g = buildGraph(nodeCount);

  for (let i = 0; i < size; i++) {
    if (axisNeeded[i] > 0) {
      addEdge(g, source, 1 + i, axisNeeded[i]);
    }
  }

  for (let ri = 0; ri < R; ri++) {
    const info = regionInfos[ri];
    if (info.starsNeeded <= 0) continue;
    addEdge(g, 1 + size + ri, sink, info.starsNeeded);
    for (let i = 0; i < size; i++) {
      if (info.unknownsByAxis[i] > 0) {
        addEdge(g, 1 + i, 1 + size + ri, info.unknownsByAxis[i]);
      }
    }
  }

  const maxFlow = dinicMaxFlow(g, source, sink);
  return maxFlow < totalDemand;
}

// ── Tight Set Extraction (L3) ─────────────────────────────────────────

export function computeCountingFlow(input: CountingFlowInput): CountingFlowResult {
  const { size, axisNeeded, regionInfos } = input;
  const R = regionInfos.length;

  let totalDemand = 0;
  for (let i = 0; i < size; i++) totalDemand += axisNeeded[i];

  if (totalDemand === 0) {
    return { feasible: true, tightSets: [] };
  }

  // Build flow network
  const nodeCount = 2 + size + R;
  const source = 0;
  const sink = nodeCount - 1;

  const g = buildGraph(nodeCount);

  for (let i = 0; i < size; i++) {
    if (axisNeeded[i] > 0) {
      addEdge(g, source, 1 + i, axisNeeded[i]);
    }
  }

  for (let ri = 0; ri < R; ri++) {
    const info = regionInfos[ri];
    if (info.starsNeeded <= 0) continue;
    addEdge(g, 1 + size + ri, sink, info.starsNeeded);
    for (let i = 0; i < size; i++) {
      if (info.unknownsByAxis[i] > 0) {
        addEdge(g, 1 + i, 1 + size + ri, info.unknownsByAxis[i]);
      }
    }
  }

  const maxFlow = dinicMaxFlow(g, source, sink);
  if (maxFlow < totalDemand) {
    return { feasible: false, tightSets: [] };
  }

  // Extract tight sets via Dulmage-Mendelsohn decomposition
  const tightSets = extractTightSets(g, source, sink, size, R, axisNeeded, regionInfos);
  return { feasible: true, tightSets };
}

// ── Dulmage-Mendelsohn Decomposition ──────────────────────────────────

function extractTightSets(
  g: Edge[][],
  source: number,
  sink: number,
  size: number,
  R: number,
  axisNeeded: number[],
  regionInfos: CountingFlowRegionInfo[],
): TightSetInfo[] {
  const nodeCount = g.length;

  // Step 1: Find SCCs in residual graph via Tarjan's algorithm
  const sccId = new Int32Array(nodeCount).fill(-1);
  const low = new Int32Array(nodeCount);
  const disc = new Int32Array(nodeCount);
  const onStack = new Uint8Array(nodeCount);
  const stack: number[] = [];
  let timer = 0;
  let sccCount = 0;

  function tarjanDfs(u: number): void {
    disc[u] = low[u] = timer++;
    stack.push(u);
    onStack[u] = 1;

    for (const e of g[u]) {
      if (e.cap <= 0) continue; // only residual edges
      const v = e.to;
      if (disc[v] < 0) {
        // Use iterative approach below to avoid stack overflow
        disc[v] = -2; // mark as "to visit"
      }
      // handled iteratively below
    }
  }

  // Iterative Tarjan's to avoid stack overflow on large graphs
  disc.fill(-1);
  const callStack: { node: number; edgeIdx: number; isRoot: boolean }[] = [];

  for (let start = 0; start < nodeCount; start++) {
    if (disc[start] >= 0) continue;

    callStack.push({ node: start, edgeIdx: 0, isRoot: true });

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      const u = frame.node;

      if (frame.isRoot) {
        disc[u] = low[u] = timer++;
        stack.push(u);
        onStack[u] = 1;
        frame.isRoot = false;
      }

      let pushed = false;
      while (frame.edgeIdx < g[u].length) {
        const e = g[u][frame.edgeIdx];
        if (e.cap > 0) {
          const v = e.to;
          if (disc[v] < 0) {
            frame.edgeIdx++;
            callStack.push({ node: v, edgeIdx: 0, isRoot: true });
            pushed = true;
            break;
          } else if (onStack[v]) {
            low[u] = Math.min(low[u], disc[v]);
          }
        }
        frame.edgeIdx++;
      }

      if (!pushed) {
        if (low[u] === disc[u]) {
          const id = sccCount++;
          let v: number;
          do {
            v = stack.pop()!;
            onStack[v] = 0;
            sccId[v] = id;
          } while (v !== u);
        }
        callStack.pop();
        if (callStack.length > 0) {
          const parent = callStack[callStack.length - 1];
          low[parent.node] = Math.min(low[parent.node], low[u]);
        }
      }
    }
  }

  // Step 2: Build condensation DAG
  // Tarjan's produces SCCs in reverse topological order (scc 0 is the last in topo order)
  // Collect lines and regions per SCC
  const sccLines: number[][] = Array.from({ length: sccCount }, () => []);
  const sccRegions: number[][] = Array.from({ length: sccCount }, () => []);

  for (let i = 0; i < size; i++) {
    const node = 1 + i;
    if (sccId[node] >= 0) sccLines[sccId[node]].push(i);
  }

  for (let ri = 0; ri < R; ri++) {
    const node = 1 + size + ri;
    if (sccId[node] >= 0) sccRegions[sccId[node]].push(ri);
  }

  // Step 3: Walk SCCs in topological order (reverse of Tarjan's numbering)
  // Track cumulative demand/supply, find boundaries
  const tightSets: TightSetInfo[] = [];
  let cumDemand = 0;
  let cumSupply = 0;
  let blockLines: number[] = [];
  let blockRegions: number[] = [];

  for (let si = sccCount - 1; si >= 0; si--) {
    const s = sccId[source];
    const t = sccId[sink];
    if (si === s || si === t) continue;

    for (const line of sccLines[si]) {
      cumDemand += axisNeeded[line];
      blockLines.push(line);
    }
    for (const ri of sccRegions[si]) {
      cumSupply += regionInfos[ri].starsNeeded;
      blockRegions.push(ri);
    }

    // Check for tight boundary
    if (cumDemand > 0 && cumDemand === cumSupply && blockLines.length > 0) {
      const mask = blockLines.reduce((m, line) => m | (1 << line), 0);
      const regionContribs: TightSetContrib[] = [];

      for (const ri of blockRegions) {
        const info = regionInfos[ri];
        let inside = 0;
        for (const line of blockLines) {
          inside += info.unknownsByAxis[line];
        }
        // Only include regions that actually touch these lines
        if (inside > 0 || info.starsNeeded > 0) {
          regionContribs.push({
            regionIndex: ri,
            inside,
            maxContrib: Math.min(info.starsNeeded, inside),
            starsNeeded: info.starsNeeded,
            unknownCoords: info.unknownCoords,
          });
        }
      }

      if (regionContribs.length > 0) {
        tightSets.push({ mask, regionContribs });
      }

      // Reset block accumulators for next tight set
      blockLines = [];
      blockRegions = [];
    }
  }

  return tightSets;
}

// ── Lens Factory ─────────────────────────────────────────────────────

export function makeCountingFlowLens(
  state: BoardState,
  stars: number,
): (axis: "row" | "col") => CountingFlowResult {
  const cache = new Map<string, CountingFlowResult>();
  return (axis) => {
    let result = cache.get(axis);
    if (result) return result;

    const axisStars = axis === "row" ? state.rowStars : state.colStars;
    const axisNeeded = new Array(state.size);
    for (let i = 0; i < state.size; i++) {
      axisNeeded[i] = stars - axisStars[i];
    }

    const regionInfos: CountingFlowInput["regionInfos"] = [];
    for (const region of state.regions.values()) {
      if (region.starsNeeded <= 0) continue;
      const unknownsByAxis = new Array(state.size).fill(0);
      for (const [r, c] of region.unknownCoords) {
        const idx = axis === "row" ? r : c;
        unknownsByAxis[idx]++;
      }
      regionInfos.push({
        starsNeeded: region.starsNeeded,
        unknownsByAxis,
        unknownCoords: region.unknownCoords,
      });
    }

    result = computeCountingFlow({ size: state.size, axisNeeded, regionInfos });
    cache.set(axis, result);
    return result;
  };
}
