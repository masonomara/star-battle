/**
 * Propagated Hypothetical Counting Column
 *
 * Observation: Propagated hypothetical state + counting constraints
 * Technique:   Hypothetical
 * Deduction:   Mark — if any group of columns needs more stars
 *              than its touching regions can provide
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";
import { propagatedCountingViolation } from "./propagatedCountingHelper";

export default function propagatedCountingColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) => {
    if (state.violation !== null) return false;
    return propagatedCountingViolation(board, cells, state.starKeys, state.marked, analysis, "col");
  });
}
