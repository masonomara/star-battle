import { Board } from "./types";

/**
 * Check if a board layout is valid before attempting to solve.
 * Validates:
 * - Exactly `size` distinct regions exist
 * - For multi-star puzzles (stars > 1), each region has at least
 *   (stars * 2) - 1 cells to fit the required stars without touching.
 */
export function isValidLayout(board: Board): boolean {
  const size = board.grid.length;
  const minRegionSize = board.stars > 1 ? board.stars * 2 - 1 : 1;
  const regionSizes = new Map<number, number>();

  for (const row of board.grid) {
    for (const regionId of row) {
      regionSizes.set(regionId, (regionSizes.get(regionId) ?? 0) + 1);
    }
  }

  // Must have exactly `size` regions
  if (regionSizes.size !== size) return false;

  // Each region must meet minimum size requirement
  for (const regionSize of regionSizes.values()) {
    if (regionSize < minRegionSize) return false;
  }

  return true;
}
