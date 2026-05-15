import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

// Fires on one container at a time — star placement cascades adjacency marks that
// may change what's forced elsewhere. Re-entering from rule 1 is correct; do NOT batch.
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
