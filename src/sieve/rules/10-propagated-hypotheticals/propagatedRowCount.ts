/**
 * Propagated Hypothetical Row Count
 *
 * Observation: Propagated hypothetical state
 * Technique:   Hypothetical
 * Deduction:   Mark — if any row can't meet its star quota,
 *              or if forced stars are adjacent
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { propagateHypothetical } from "../../helpers/propagateHypothetical";

export default function propagatedRowCount(
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

      const { violation } = propagateHypothetical(board, cells, row, col, analysis);
      if (violation === "row" || violation === "adjacency") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
