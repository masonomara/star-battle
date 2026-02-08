/**
 * Propagated Hypothetical Count
 *
 * Observation: Propagated hypothetical state
 * Technique:   Hypothetical
 * Deduction:   Mark — if any row, column, or region can't meet its star quota
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { propagateHypothetical } from "../../helpers/propagateHypothetical";

export default function propagatedCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const { violated } = propagateHypothetical(board, cells, row, col, analysis);
      if (violated) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}
