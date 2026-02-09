import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export default functiontrivialRegion(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  let changed = false;
  for (const [, meta] of analysis.regions) {
    if (meta.starsPlaced === board.stars) {
      for (const [row, col] of meta.unknownCoords) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }
  return changed;
}
