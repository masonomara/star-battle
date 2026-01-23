import { Board, CellState } from "../../helpers/types";

export default function trivialNeighbors(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] !== "star") continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && cells[nr][nc] === "unknown") {
            cells[nr][nc] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}
