import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop, propagatedCountingViolation } from "../../helpers/hypotheticals";

export function hypotheticalCounting(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return hypotheticalLoop(board, cells, analysis, false, (_row, _col, state) =>
      propagatedCountingViolation(board, cells, state.starKeys, state.marked, analysis, axis),
    );
  };
}
