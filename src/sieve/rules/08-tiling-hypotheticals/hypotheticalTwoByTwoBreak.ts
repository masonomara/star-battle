/**
 * Rule 12e: Hypothetical 2×2 Break
 *
 * Marks cells where placing a star would make a 2×2 constraint unsatisfiable.
 *
 * A 2×2 constraint is a tile from squeeze analysis that must contain
 * exactly one star.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can all affected 2×2 constraints still get their star?"
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/oneByN";
import {
  findStarContaining2x2s,
  StarContaining2x2,
} from "../../helpers/starContaining2x2";

function checkTwoByTwoViolation(
  starRow: number,
  starCol: number,
  markedCells: Set<string>,
  twoByTwoConstraints: StarContaining2x2[],
): boolean {
  for (const constraint of twoByTwoConstraints) {
    // Check if the hypothetical star is in this constraint
    const starInConstraint = constraint.cells.some(
      ([r, c]) => r === starRow && c === starCol,
    );

    // If star is in constraint, it's satisfied
    if (starInConstraint) continue;

    // Count remaining cells in the constraint after marking
    let remainingInConstraint = 0;
    for (const [r, c] of constraint.cells) {
      const key = `${r},${c}`;
      if (!markedCells.has(key)) {
        remainingInConstraint++;
      }
    }

    // 2×2 needs exactly 1 star - if no cells remain, violation
    if (remainingInConstraint === 0) {
      return true;
    }
  }

  return false;
}

export default function hypotheticalTwoByTwoBreak(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  // Precompute 2×2 constraints once
  const twoByTwoConstraints = findStarContaining2x2s(board, cells);
  if (twoByTwoConstraints.length === 0) return false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (checkTwoByTwoViolation(row, col, markedCells, twoByTwoConstraints)) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}
