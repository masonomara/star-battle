import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function forcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (let col = 0; col < analysis.size; col++) {
    const needed = board.stars - analysis.colStars[col];
    const unknowns = analysis.colUnknowns[col];
    if (needed > 0 && unknowns.length === needed) {
      for (const [r, c] of unknowns) {
        cells[r][c] = "star";
      }
      return true;
    }
  }

  return false;
}
