/**
 * Rule 12c: Adjacent Region Capacity
 *
 * Marks cells where placing a hypothetical star would break an adjacent
 * region's ability to fit its required stars.
 *
 * For each region adjacent to the candidate cell (but not containing it):
 * 1. Simulate placing a star at the candidate
 * 2. Mark all cells adjacent to the star as unavailable
 * 3. Check if the region can still fit its required stars
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/cellKey";
import { computeTiling } from "../../helpers/tiling";

function checkAdjacentRegionViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  const starRegionId = board.grid[starRow][starCol];
  const starKey = cellKey(starRow, starCol);

  // Find all regions that have cells adjacent to the star position
  const affectedRegions = new Set<number>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = starRow + dr;
      const nc = starCol + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const regionId = board.grid[nr][nc];
        if (regionId !== starRegionId) {
          affectedRegions.add(regionId);
        }
      }
    }
  }

  // Check each affected region
  for (const regionId of affectedRegions) {
    const region = analysis.regions.get(regionId);
    if (!region || region.starsNeeded <= 0) continue;

    // Collect remaining cells after placing star at (starRow, starCol)
    const remainingCells: Coord[] = [];
    for (const [r, c] of region.unknownCoords) {
      const key = cellKey(r, c);
      // Skip if this cell is adjacent to the hypothetical star
      const isAdjacent =
        Math.abs(r - starRow) <= 1 && Math.abs(c - starCol) <= 1;
      if (!isAdjacent && key !== starKey) {
        remainingCells.push([r, c]);
      }
    }

    // Check if region can still fit its stars
    if (remainingCells.length < region.starsNeeded) {
      return true;
    }

    if (computeTiling(remainingCells, size).capacity < region.starsNeeded) {
      return true;
    }
  }

  return false;
}

export default function adjacentRegionCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      if (checkAdjacentRegionViolation(row, col, board, cells, analysis)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
