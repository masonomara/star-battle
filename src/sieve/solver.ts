import { Board, CellState, Puzzle } from "./types";

/**
 * Check if the puzzle is in an unsolvable state.
 * Returns a string describing the violation, or null if still solvable.
 */
export function isUnsolvable(
  board: Board,
  cells: CellState[][],
): string | null {
  const size = board.grid.length;

  // Build counts in a single pass
  const starsByRow = new Array(size).fill(0);
  const starsByCol = new Array(size).fill(0);
  const starsByRegion = new Map<number, number>();
  const unknownsByRow = new Array(size).fill(0);
  const unknownsByCol = new Array(size).fill(0);
  const unknownsByRegion = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const state = cells[row][col];
      const regionId = board.grid[row][col];

      if (!starsByRegion.has(regionId)) {
        starsByRegion.set(regionId, 0);
        unknownsByRegion.set(regionId, 0);
      }

      if (state === "star") {
        starsByRow[row]++;
        starsByCol[col]++;
        starsByRegion.set(regionId, starsByRegion.get(regionId)! + 1);

        // Check adjacency violation
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (cells[nr][nc] === "star") {
                return `adjacent stars at (${row},${col}) and (${nr},${nc})`;
              }
            }
          }
        }
      } else if (state === "unknown") {
        unknownsByRow[row]++;
        unknownsByCol[col]++;
        unknownsByRegion.set(regionId, unknownsByRegion.get(regionId)! + 1);
      }
    }
  }

  // Check constraints
  for (let i = 0; i < size; i++) {
    // Too many stars
    if (starsByRow[i] > board.stars) {
      return `row ${i} has ${starsByRow[i]} stars, max is ${board.stars}`;
    }
    if (starsByCol[i] > board.stars) {
      return `col ${i} has ${starsByCol[i]} stars, max is ${board.stars}`;
    }

    // Not enough cells left
    const neededInRow = board.stars - starsByRow[i];
    if (unknownsByRow[i] < neededInRow) {
      return `row ${i} needs ${neededInRow} more stars but only has ${unknownsByRow[i]} unknowns`;
    }

    const neededInCol = board.stars - starsByCol[i];
    if (unknownsByCol[i] < neededInCol) {
      return `col ${i} needs ${neededInCol} more stars but only has ${unknownsByCol[i]} unknowns`;
    }
  }

  // Check regions
  for (const [regionId, stars] of starsByRegion) {
    if (stars > board.stars) {
      return `region ${regionId} has ${stars} stars, max is ${board.stars}`;
    }

    const needed = board.stars - stars;
    const unknowns = unknownsByRegion.get(regionId)!;
    if (unknowns < needed) {
      return `region ${regionId} needs ${needed} more stars but only has ${unknowns} unknowns`;
    }
  }

  return null;
}

/**
 * Check if the puzzle is completely solved.
 */
export function isSolved(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  const starsByRow = new Array(size).fill(0);
  const starsByCol = new Array(size).fill(0);
  const starsByRegion = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        starsByRow[row]++;
        starsByCol[col]++;

        const regionId = board.grid[row][col];
        starsByRegion.set(regionId, (starsByRegion.get(regionId) ?? 0) + 1);
      }
    }
  }

  // All rows and cols must have exactly board.stars
  for (let i = 0; i < size; i++) {
    if (starsByRow[i] !== board.stars) return false;
    if (starsByCol[i] !== board.stars) return false;
  }

  // All regions must have exactly board.stars
  for (const count of starsByRegion.values()) {
    if (count !== board.stars) return false;
  }

  return true;
}

export function solve(board: Board, seed: number): Puzzle | null {
  // TODO: implement solver
  return null;
}
