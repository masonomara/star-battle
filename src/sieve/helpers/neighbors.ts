import { CellState } from "./types";

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
