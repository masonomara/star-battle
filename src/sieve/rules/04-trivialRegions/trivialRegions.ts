import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState } from "../../helpers/types";

export default function trivialRegions(board: Board, cells: CellState[][]): boolean {
  let changed = false;
  for (const coords of getRegionCoords(board.grid)) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    if (stars === board.stars) {
      for (const [r, c] of coords) {
        if (cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
