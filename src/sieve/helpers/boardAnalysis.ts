import { Board, CellState, Coord, TilingResult } from "./types";
import buildRegions from "./regions";
import { computeTiling } from "./tiling";

/** Static per-region data (computed once from the board grid) */
export type RegionStructure = {
  id: number;
  coords: Coord[];
  rows: Set<number>;
  cols: Set<number>;
};

/** Static board structure (computed once, never changes) */
export type BoardStructure = {
  size: number;
  numCols: number;
  stars: number;
  regions: Map<number, RegionStructure>;
};

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

/** Pre-computed board analysis */
export type BoardAnalysis = {
  size: number;
  regions: Map<number, RegionMeta>;
  rowStars: number[];
  colStars: number[];
  rowToRegions: Map<number, Set<number>>;
  colToRegions: Map<number, Set<number>>;
  tilingCache: Map<string, TilingResult>;
  getTiling: (cells: Coord[]) => TilingResult;
};

export function capacity(cells: Coord[], analysis: BoardAnalysis): number {
  return analysis.getTiling(cells).capacity;
}

/** Build static board structure once from the board definition. */
export function buildBoardStructure(board: Board): BoardStructure {
  const size = board.grid.length;
  const numCols = board.grid[0]?.length ?? 0;
  const rawRegions = buildRegions(board.grid);

  const regions = new Map<number, RegionStructure>();
  for (const [id, coords] of rawRegions) {
    const rows = new Set<number>();
    const cols = new Set<number>();
    for (const [row, col] of coords) {
      rows.add(row);
      cols.add(col);
    }
    regions.set(id, { id, coords, rows, cols });
  }

  return { size, numCols, stars: board.stars, regions };
}

/** Build cell-state-dependent analysis from pre-computed structure. */
export function buildBoardAnalysis(
  structure: BoardStructure,
  cells: CellState[][],
  tilingCache: Map<string, TilingResult> = new Map(),
): BoardAnalysis {
  const { size, numCols, stars, regions: structRegions } = structure;

  const regions = new Map<number, RegionMeta>();
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(numCols).fill(0);

  for (const [id, sr] of structRegions) {
    const unknownCoords: Coord[] = [];
    const unknownRows = new Set<number>();
    const unknownCols = new Set<number>();
    let starsPlaced = 0;

    for (const [row, col] of sr.coords) {
      const cell = cells[row][col];
      if (cell === "unknown") {
        unknownCoords.push([row, col]);
        unknownRows.add(row);
        unknownCols.add(col);
      } else if (cell === "star") {
        starsPlaced++;
        rowStars[row]++;
        colStars[col]++;
      }
    }

    regions.set(id, {
      id,
      coords: sr.coords,
      unknownCoords,
      starsPlaced,
      starsNeeded: stars - starsPlaced,
      rows: sr.rows,
      cols: sr.cols,
      unknownRows,
      unknownCols,
    });
  }

  // Build row -> regions and col -> regions mappings
  const rowToRegions = new Map<number, Set<number>>();
  const colToRegions = new Map<number, Set<number>>();

  for (let i = 0; i < size; i++) {
    rowToRegions.set(i, new Set());
  }
  for (let i = 0; i < numCols; i++) {
    colToRegions.set(i, new Set());
  }

  for (const [id, meta] of regions) {
    for (const row of meta.unknownRows) {
      rowToRegions.get(row)!.add(id);
    }
    for (const col of meta.unknownCols) {
      colToRegions.get(col)!.add(id);
    }
  }

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
    rowToRegions,
    colToRegions,
    tilingCache,
    getTiling,
  };
}
