import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function trivialRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  let changed = false;
  for (let row = 0; row < analysis.size; row++) {
    if (analysis.rowStars[row] === board.stars) {
      for (const [r, c] of analysis.rowUnknowns[row]) {
        cells[r][c] = "marked";
        changed = true;
      }
    }
  }
  return changed;
}
