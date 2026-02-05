import { Board, CellState } from "../../helpers/types";

export default function trivialRow(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let row = 0; row < size; row++) {
    let stars = 0;
    for (let col = 0; col < size; col++) if (cells[row][col] === "star") stars++;
    if (stars === board.stars) {
      for (let col = 0; col < size; col++) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
