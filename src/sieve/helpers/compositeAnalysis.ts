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

