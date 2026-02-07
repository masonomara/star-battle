/**
 * Composite Analysis Helpers
 *
 * Shared utilities for analyzing composite regions in Star Battle puzzles.
 * Used by multiple composite-related rules.
 */

import { computeTiling } from "./tiling";
import { Board, CellState, Coord } from "./types";
import { BoardAnalysis, RegionMeta } from "./boardAnalysis";
import { neighbors } from "./neighbors";
import { findForcedOverhangCells } from "./tilingEnumeration";

export type CompositeAnalyzer = (
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
) => boolean;

export type Composite = {
  id: string;
  source: "counting" | "combination" | "complement";
  cells: Coord[];
  unknownCells: Coord[];
  starsNeeded: number;
  regionIds: Set<number>;
};

/**
 * Build the complement composite for a band of rows/cols, then analyze it.
 */
export function findComplementInBand(
  bandLines: number[],
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
): boolean {
  const { size, regions, rowStars, colStars } = analysis;
  const bandSet = new Set(bandLines);

  const confined = [...regions.values()].filter((r) => {
    if (r.starsNeeded <= 0) return false;
    const lines = axis === "row" ? r.unknownRows : r.unknownCols;
    if (lines.size === 0) return false;
    return [...lines].every((l) => bandSet.has(l));
  });

  if (confined.length === 0) return false;

  const lineStars = axis === "row" ? rowStars : colStars;
  let bandStarsTotal = 0;
  for (const line of bandLines) {
    bandStarsTotal += board.stars - lineStars[line];
  }

  let confinedStarsTotal = 0;
  for (const r of confined) {
    confinedStarsTotal += r.starsNeeded;
  }

  const complementStars = bandStarsTotal - confinedStarsTotal;
  if (complementStars <= 0) return false;

  const confinedIds = new Set(confined.map((r) => r.id));
  const complementCells: Coord[] = [];

  for (const bandLine of bandLines) {
    for (let cross = 0; cross < size; cross++) {
      const row = axis === "row" ? bandLine : cross;
      const col = axis === "row" ? cross : bandLine;
      if (
        cells[row][col] === "unknown" &&
        !confinedIds.has(board.grid[row][col])
      ) {
        complementCells.push([row, col]);
      }
    }
  }

  if (complementCells.length === 0) return false;

  const regionIds = new Set(
    complementCells.map(([r, c]) => board.grid[r][c]),
  );

  const composite: Composite = {
    id: `complement-${axis}-${bandLines.join(",")}`,
    source: "complement",
    cells: complementCells,
    unknownCells: complementCells,
    starsNeeded: complementStars,
    regionIds,
  };

  return analyze(composite, board, cells, analysis);
}

/**
 * Build adjacency graph (8-connected regions).
 */
export function buildAdjacencyGraph(
  board: Board,
  regions: Map<number, RegionMeta>,
): Map<number, Set<number>> {
  const adjacency = new Map<number, Set<number>>();
  const size = board.grid.length;

  for (const [id] of regions) {
    adjacency.set(id, new Set());
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = board.grid[row][col];
      if (!regions.has(id)) continue;

      for (const [nrow, ncol] of neighbors(row, col, size)) {
        const neighborId = board.grid[nrow][ncol];
        if (neighborId !== id && regions.has(neighborId)) {
          adjacency.get(id)!.add(neighborId);
        }
      }
    }
  }

  return adjacency;
}

/**
 * Find connected components of coordinates (8-connected).
 */
export function findConnectedComponents(coords: Coord[]): Coord[][] {
  if (coords.length === 0) return [];

  const coordSet = new Set(coords.map((c) => `${c[0]},${c[1]}`));
  const visited = new Set<string>();
  const components: Coord[][] = [];

  for (const coord of coords) {
    const key = `${coord[0]},${coord[1]}`;
    if (visited.has(key)) continue;

    const component: Coord[] = [];
    const queue: Coord[] = [coord];
    visited.add(key);

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      component.push([row, col]);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nKey = `${row + dr},${col + dc}`;
          if (coordSet.has(nKey) && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push([row + dr, col + dc]);
          }
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Enumerate all valid star placements for a set of unknown cells.
 * Returns all subsets of size `starsNeeded` where no two stars are adjacent
 * and row/column quotas are not exceeded.
 */
export function enumerateValidPlacements(
  unknowns: Coord[],
  starsNeeded: number,
  board: Board,
  analysis: BoardAnalysis,
): Coord[][] {
  if (unknowns.length < starsNeeded) return [];
  if (starsNeeded === 0) return [[]];

  const { size, rowStars, colStars } = analysis;

  // Build adjacency between unknown cells
  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < unknowns.length; i++) {
    coordToIdx.set(`${unknowns[i][0]},${unknowns[i][1]}`, i);
  }

  // For each unknown, which other unknowns are adjacent (can't both be stars)
  const adjacent: Set<number>[] = unknowns.map(() => new Set());

  for (let i = 0; i < unknowns.length; i++) {
    const [row, col] = unknowns[i];
    for (const [nr, nc] of neighbors(row, col, size)) {
      const j = coordToIdx.get(`${nr},${nc}`);
      if (j !== undefined && j !== i) {
        adjacent[i].add(j);
      }
    }
  }

  const results: Coord[][] = [];
  const MAX_RESULTS = 1000; // Limit enumeration

  // Track accumulated row/column star counts during backtracking
  const rowCounts = new Array(size).fill(0);
  const colCounts = new Array(size).fill(0);

  function backtrack(start: number, current: number[], forbidden: Set<number>) {
    if (results.length >= MAX_RESULTS) return;

    if (current.length === starsNeeded) {
      results.push(current.map((i) => unknowns[i]));
      return;
    }

    // Prune: not enough cells left
    const remaining = unknowns.length - start;
    const needed = starsNeeded - current.length;
    if (remaining < needed) return;

    for (
      let i = start;
      i < unknowns.length && results.length < MAX_RESULTS;
      i++
    ) {
      if (forbidden.has(i)) continue;

      const [row, col] = unknowns[i];

      // Check row/column quotas before selecting this cell
      if (rowStars[row] + rowCounts[row] + 1 > board.stars) continue;
      if (colStars[col] + colCounts[col] + 1 > board.stars) continue;

      const newForbidden = new Set(forbidden);
      for (const adj of adjacent[i]) {
        newForbidden.add(adj);
      }

      // Update counts for recursive call
      rowCounts[row]++;
      colCounts[col]++;

      current.push(i);
      backtrack(i + 1, current, newForbidden);
      current.pop();

      // Restore counts
      rowCounts[row]--;
      colCounts[col]--;
    }
  }

  backtrack(0, [], new Set());
  return results;
}

/**
 * Shared: refresh composite state and compute tiling.
 * Returns null if no analysis is possible.
 */
function prepareComposite(
  composite: Composite,
  cells: CellState[][],
  size: number,
) {
  const currentUnknowns = composite.unknownCells.filter(
    ([row, col]) => cells[row][col] === "unknown",
  );
  const starsPlacedInComposite = composite.unknownCells.filter(
    ([row, col]) => cells[row][col] === "star",
  ).length;
  const currentStarsNeeded = composite.starsNeeded - starsPlacedInComposite;

  if (currentUnknowns.length === 0 || currentStarsNeeded <= 0) return null;

  const tiling = computeTiling(currentUnknowns, size);
  if (tiling.capacity < currentStarsNeeded) return null;

  return { currentUnknowns, currentStarsNeeded, tiling };
}

/**
 * Enumeration marks: enumerate valid placements, mark cells that appear in none.
 */
function enumerationMarks(
  currentUnknowns: Coord[],
  currentStarsNeeded: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const validPlacements = enumerateValidPlacements(
    currentUnknowns,
    currentStarsNeeded,
    board,
    analysis,
  );
  if (validPlacements.length === 0 || validPlacements.length >= 1000) {
    return false;
  }

  const inAnyPlacement = new Set<string>();
  for (const placement of validPlacements) {
    for (const [r, c] of placement) {
      inAnyPlacement.add(`${r},${c}`);
    }
  }

  let changed = false;
  for (const [r, c] of currentUnknowns) {
    if (!inAnyPlacement.has(`${r},${c}`) && cells[r][c] === "unknown") {
      cells[r][c] = "marked";
      changed = true;
    }
  }
  return changed;
}

/**
 * Enumeration placements: enumerate valid placements, place cells that appear in all.
 */
function enumerationPlacements(
  currentUnknowns: Coord[],
  currentStarsNeeded: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const validPlacements = enumerateValidPlacements(
    currentUnknowns,
    currentStarsNeeded,
    board,
    analysis,
  );
  if (validPlacements.length === 0 || validPlacements.length >= 1000) {
    return false;
  }

  // Find cells in ALL placements
  const inAllPlacements = new Set<string>(
    validPlacements[0].map((c) => `${c[0]},${c[1]}`),
  );
  for (let p = 1; p < validPlacements.length; p++) {
    const placementKeys = new Set(
      validPlacements[p].map((c) => `${c[0]},${c[1]}`),
    );
    for (const key of inAllPlacements) {
      if (!placementKeys.has(key)) {
        inAllPlacements.delete(key);
      }
    }
  }

  const localRowStars = [...analysis.rowStars];
  const localColStars = [...analysis.colStars];
  const localRegionStars = new Map<number, number>();
  for (const [id, m] of analysis.regions) localRegionStars.set(id, m.starsPlaced);

  let changed = false;
  for (const key of inAllPlacements) {
    const [row, col] = key.split(",").map(Number);
    if (cells[row][col] !== "unknown") continue;

    let hasAdjacentStar = false;
    for (const [nr, nc] of neighbors(row, col, size)) {
      if (cells[nr][nc] === "star") {
        hasAdjacentStar = true;
        break;
      }
    }
    if (hasAdjacentStar) continue;

    if (localRowStars[row] >= board.stars || localColStars[col] >= board.stars) continue;
    const regionId = board.grid[row][col];
    if ((localRegionStars.get(regionId) ?? 0) >= board.stars) continue;

    cells[row][col] = "star";
    localRowStars[row]++;
    localColStars[col]++;
    localRegionStars.set(regionId, (localRegionStars.get(regionId) ?? 0) + 1);
    changed = true;
  }
  return changed;
}

/**
 * Confinement + Enumeration (tight tiling) → Marks.
 * Tight tiling on composite: cells outside covered by ALL tilings get marked.
 */
export function analyzeCompositeTilingMarks(
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const prep = prepareComposite(composite, cells, analysis.size);
  if (!prep) return false;
  const { currentStarsNeeded, tiling } = prep;

  if (tiling.capacity !== currentStarsNeeded) return false;

  const compositeSet = new Set(
    composite.cells.map((coord) => `${coord[0]},${coord[1]}`),
  );
  const externalForced = findForcedOverhangCells(tiling.tilings, compositeSet);

  let changed = false;
  for (const [erow, ecol] of externalForced) {
    if (cells[erow][ecol] === "unknown") {
      cells[erow][ecol] = "marked";
      changed = true;
    }
  }
  return changed;
}

/**
 * Confinement + Enumeration (tight tiling) → Placements.
 * Tight tiling on composite: single-coverage forced cells become stars.
 */
export function analyzeCompositeTilingPlacements(
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const prep = prepareComposite(composite, cells, size);
  if (!prep) return false;
  const { currentStarsNeeded, tiling } = prep;

  if (tiling.capacity !== currentStarsNeeded) return false;

  const forcedSet = new Set(
    tiling.forcedCells.map(([row, col]) => `${row},${col}`),
  );

  const localRowStars = [...analysis.rowStars];
  const localColStars = [...analysis.colStars];
  const localRegionStars = new Map<number, number>();
  for (const [id, m] of analysis.regions) localRegionStars.set(id, m.starsPlaced);

  let changed = false;
  for (const [frow, fcol] of tiling.forcedCells) {
    if (cells[frow][fcol] !== "unknown") continue;

    let hasAdjacentConflict = false;
    for (const [nr, nc] of neighbors(frow, fcol, size)) {
      if (cells[nr][nc] === "star" || forcedSet.has(`${nr},${nc}`)) {
        hasAdjacentConflict = true;
        break;
      }
    }
    if (hasAdjacentConflict) continue;

    if (localRowStars[frow] >= board.stars || localColStars[fcol] >= board.stars) continue;
    const regionId = board.grid[frow][fcol];
    if ((localRegionStars.get(regionId) ?? 0) >= board.stars) continue;

    cells[frow][fcol] = "star";
    localRowStars[frow]++;
    localColStars[fcol]++;
    localRegionStars.set(regionId, (localRegionStars.get(regionId) ?? 0) + 1);
    changed = true;
  }
  return changed;
}

/**
 * Confinement + Enumeration (slack tiling) → Marks.
 * Slack tiling on composite: enumerate placements, mark cells in none.
 */
export function analyzeCompositeEnumerationMarks(
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const prep = prepareComposite(composite, cells, analysis.size);
  if (!prep) return false;
  const { currentUnknowns, currentStarsNeeded, tiling } = prep;

  if (tiling.capacity <= currentStarsNeeded) return false;
  if (currentUnknowns.length >= currentStarsNeeded * 8) return false;

  return enumerationMarks(currentUnknowns, currentStarsNeeded, board, cells, analysis);
}

/**
 * Confinement + Enumeration (slack tiling) → Placements.
 * Slack tiling on composite: enumerate placements, place cells in all.
 */
export function analyzeCompositeEnumerationPlacements(
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const prep = prepareComposite(composite, cells, analysis.size);
  if (!prep) return false;
  const { currentUnknowns, currentStarsNeeded, tiling } = prep;

  if (tiling.capacity <= currentStarsNeeded) return false;
  if (currentUnknowns.length >= currentStarsNeeded * 8) return false;

  return enumerationPlacements(currentUnknowns, currentStarsNeeded, board, cells, analysis);
}
