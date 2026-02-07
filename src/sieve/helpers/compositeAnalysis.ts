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
  cells: Coord[];
  unknownCells: Coord[];
  starsNeeded: number;
};

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

  const composite: Composite = {
    cells: complementCells,
    unknownCells: complementCells,
    starsNeeded: complementStars,
  };

  return analyze(composite, board, cells, analysis);
}

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

export function forEachCombinationComposite(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  analyze: CompositeAnalyzer,
  returnOnFirst = true,
): boolean {
  const { regions } = analysis;

  const activeRegions = new Map<number, RegionMeta>();
  for (const [id, meta] of regions) {
    if (meta.starsNeeded > 0 && meta.unknownCoords.length > 0) {
      activeRegions.set(id, meta);
    }
  }

  if (activeRegions.size < 2) return false;

  const adjacency = buildAdjacencyGraph(board, activeRegions);
  let changed = false;

  for (const [id1, neighborIds] of adjacency) {
    const r1 = activeRegions.get(id1);
    if (!r1) continue;

    for (const id2 of neighborIds) {
      if (id2 <= id1) continue;

      const r2 = activeRegions.get(id2);
      if (!r2) continue;

      const starsNeeded = r1.starsNeeded + r2.starsNeeded;
      if (starsNeeded <= 0) continue;

      const allCoords = [...r1.unknownCoords, ...r2.unknownCoords];
      const unknownCells = allCoords.filter(
        ([r, c]) => cells[r][c] === "unknown",
      );

      if (unknownCells.length === 0) continue;

      const composite: Composite = {
        cells: allCoords,
        unknownCells,
        starsNeeded,
      };

      if (analyze(composite, board, cells, analysis)) {
        if (returnOnFirst) return true;
        changed = true;
      }
    }
  }

  return changed;
}

export function forEachContiguousBand(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
  returnOnFirst = true,
): boolean {
  const { size } = analysis;
  let changed = false;

  for (let start = 0; start < size; start++) {
    for (let width = 2; width < size; width++) {
      const end = start + width;
      if (end > size) break;
      const bandLines = Array.from({ length: width }, (_, i) => start + i);
      if (findComplementInBand(bandLines, board, cells, analysis, axis, analyze)) {
        if (returnOnFirst) return true;
        changed = true;
      }
    }
  }

  return changed;
}

export function forEachRegionBand(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
  returnOnFirst = true,
): boolean {
  const { regions } = analysis;
  let changed = false;

  const unknownLines = axis === "row" ? "unknownRows" : "unknownCols";
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0 || region[unknownLines].size < 2) continue;
    const bandLines = [...region[unknownLines]];
    if (findComplementInBand(bandLines, board, cells, analysis, axis, analyze)) {
      if (returnOnFirst) return true;
      changed = true;
    }
  }

  return changed;
}

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

  for (const [frow, fcol] of tiling.forcedCells) {
    if (cells[frow][fcol] !== "unknown") continue;

    let hasAdjacentStar = false;
    for (const [nr, nc] of neighbors(frow, fcol, size)) {
      if (cells[nr][nc] === "star") {
        hasAdjacentStar = true;
        break;
      }
    }
    if (hasAdjacentStar) continue;

    if (analysis.rowStars[frow] >= board.stars || analysis.colStars[fcol] >= board.stars) continue;
    const regionId = board.grid[frow][fcol];
    const regionMeta = analysis.regions.get(regionId);
    if (regionMeta && regionMeta.starsPlaced >= board.stars) continue;

    cells[frow][fcol] = "star";
    return true;
  }
  return false;
}

