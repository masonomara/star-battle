import { Board } from "./types";
import { computeTiling } from "./tiling";

/**
 * Validate that a board has a structurally sound layout.
 *
 * Checks (in order of cost):
 * 1. Region count equals grid size
 * 2. Every region meets minimum size for star placement
 * 3. Every row and column contains enough distinct regions
 * 4. Every region can tile the required number of stars
 */
export function isValidBoard(board: Board): boolean {
  const size = board.grid.length;
  const stars = board.stars;
  const minRegionSize = stars > 1 ? stars * 2 - 1 : 1;

  // Count region sizes
  const regionCells = new Map<number, [number, number][]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!regionCells.has(id)) regionCells.set(id, []);
      regionCells.get(id)!.push([r, c]);
    }
  }

  // Region count must equal grid size
  if (regionCells.size !== size) return false;

  // Every region must meet minimum size
  for (const coords of regionCells.values()) {
    if (coords.length < minRegionSize) return false;
  }

  // Every row and column must have enough distinct regions
  for (let i = 0; i < size; i++) {
    const rowRegions = new Set<number>();
    const colRegions = new Set<number>();
    for (let j = 0; j < size; j++) {
      rowRegions.add(board.grid[i][j]);
      colRegions.add(board.grid[j][i]);
    }
    if (rowRegions.size < stars || colRegions.size < stars) return false;
  }

  // Every region must be able to tile the required stars
  for (const coords of regionCells.values()) {
    if (computeTiling(coords, size).capacity < stars) return false;
  }

  return true;
}
