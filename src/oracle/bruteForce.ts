/**
 * Brute-force Star Battle solver for validation purposes.
 *
 * Enumerates ALL valid solutions via backtracking.
 * NOT for production use - only for testing rule correctness.
 */

import { Board, CellState } from "../sieve/helpers/types";

export type Solution = ("star" | "empty")[][];

interface SearchState {
  grid: ("star" | "empty" | "unknown")[][];
  starsInRow: number[];
  starsInCol: number[];
  starsInRegion: Map<number, number>;
}

/**
 * Check if placing a star at (row, col) would be adjacent to an existing star.
 */
function hasAdjacentStar(
  grid: ("star" | "empty" | "unknown")[][],
  row: number,
  col: number,
  size: number
): boolean {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (grid[nr][nc] === "star") return true;
      }
    }
  }
  return false;
}

/**
 * Check if it's still possible to place enough stars in remaining cells of a row/col/region.
 */
function canStillComplete(
  board: Board,
  state: SearchState,
  currentRow: number,
  currentCol: number
): boolean {
  const size = board.grid.length;
  const { stars } = board;

  // Check current row: can we still place enough stars?
  const starsNeededInRow = stars - state.starsInRow[currentRow];
  let availableInRow = 0;
  for (let c = currentCol; c < size; c++) {
    if (
      state.grid[currentRow][c] === "unknown" &&
      !hasAdjacentStar(state.grid, currentRow, c, size)
    ) {
      availableInRow++;
    }
  }
  if (availableInRow < starsNeededInRow) return false;

  // Check all columns: do any have too few remaining cells for needed stars?
  for (let c = 0; c < size; c++) {
    const needed = stars - state.starsInCol[c];
    if (needed <= 0) continue;
    let available = 0;
    for (let r = 0; r < size; r++) {
      if (r < currentRow || (r === currentRow && c < currentCol)) continue;
      if (
        state.grid[r][c] === "unknown" &&
        !hasAdjacentStar(state.grid, r, c, size)
      ) {
        available++;
      }
    }
    if (available < needed) return false;
  }

  // Check all regions
  const regionCells = new Map<number, number>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r < currentRow || (r === currentRow && c < currentCol)) continue;
      const regionId = board.grid[r][c];
      if (
        state.grid[r][c] === "unknown" &&
        !hasAdjacentStar(state.grid, r, c, size)
      ) {
        regionCells.set(regionId, (regionCells.get(regionId) ?? 0) + 1);
      }
    }
  }
  for (const [regionId, available] of regionCells) {
    const needed = stars - (state.starsInRegion.get(regionId) ?? 0);
    if (available < needed) return false;
  }

  return true;
}

/**
 * Backtracking solver that enumerates all valid solutions.
 *
 * @param board - The puzzle board
 * @param maxSolutions - Stop after finding this many (0 = unlimited)
 * @returns Array of all valid solutions found
 */
export function bruteForce(board: Board, maxSolutions = 0): Solution[] {
  const size = board.grid.length;
  const { stars } = board;
  const solutions: Solution[] = [];

  const state: SearchState = {
    grid: Array.from({ length: size }, () =>
      Array.from({ length: size }, () => "unknown" as const)
    ),
    starsInRow: new Array(size).fill(0),
    starsInCol: new Array(size).fill(0),
    starsInRegion: new Map(),
  };

  // Initialize region star counts
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = board.grid[r][c];
      if (!state.starsInRegion.has(regionId)) {
        state.starsInRegion.set(regionId, 0);
      }
    }
  }

  function solve(row: number, col: number): void {
    // Check solution limit
    if (maxSolutions > 0 && solutions.length >= maxSolutions) return;

    // Move to next row if we've finished this one
    if (col >= size) {
      // Check row is complete
      if (state.starsInRow[row] !== stars) return;
      row++;
      col = 0;
    }

    // Solved!
    if (row >= size) {
      // Verify all constraints (should be satisfied, but double-check)
      for (let r = 0; r < size; r++) {
        if (state.starsInRow[r] !== stars) return;
      }
      for (let c = 0; c < size; c++) {
        if (state.starsInCol[c] !== stars) return;
      }
      for (const count of state.starsInRegion.values()) {
        if (count !== stars) return;
      }

      // Record solution
      const solution: Solution = state.grid.map((r) =>
        r.map((cell) => (cell === "star" ? "star" : "empty"))
      );
      solutions.push(solution);
      return;
    }

    // Early pruning
    if (!canStillComplete(board, state, row, col)) return;

    const regionId = board.grid[row][col];

    // Try placing a star
    if (
      state.starsInRow[row] < stars &&
      state.starsInCol[col] < stars &&
      (state.starsInRegion.get(regionId) ?? 0) < stars &&
      !hasAdjacentStar(state.grid, row, col, size)
    ) {
      state.grid[row][col] = "star";
      state.starsInRow[row]++;
      state.starsInCol[col]++;
      state.starsInRegion.set(
        regionId,
        (state.starsInRegion.get(regionId) ?? 0) + 1
      );

      solve(row, col + 1);

      state.grid[row][col] = "unknown";
      state.starsInRow[row]--;
      state.starsInCol[col]--;
      state.starsInRegion.set(
        regionId,
        (state.starsInRegion.get(regionId) ?? 0) - 1
      );
    }

    // Try leaving empty
    state.grid[row][col] = "empty";
    solve(row, col + 1);
    state.grid[row][col] = "unknown";
  }

  solve(0, 0);
  return solutions;
}

/**
 * Check if a cell has a star in ALL solutions.
 */
export function isStarInAllSolutions(
  solutions: Solution[],
  row: number,
  col: number
): boolean {
  if (solutions.length === 0) return false;
  return solutions.every((s) => s[row][col] === "star");
}

/**
 * Check if a cell has a star in ANY solution.
 */
export function isStarInAnySolution(
  solutions: Solution[],
  row: number,
  col: number
): boolean {
  return solutions.some((s) => s[row][col] === "star");
}

/**
 * Filter solutions to those compatible with current cell state.
 * A solution is compatible if:
 * - Every "star" cell in cellState has a star in the solution
 * - Every "marked" cell in cellState does NOT have a star in the solution
 */
export function filterCompatibleSolutions(
  solutions: Solution[],
  cells: CellState[][]
): Solution[] {
  const size = cells.length;
  return solutions.filter((solution) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (cells[r][c] === "star" && solution[r][c] !== "star") return false;
        if (cells[r][c] === "marked" && solution[r][c] === "star") return false;
      }
    }
    return true;
  });
}
