import { Board, CellState } from "../../helpers/types";

export function markNeighbors(
  cells: CellState[][],
  row: number,
  col: number,
  size: number,
): boolean {
  let changed = false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr,
        nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (cells[nr][nc] === "unknown") {
          cells[nr][nc] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}

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
