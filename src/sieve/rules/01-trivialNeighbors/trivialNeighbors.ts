import { Board, CellState } from "../../helpers/types";

export default function trivialNeighbors(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "star") continue;
      for (let drow = -1; drow <= 1; drow++) {
        for (let dcol = -1; dcol <= 1; dcol++) {
          if (drow === 0 && dcol === 0) continue;
          const nrow = row + drow;
          const ncol = col + dcol;
          if (
            nrow >= 0 &&
            nrow < size &&
            ncol >= 0 &&
            ncol < size &&
            cells[nrow][ncol] === "unknown"
          ) {
            cells[nrow][ncol] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}
