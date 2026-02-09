import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hypotheticalLoop, propagatedCountingViolation } from "../../helpers/hypothetical";

export default function hypotheticalCountingColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return hypotheticalLoop(board, cells, analysis, false, (_row, _col, state) =>
    propagatedCountingViolation(board, cells, state.starKeys, state.marked, analysis, "col"),
  );
}
