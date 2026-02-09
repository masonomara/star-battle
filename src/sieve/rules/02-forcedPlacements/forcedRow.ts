import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function forcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (let row = 0; row < analysis.size; row++) {
    const needed = board.stars - analysis.rowStars[row];
    const unknowns = analysis.rowUnknowns[row];
    if (needed > 0 && unknowns.length === needed) {
      for (const [r, c] of unknowns) {
        cells[r][c] = "star";
      }
      return true;
    }
  }

  return false;
}
