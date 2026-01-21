import buildRegions from "../../helpers/regions";
import { Board, CellState } from "../../helpers/types";

export function trivialRegions(board: Board, cells: CellState[][]): boolean {
  let changed = false;
  for (const [, coords] of buildRegions(board.grid)) {
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
