import { Board, CellState } from "../../helpers/types";

export default function trivialRows(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let row = 0; row < size; row++) {
    let stars = 0;
    for (let c = 0; c < size; c++) if (cells[row][c] === "star") stars++;
    if (stars === board.stars) {
      for (let c = 0; c < size; c++) {
        if (cells[row][c] === "unknown") {
          cells[row][c] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
