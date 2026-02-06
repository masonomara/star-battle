/**
 * Rule: Squeeze Forced (Level 5 — Tiling + Enumeration)
 *
 * O: Tiling of consecutive row/col pairs
 * T: Enumerate minimal 2x2 tilings, find universals
 * D: Placements
 *
 * When a consecutive row pair or column pair has a tight tiling
 * (capacity equals starsNeeded), cells with single-coverage in
 * ALL minimal tilings must be stars.
 */

import { Board, CellState, Coord } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

export default function squeezeForced(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  const starsPerPair = board.stars * 2;

  // Row pairs
  for (let row = 0; row < size - 1; row++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "unknown") pairCells.push([row, col]);
      if (cells[row + 1][col] === "unknown") pairCells.push([row + 1, col]);
      if (cells[row][col] === "star") existingStars++;
      if (cells[row + 1][col] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;

    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;

    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        return applyDeductions(cells, [{ coord: [r, c], state: "star" }]);
      }
    }
  }

  // Column pairs
  for (let col = 0; col < size - 1; col++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "unknown") pairCells.push([row, col]);
      if (cells[row][col + 1] === "unknown") pairCells.push([row, col + 1]);
      if (cells[row][col] === "star") existingStars++;
      if (cells[row][col + 1] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;

    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;

    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        return applyDeductions(cells, [{ coord: [r, c], state: "star" }]);
      }
    }
  }

  return false;
}
