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
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";

export default functionpropagatedRowCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) =>
    state.violation === "row" || state.violation === "adjacency",
  );
}
