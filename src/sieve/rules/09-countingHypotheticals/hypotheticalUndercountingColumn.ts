/**
 * Hypothetical Counting Column
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if any group of columns needs more stars than its touching regions
 * can provide. If so, mark the cell.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";
import { propagatedCountingViolation } from "../11-propagatedHypotheticals/propagatedCountingHelper";

export default functionhypotheticalCountingColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, false, (_row, _col, state) =>
    propagatedCountingViolation(board, cells, state.starKeys, state.marked, analysis, "col"),
  );
}
