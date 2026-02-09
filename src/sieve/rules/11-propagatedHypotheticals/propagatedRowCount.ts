import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop } from "../../helpers/hypothetical";

export default function propagatedRowCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) =>
    state.violation === "row" || state.violation === "adjacency",
  );
}
