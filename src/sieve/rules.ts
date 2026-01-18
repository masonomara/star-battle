import { Board, CellState } from "./types";

/**
 * Rule 1.1: Mark all 8 neighbors of placed stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialStarMarks(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let changed = false;

  // Clone cells
  const result: CellState[][] = cells.map((row) => [...row]);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "star") continue;

      // Mark all 8 neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;

          const nr = row + dr;
          const nc = col + dc;

          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

          if (result[nr][nc] === "unknown") {
            result[nr][nc] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed ? result : null;
}
