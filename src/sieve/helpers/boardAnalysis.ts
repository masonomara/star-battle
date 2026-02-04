import { Board, CellState, Coord, TilingResult } from "./types";
import buildRegions from "./regions";
import { coordKey } from "./cellKey";
import { computeTiling } from "./tiling";

/** Pre-computed region metadata for solver rules */
export type RegionMeta = {
  id: number;
  coords: Coord[];
  unknownCoords: Coord[];
  starsPlaced: number;
  starsNeeded: number;
  rows: Set<number>;
  cols: Set<number>;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
};

/** Pre-computed board analysis for counting-based rules */
export type BoardAnalysis = {
  size: number;
  regions: Map<number, RegionMeta>;
  rowStars: number[];
  colStars: number[];
  forcedLoneCells: Coord[];
  tilingCache: Map<string, TilingResult>;
  getTiling: (cells: Coord[]) => TilingResult;
};

export function capacity(cells: Coord[], analysis: BoardAnalysis): number {
  return analysis.getTiling(cells).capacity;
}

/**
 * Find connected components of coordinates using 8-connected adjacency.
 */
function findIslands(coords: Coord[]): Coord[][] {
  if (coords.length === 0) return [];

  const coordSet = new Set(coords.map(coordKey));
  const visited = new Set<string>();
  const islands: Coord[][] = [];

  for (const coord of coords) {
    const key = coordKey(coord);
    if (visited.has(key)) continue;

    const island: Coord[] = [];
    const queue: Coord[] = [coord];
    visited.add(key);

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      island.push([row, col]);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nKey = coordKey([row + dr, col + dc]);
          if (coordSet.has(nKey) && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push([row + dr, col + dc]);
          }
        }
      }
    }
    islands.push(island);
  }
  return islands;
}

/**
 * Check if cells fit within a 2x2 bounding box.
 */
function fitsIn2x2(coords: Coord[]): boolean {
  if (coords.length <= 1) return true;

  const rows = coords.map((c) => c[0]);
  const cols = coords.map((c) => c[1]);
  const height = Math.max(...rows) - Math.min(...rows) + 1;
  const width = Math.max(...cols) - Math.min(...cols) + 1;

  return height <= 2 && width <= 2;
}

/**
 * Find forced lone cells in a container (row, column, or region).
 * When unknowns split into N small islands and N stars are needed,
 * any lone cell (single-cell island) must be a star.
 */
function findForcedLoneCellsInContainer(
  unknowns: Coord[],
  starsNeeded: number,
): Coord[] {
  if (starsNeeded <= 0) return [];
  if (unknowns.length <= starsNeeded) return []; // Simple forced placement handles this

  const islands = findIslands(unknowns);
  if (islands.length <= 1) return [];

  // All islands must be small (fit in 2x2)
  for (const island of islands) {
    if (!fitsIn2x2(island)) return [];
  }

  // Number of islands must equal stars needed (no slack)
  if (islands.length !== starsNeeded) return [];

  // Collect lone cells
  const loneCells: Coord[] = [];
  for (const island of islands) {
    if (island.length === 1) {
      loneCells.push(island[0]);
    }
  }

  return loneCells;
}

export function buildBoardAnalysis(
  board: Board,
  cells: CellState[][],
): BoardAnalysis {
  const size = board.grid.length;
  const numCols = board.grid[0]?.length ?? 0;
  const rawRegions = buildRegions(board.grid);

  const regions = new Map<number, RegionMeta>();
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(numCols).fill(0);

  // First pass: build region metadata and count stars
  for (const [id, coords] of rawRegions) {
    const unknownCoords: Coord[] = [];
    const rows = new Set<number>();
    const cols = new Set<number>();
    const unknownRows = new Set<number>();
    const unknownCols = new Set<number>();
    let starsPlaced = 0;

    for (const [row, col] of coords) {
      rows.add(row);
      cols.add(col);

      if (cells[row][col] === "unknown") {
        unknownCoords.push([row, col]);
        unknownRows.add(row);
        unknownCols.add(col);
      } else if (cells[row][col] === "star") {
        starsPlaced++;
        rowStars[row]++;
        colStars[col]++;
      }
    }

    const starsNeeded = board.stars - starsPlaced;

    regions.set(id, {
      id,
      coords,
      unknownCoords,
      starsPlaced,
      starsNeeded,
      rows,
      cols,
      unknownRows,
      unknownCols,
    });
  }

  // Second pass: find forced lone cells
  const forcedLoneCellSet = new Set<string>();
  const forcedLoneCells: Coord[] = [];

  const addLoneCell = (coord: Coord) => {
    const key = coordKey(coord);
    if (!forcedLoneCellSet.has(key)) {
      forcedLoneCellSet.add(key);
      forcedLoneCells.push(coord);
    }
  };

  // Check rows
  for (let row = 0; row < size; row++) {
    const unknowns: Coord[] = [];
    for (let col = 0; col < numCols; col++) {
      if (cells[row][col] === "unknown") {
        unknowns.push([row, col]);
      }
    }
    const starsNeeded = board.stars - rowStars[row];
    for (const coord of findForcedLoneCellsInContainer(unknowns, starsNeeded)) {
      addLoneCell(coord);
    }
  }

  // Check columns
  for (let col = 0; col < numCols; col++) {
    const unknowns: Coord[] = [];
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "unknown") {
        unknowns.push([row, col]);
      }
    }
    const starsNeeded = board.stars - colStars[col];
    for (const coord of findForcedLoneCellsInContainer(unknowns, starsNeeded)) {
      addLoneCell(coord);
    }
  }

  // Check regions
  for (const [, meta] of regions) {
    for (const coord of findForcedLoneCellsInContainer(
      meta.unknownCoords,
      meta.starsNeeded,
    )) {
      addLoneCell(coord);
    }
  }

  const tilingCache = new Map<string, TilingResult>();

  const getTiling = (coords: Coord[]): TilingResult => {
    if (coords.length === 0) {
      return { capacity: 0, tilings: [[]], forcedCells: [] };
    }

    const key = coords
      .map(([r, c]) => `${r},${c}`)
      .sort()
      .join("|");

    let result = tilingCache.get(key);
    if (!result) {
      result = computeTiling(coords, size);
      tilingCache.set(key, result);
    }
    return result;
  };

  return {
    size,
    regions,
    rowStars,
    colStars,
    forcedLoneCells,
    tilingCache,
    getTiling,
  };
}
