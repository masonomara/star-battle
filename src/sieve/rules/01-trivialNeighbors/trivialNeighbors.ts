import { Board, CellState } from "../../helpers/types";

export default function markNeighbors(
  cells: CellState[][],
  row: number,
  col: number,
): boolean {
  const numRows = cells.length;
  const numCols = cells[0].length;
  let changed = false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr,
        nc = col + dc;
      if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
        if (cells[nr][nc] === "unknown") {
          cells[nr][nc] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function trivialNeighbors(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] === "star")
        changed = markNeighbors(cells, r, c) || changed;
    }
  }
  return changed;
}
