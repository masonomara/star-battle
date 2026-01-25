/**
 * Rule 8: Exclusion
 *
 * Marks cells where a hypothetical star would make some region unable to fit
 * its required stars. If placing a star at (r,c) and marking its 8 neighbors
 * would reduce a region's tileable area below starsNeeded, mark (r,c).
 *
 * Optimized to:
 * 1. Pre-filter regions - skip regions with lots of slack
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

    for (const [r, c] of coords) {
      cellSet.add(cellKey(r, c));
      if (cells[r][c] === "star") stars++;
      else if (cells[r][c] === "unknown") unknownCoords.push([r, c]);
    }

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    // Pre-filter: skip regions with lots of slack
    // If unknowns >> needed, hypothetical marks won't break it
    if (unknownCoords.length > needed * 4) continue;

    result.push({ id, coords, unknownCoords, needed, cellSet });
  }

  return result;
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
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        nearbyKeys.add(cellKey(nr, nc));
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
 * Check if placing a star at (row, col) would break any of the given regions.
 */
function wouldBreakRegion(
  row: number,
  col: number,
  regionInfos: RegionInfo[],
  size: number,
  grid: number[][],
): boolean {
  // Build set of cells that would be marked by this star
  const markedCells = new Set<string>();
  markedCells.add(cellKey(row, col));
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        markedCells.add(cellKey(nr, nc));
      }
    }
  }

  for (const info of regionInfos) {
    // Count remaining unknown cells after hypothetical marks
    const remainingUnknown: Coord[] = [];
    let starInRegion = false;

    for (const [r, c] of info.unknownCoords) {
      const key = cellKey(r, c);
      if (r === row && c === col) {
        starInRegion = true;
      } else if (!markedCells.has(key)) {
        remainingUnknown.push([r, c]);
      }
    }

    const adjustedNeed = starInRegion ? info.needed - 1 : info.needed;
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

  if (regionInfos.length === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      // Only check regions that could be affected by this cell
      const affected = getAffectedRegions(row, col, regionInfos, size);
      if (affected.length === 0) continue;

      if (wouldBreakRegion(row, col, affected, size, board.grid)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
