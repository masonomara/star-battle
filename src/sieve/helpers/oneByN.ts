/**
 * Build a set of cell keys that would be marked by placing a star at (row, col).
 */

import { neighbors } from "./neighbors";

export function buildMarkedCellSet(
  row: number,
  col: number,
  size: number,
): Set<string> {
  const marked = new Set<string>();
  marked.add(`${row},${col}`);

  for (const [nr, nc] of neighbors(row, col, size)) {
    marked.add(`${nr},${nc}`);
  }

  return marked;
}
