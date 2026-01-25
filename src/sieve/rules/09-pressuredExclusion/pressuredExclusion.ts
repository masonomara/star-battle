/**
 * Rule 9: Pressured Exclusion
 *
 * Like exclusion, but focused on "tight" regions where minTileCount === starsNeeded.
 * These regions have no slack - any cell whose hypothetical star placement would
 * reduce the region's tileable area below the required star count gets marked.
 *
 * Optimized to:
 * 1. Pre-filter regions - only check small regions that might be tight
 * 2. Only check cells adjacent to tight regions, not all cells
 * 3. Use cheaper tiling checks where possible
 */

import buildRegions from "../../helpers/regions";
import { canTileWithMinCount } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";
import { cellKey } from "../../helpers/cellKey";

type TightRegion = {
  id: number;
  coords: Coord[];
  unknownCoords: Coord[];
  starsNeeded: number;
};

/**
 * Find regions that are "tight" - where minTileCount equals stars still needed.
 * Uses pre-filtering to avoid expensive tiling on regions with obvious slack.
 */
function findTightRegions(
  board: Board,
  cells: CellState[][],
  regions: Map<number, Coord[]>,
  size: number,
): TightRegion[] {
  const tightRegions: TightRegion[] = [];

  for (const [id, coords] of regions) {
    // Count existing stars and unknown cells
    let existingStars = 0;
    const unknownCoords: Coord[] = [];

    for (const [r, c] of coords) {
      if (cells[r][c] === "star") existingStars++;
      else if (cells[r][c] === "unknown") unknownCoords.push([r, c]);
    }

    const starsNeeded = board.stars - existingStars;
    if (starsNeeded <= 0) continue;

    // Pre-filter: if many unknown cells, region has slack (not tight)
    // A tight region needs minTiles === starsNeeded, which means
    // unknown cells are tightly packed. Skip regions with lots of room.
    if (unknownCoords.length > starsNeeded * 3) continue;

    // Check if region can tile with MORE than starsNeeded
    // If it can, it has slack and isn't tight
    if (canTileWithMinCount(unknownCoords, size, starsNeeded + 1)) continue;

    // Verify it CAN tile with exactly starsNeeded (otherwise it's broken, not tight)
    if (!canTileWithMinCount(unknownCoords, size, starsNeeded)) continue;

    tightRegions.push({ id, coords, unknownCoords, starsNeeded });
  }

  return tightRegions;
}

/**
 * Get all cells adjacent to any cell in the tight regions.
 * Only these cells can affect tight regions via neighbor marks.
 */
function getCellsAdjacentToTightRegions(
  tightRegions: TightRegion[],
  cells: CellState[][],
  size: number,
): Set<string> {
  const adjacent = new Set<string>();

  for (const region of tightRegions) {
    for (const [r, c] of region.unknownCoords) {
      // Check all 8 neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (cells[nr][nc] === "unknown") {
              adjacent.add(cellKey(nr, nc));
            }
          }
        }
      }
    }
  }

  return adjacent;
}

/**
 * Check if placing a star at (row, col) would break any tight region.
 * Returns true if any tight region becomes unsolvable.
 */
function wouldBreakAnyTightRegion(
  row: number,
  col: number,
  tightRegions: TightRegion[],
  cells: CellState[][],
  size: number,
  board: Board,
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

  for (const region of tightRegions) {
    // Count how many unknown cells would remain after this star
    const remainingUnknown: Coord[] = [];
    let starInRegion = false;

    for (const [r, c] of region.unknownCoords) {
      const key = cellKey(r, c);
      if (r === row && c === col) {
        starInRegion = true;
      } else if (!markedCells.has(key)) {
        remainingUnknown.push([r, c]);
      }
    }

    const adjustedNeed = starInRegion ? region.starsNeeded - 1 : region.starsNeeded;
    if (adjustedNeed <= 0) continue;

    // Quick check: if not enough cells remain, it's broken
    if (remainingUnknown.length < adjustedNeed) return true;

    // Tiling check: can remaining cells fit the required stars?
    if (!canTileWithMinCount(remainingUnknown, size, adjustedNeed)) {
      return true;
    }
  }

  return false;
}

export default function pressuredExclusion(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  const regions = buildRegions(board.grid);
  const tightRegions = findTightRegions(board, cells, regions, size);

  // No tight regions means no pressure-based exclusions possible
  if (tightRegions.length === 0) return false;

  // Only check cells adjacent to tight regions
  const cellsToCheck = getCellsAdjacentToTightRegions(tightRegions, cells, size);
  if (cellsToCheck.size === 0) return false;

  let changed = false;

  for (const key of cellsToCheck) {
    const [row, col] = key.split(",").map(Number);
    if (cells[row][col] !== "unknown") continue;

    if (wouldBreakAnyTightRegion(row, col, tightRegions, cells, size, board)) {
      cells[row][col] = "marked";
      changed = true;
    }
  }

  return changed;
}
