import { Board, CellState } from "../../helpers/types";

export default function trivialColumns(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let col = 0; col < size; col++) {
    let stars = 0;
    for (let r = 0; r < size; r++) if (cells[r][col] === "star") stars++;
    if (stars === board.stars) {
      for (let r = 0; r < size; r++) {
        if (cells[r][col] === "unknown") {
          cells[r][col] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
