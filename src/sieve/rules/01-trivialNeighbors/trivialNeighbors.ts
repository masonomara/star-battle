import { Board, CellState } from "../../helpers/types";
import { markNeighbors } from "../../helpers/neighbors";

export default function trivialNeighbors(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] === "star")
        changed = markNeighbors(cells, r, c, size) || changed;
    }
  }
  return changed;
}
