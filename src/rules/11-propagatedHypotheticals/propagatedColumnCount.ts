import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop } from "../../helpers/hypotheticals";

export default function propagatedColumnCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  // "adjacency" violations are caught by propagatedRowCount — two adjacent stars
  // always violate a row constraint before a column one.
  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) =>
    state.violation === "col",
  );
}
