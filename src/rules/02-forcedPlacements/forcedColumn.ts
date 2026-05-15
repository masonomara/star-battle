import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

// Fires on one container at a time — star placement cascades adjacency marks that
// may change what's forced elsewhere. Re-entering from rule 1 is correct; do NOT batch.
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
