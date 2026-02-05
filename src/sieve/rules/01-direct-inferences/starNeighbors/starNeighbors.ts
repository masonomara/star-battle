import { neighbors } from "../../../helpers/neighbors";
import { Board, CellState } from "../../../helpers/types";


export default function starNeighbors(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "star") continue;
      for (const [nr, nc] of neighbors(row, col, size)) {
        if (cells[nr][nc] === "unknown") {
          cells[nr][nc] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}
