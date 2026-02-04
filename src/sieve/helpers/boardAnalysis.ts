import { Board, CellState, Coord, Progress, TilingResult } from "./types";
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

/** Pre-computed board analysis including progress status */
export type BoardAnalysis = {
  status: Progress;
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
  const rowAvailable = new Array(size).fill(0);
  const colAvailable = new Array(numCols).fill(0);

  let hasAdjacentStars = false;

  // Build region metadata, count stars, check adjacency
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

      const cell = cells[row][col];

      if (cell === "unknown") {
        unknownCoords.push([row, col]);
        unknownRows.add(row);
        unknownCols.add(col);
        rowAvailable[row]++;
        colAvailable[col]++;
      } else if (cell === "star") {
        starsPlaced++;
        rowStars[row]++;
        colStars[col]++;
        rowAvailable[row]++;
        colAvailable[col]++;

        // Check adjacency (only right and down to avoid double-checking)
        if (!hasAdjacentStars) {
          if (col + 1 < size && cells[row][col + 1] === "star") {
            hasAdjacentStars = true;
          } else if (row + 1 < size) {
            if (cells[row + 1][col] === "star") hasAdjacentStars = true;
            else if (col > 0 && cells[row + 1][col - 1] === "star") hasAdjacentStars = true;
            else if (col + 1 < size && cells[row + 1][col + 1] === "star") hasAdjacentStars = true;
          }
        }
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

  // Determine status
  let status: Progress = "solved";

  if (hasAdjacentStars) {
    status = "invalid";
  } else {
    // Check capacity and completion
    for (let i = 0; i < size; i++) {
      if (rowAvailable[i] < board.stars || colAvailable[i] < board.stars) {
        status = "invalid";
        break;
      }
      if (rowStars[i] !== board.stars || colStars[i] !== board.stars) {
        status = "valid";
      }
    }

    if (status !== "invalid") {
      for (const region of regions.values()) {
        const available = region.unknownCoords.length + region.starsPlaced;
        if (available < board.stars) {
          status = "invalid";
          break;
        }
        if (region.starsPlaced !== board.stars) {
          status = "valid";
        }
      }
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
    status,
    size,
    regions,
    rowStars,
    colStars,
    tilingCache,
    getTiling,
  };
}
