import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState } from "../../helpers/types";

export default function regionComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  let changed = false;
  for (const coords of getRegionCoords(board.grid)) {
    let stars = 0;
    for (const [row, col] of coords) if (cells[row][col] === "star") stars++;
    if (stars === board.stars) {
      for (const [row, col] of coords) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
