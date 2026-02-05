import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

/**
 * When unknowns in a region equal needed stars, place one star.
 */
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
