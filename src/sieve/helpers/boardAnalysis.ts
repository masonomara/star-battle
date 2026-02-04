import { Board, CellState, Coord, TilingResult } from "./types";
import buildRegions from "./regions";
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
  tilingCache: Map<string, TilingResult>;
  getTiling: (cells: Coord[]) => TilingResult;
};

export function capacity(cells: Coord[], analysis: BoardAnalysis): number {
  return analysis.getTiling(cells).capacity;
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
    tilingCache,
    getTiling,
  };
}
