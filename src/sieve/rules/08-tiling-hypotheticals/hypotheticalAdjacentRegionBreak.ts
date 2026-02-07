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
import { computeTiling } from "../../helpers/tiling";
import { neighbors } from "../../helpers/neighbors";

function checkAdjacentRegionViolation(
  starRow: number,
  starCol: number,
  board: Board,
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  const starRegionId = board.grid[starRow][starCol];
  const starKey = `${starRow},${starCol}`;

  // Find all regions that have cells adjacent to the star position
  const affectedRegions = new Set<number>();
  for (const [nr, nc] of neighbors(starRow, starCol, size)) {
    const regionId = board.grid[nr][nc];
    if (regionId !== starRegionId) {
      affectedRegions.add(regionId);
    }
  }

  // Check each affected region
  for (const regionId of affectedRegions) {
    const region = analysis.regions.get(regionId);
    if (!region || region.starsNeeded <= 0) continue;

    // Collect remaining cells after placing star at (starRow, starCol)
    const remainingCells: Coord[] = [];
    for (const [r, c] of region.unknownCoords) {
      // Skip if this cell is adjacent to the hypothetical star
      const isAdjacent =
        Math.abs(r - starRow) <= 1 && Math.abs(c - starCol) <= 1;
      if (!isAdjacent && `${r},${c}` !== starKey) {
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

export default function hypotheticalAdjacentRegionBreak(
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

      if (checkAdjacentRegionViolation(row, col, board, analysis)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
