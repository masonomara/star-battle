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

/**
 * Rule 1.1: Mark remaining cells in rows that have enough stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialRowComplete(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let changed = false;

  const result: CellState[][] = cells.map((row) => [...row]);

  for (let row = 0; row < size; row++) {
    // Count stars in this row
    let starCount = 0;
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") starCount++;
    }

    // If row has enough stars, mark all unknowns
    if (starCount === board.stars) {
      for (let col = 0; col < size; col++) {
        if (result[row][col] === "unknown") {
          result[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed ? result : null;
}

/**
 * Rule 1.1: Mark remaining cells in columns that have enough stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialColComplete(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let changed = false;

  const result: CellState[][] = cells.map((row) => [...row]);

  for (let col = 0; col < size; col++) {
    // Count stars in this column
    let starCount = 0;
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") starCount++;
    }

    // If column has enough stars, mark all unknowns
    if (starCount === board.stars) {
      for (let row = 0; row < size; row++) {
        if (result[row][col] === "unknown") {
          result[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed ? result : null;
}

/**
 * Rule 1.1: Mark remaining cells in regions that have enough stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialRegionComplete(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let changed = false;

  const result: CellState[][] = cells.map((row) => [...row]);

  // Find all unique region IDs
  const regionIds = new Set<number>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < board.grid[row].length; col++) {
      regionIds.add(board.grid[row][col]);
    }
  }

  for (const regionId of regionIds) {
    // Count stars in this region
    let starCount = 0;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < board.grid[row].length; col++) {
        if (board.grid[row][col] === regionId && cells[row][col] === "star") {
          starCount++;
        }
      }
    }

    // If region has enough stars, mark all unknowns in that region
    if (starCount === board.stars) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < board.grid[row].length; col++) {
          if (board.grid[row][col] === regionId && result[row][col] === "unknown") {
            result[row][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed ? result : null;
}
