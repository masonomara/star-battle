import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

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
