/**
 * Rule 10: Exclusion
 *
 * Marks cells where a hypothetical star would make some region, row, or column
 * unable to fit its required stars. If placing a star at (r,c) and marking its
 * 8 neighbors would reduce a region/row/column's tileable area below starsNeeded,
 * mark (r,c).
 *
 * Optimized to:
 * 1. Pre-filter regions/rows/cols - skip those with lots of slack
 * 2. Only check affected regions - regions with cells near the hypothetical star
 * 3. Use canTileWithMinCount instead of findAllMinimalTilings
 */

import buildRegions from "../../helpers/regions";
import { canTileWithMinCount } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";
import { cellKey } from "../../helpers/cellKey";

type RegionInfo = {
  id: number;
  coords: Coord[];
  unknownCoords: Coord[];
  needed: number;
  cellSet: Set<string>; // For fast membership check
};

type LineInfo = {
  index: number;
  unknownCoords: Coord[];
  needed: number;
};

/**
 * Build region info with pre-filtering.
 * Skip regions with obvious slack (many unknown cells relative to stars needed).
 */
function buildRegionInfo(
  board: Board,
  cells: CellState[][],
  regions: Map<number, Coord[]>,
): RegionInfo[] {
  const result: RegionInfo[] = [];

  for (const [id, coords] of regions) {
    let stars = 0;
    const unknownCoords: Coord[] = [];
    const cellSet = new Set<string>();

    for (const [row, col] of coords) {
      cellSet.add(cellKey(row, col));
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknownCoords.push([row, col]);
    }

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    // No pre-filter - check all regions

    result.push({ id, coords, unknownCoords, needed, cellSet });
  }

  return result;
}

/**
 * Build row and column info with pre-filtering.
 */
function buildLineInfo(
  board: Board,
  cells: CellState[][],
): { rows: LineInfo[]; cols: LineInfo[] } {
  const size = board.grid.length;
  const rows: LineInfo[] = [];
  const cols: LineInfo[] = [];

  // Build row info
  for (let row = 0; row < size; row++) {
    let stars = 0;
    const unknownCoords: Coord[] = [];

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknownCoords.push([row, col]);
    }

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    // No pre-filter - check all rows

    rows.push({ index: row, unknownCoords, needed });
  }

  // Build column info
  for (let col = 0; col < size; col++) {
    let stars = 0;
    const unknownCoords: Coord[] = [];

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknownCoords.push([row, col]);
    }

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    // No pre-filter - check all columns

    cols.push({ index: col, unknownCoords, needed });
  }

  return { rows, cols };
}

/**
 * Get regions that could be affected by a star at (row, col).
 * A region is affected if any of its cells are within distance 1 of (row, col).
 */
function getAffectedRegions(
  row: number,
  col: number,
  regionInfos: RegionInfo[],
  size: number,
): RegionInfo[] {
  const affected: RegionInfo[] = [];

  // Build set of cells in the 3x3 area around (row, col)
  const nearbyKeys = new Set<string>();
  for (let drow = -1; drow <= 1; drow++) {
    for (let dcol = -1; dcol <= 1; dcol++) {
      const nrow = row + drow;
      const ncol = col + dcol;
      if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
        nearbyKeys.add(cellKey(nrow, ncol));
      }
    }
  }

  for (const info of regionInfos) {
    // Check if any region cell is nearby
    for (const key of nearbyKeys) {
      if (info.cellSet.has(key)) {
        affected.push(info);
        break;
      }
    }
  }

  return affected;
}

/**
 * Build set of cells that would be marked by placing a star at (row, col).
 */
function buildMarkedCells(row: number, col: number, size: number): Set<string> {
  const markedCells = new Set<string>();
  markedCells.add(cellKey(row, col));
  for (let drow = -1; drow <= 1; drow++) {
    for (let dcol = -1; dcol <= 1; dcol++) {
      if (drow === 0 && dcol === 0) continue;
      const nrow = row + drow;
      const ncol = col + dcol;
      if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
        markedCells.add(cellKey(nrow, ncol));
      }
    }
  }
  return markedCells;
}

/**
 * Check if placing a star at (row, col) would break any of the given regions.
 */
function wouldBreakRegion(
  row: number,
  col: number,
  regionInfos: RegionInfo[],
  markedCells: Set<string>,
  size: number,
): boolean {
  for (const info of regionInfos) {
    // Count remaining unknown cells after hypothetical marks
    const remainingUnknown: Coord[] = [];
    let starInRegion = false;

    for (const [urow, ucol] of info.unknownCoords) {
      const key = cellKey(urow, ucol);
      if (urow === row && ucol === col) {
        starInRegion = true;
      } else if (!markedCells.has(key)) {
        remainingUnknown.push([urow, ucol]);
      }
    }

    const adjustedNeed = starInRegion ? info.needed - 1 : info.needed;

    if (adjustedNeed <= 0) continue;

    // Quick check: not enough cells remain
    if (remainingUnknown.length < adjustedNeed) {
      return true;
    }

    // Tiling check: can remaining cells fit required stars?
    if (!canTileWithMinCount(remainingUnknown, size, adjustedNeed)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if placing a star at (row, col) would break any row or column.
 */
function wouldBreakLine(
  row: number,
  col: number,
  rowInfos: LineInfo[],
  colInfos: LineInfo[],
  markedCells: Set<string>,
  size: number,
): boolean {
  // Check rows that could be affected (row-1, row, row+1)
  for (const info of rowInfos) {
    if (Math.abs(info.index - row) > 1) continue;

    const remainingUnknown: Coord[] = [];
    let starInLine = false;

    for (const [urow, ucol] of info.unknownCoords) {
      const key = cellKey(urow, ucol);
      if (urow === row && ucol === col) {
        starInLine = true;
      } else if (!markedCells.has(key)) {
        remainingUnknown.push([urow, ucol]);
      }
    }

    const adjustedNeed = starInLine ? info.needed - 1 : info.needed;
    if (adjustedNeed <= 0) continue;

    // Quick check: not enough cells remain
    if (remainingUnknown.length < adjustedNeed) return true;

    // Tiling check: can remaining cells fit required stars?
    if (!canTileWithMinCount(remainingUnknown, size, adjustedNeed)) {
      return true;
    }
  }

  // Check columns that could be affected (col-1, col, col+1)
  for (const info of colInfos) {
    if (Math.abs(info.index - col) > 1) continue;

    const remainingUnknown: Coord[] = [];
    let starInLine = false;

    for (const [urow, ucol] of info.unknownCoords) {
      const key = cellKey(urow, ucol);
      if (urow === row && ucol === col) {
        starInLine = true;
      } else if (!markedCells.has(key)) {
        remainingUnknown.push([urow, ucol]);
      }
    }

    const adjustedNeed = starInLine ? info.needed - 1 : info.needed;
    if (adjustedNeed <= 0) continue;

    // Quick check: not enough cells remain
    if (remainingUnknown.length < adjustedNeed) return true;

    // Tiling check: can remaining cells fit required stars?
    if (!canTileWithMinCount(remainingUnknown, size, adjustedNeed)) {
      return true;
    }
  }

  return false;
}

export default function exclusion(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  const regionInfos = buildRegionInfo(board, cells, regions);
  const { rows: rowInfos, cols: colInfos } = buildLineInfo(board, cells);

  // No constrained regions or lines to check
  if (
    regionInfos.length === 0 &&
    rowInfos.length === 0 &&
    colInfos.length === 0
  ) {
    return false;
  }

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCells(row, col, size);

      // Check regions
      if (regionInfos.length > 0) {
        const affected = getAffectedRegions(row, col, regionInfos, size);

        if (
          affected.length > 0 &&
          wouldBreakRegion(row, col, affected, markedCells, size)
        ) {
          cells[row][col] = "marked";
          changed = true;
          continue;
        }
      }

      // Check rows and columns
      if (rowInfos.length > 0 || colInfos.length > 0) {
        if (wouldBreakLine(row, col, rowInfos, colInfos, markedCells, size)) {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}
