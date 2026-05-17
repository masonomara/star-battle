import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop, propagatedCountingViolation } from "../../helpers/hypotheticals";

export function propagatedCounting(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return hypotheticalLoop(board, cells, analysis, true, (_r, _c, state) => {
      if (state.violation !== null) return false;
      return propagatedCountingViolation(
        board,
        cells,
        state.starKeys,
        state.marked,
        analysis,
        axis,
      );
    });
  };
}
