import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

// Fires on one container at a time — star placement cascades adjacency marks that
// may change what's forced elsewhere. Re-entering from rule 1 is correct; do NOT batch.
export default function forcedRegion(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (const [, meta] of analysis.regions) {
    if (
      meta.starsNeeded > 0 &&
      meta.unknownCoords.length === meta.starsNeeded
    ) {
      for (const [r, c] of meta.unknownCoords) {
        cells[r][c] = "star";
      }
      return true;
    }
  }

  return false;
}
