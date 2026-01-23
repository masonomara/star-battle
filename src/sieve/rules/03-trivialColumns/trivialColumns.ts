import { Board, CellState } from "../../helpers/types";

export default function trivialColumns(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let col = 0; col < size; col++) {
    let stars = 0;
    for (let row = 0; row < size; row++) if (cells[row][col] === "star") stars++;
    if (stars === board.stars) {
      for (let row = 0; row < size; row++) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
