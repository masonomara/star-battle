/**
 * Hypothetical Counting Row
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if any group of rows needs more stars than its touching regions
 * can provide. If so, mark the cell.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop, propagatedCountingViolation } from "../../helpers/hypothetical";

export default function hypotheticalCountingRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, false, (_row, _col, state) =>
    propagatedCountingViolation(board, cells, state.starKeys, state.marked, analysis, "row"),
  );
}
