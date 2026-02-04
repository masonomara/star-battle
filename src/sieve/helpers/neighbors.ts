/**
 * 8-Neighbor Iteration
 *
 * One function. Yields valid neighbors of a cell.
 */

import { Coord } from "./types";

/**
 * Yields the 8 neighbors of a cell (excludes the cell itself).
 * Only yields cells within bounds.
 */
export function* neighbors(
  row: number,
  col: number,
  size: number,
): Generator<Coord> {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        yield [nr, nc];
      }
    }
  }
}
