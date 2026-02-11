import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function trivialColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  let changed = false;
  for (let col = 0; col < analysis.size; col++) {
    if (analysis.colStars[col] === board.stars) {
      for (const [r, c] of analysis.colUnknowns[col]) {
        cells[r][c] = "marked";
        changed = true;
      }
    }
  }
  return changed;
}
