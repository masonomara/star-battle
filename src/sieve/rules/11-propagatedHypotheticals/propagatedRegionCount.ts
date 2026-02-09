/**
 * Propagated Hypothetical Region Count
 *
 * Observation: Propagated hypothetical state
 * Technique:   Hypothetical
 * Deduction:   Mark — if any region can't meet its star quota
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";

export default functionpropagatedRegionCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) =>
    state.violation === "region",
  );
}
