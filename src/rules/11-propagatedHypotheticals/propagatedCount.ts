import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop } from "../../helpers/hypotheticals";

export function propagatedCount(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return hypotheticalLoop(board, cells, analysis, true, (_r, _c, state) =>
      state.violation === axis ||
      (axis === "row" && state.violation === "adjacency"),
    );
  };
}
