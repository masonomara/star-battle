/**
 * Rule 12b: Undercounting (Column)
 *
 * When n regions are confined to n columns and need all the stars those columns can provide,
 * cells in those columns outside those regions can be marked.
 *
 * "These regions live only in these columns. The columns are saturated. Mark what's outside."
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export default function undercountingColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, colStars } = analysis;
  if (size === 0) return false;

  let changed = false;

  // For each region, use its unknownCols as a candidate confining set
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0) continue;

    const cols = region.unknownCols;
    if (cols.size === 0) continue;

    // Find all regions whose unknownCols are subsets of these cols
    const confined = [...regions.values()].filter(
      (r) => r.starsNeeded > 0 && [...r.unknownCols].every((col) => cols.has(col)),
    );

    // Sum stars needed by confined regions
    let starsNeeded = 0;
    for (const r of confined) {
      starsNeeded += r.starsNeeded;
    }

    // Sum stars available in these columns
    let starsAvailable = 0;
    for (const col of cols) {
      starsAvailable += board.stars - colStars[col];
    }

    // If saturated: all stars in these columns must go to confined regions
    if (starsNeeded === starsAvailable) {
      const confinedIds = new Set(confined.map((r) => r.id));

      for (const col of cols) {
        for (let row = 0; row < size; row++) {
          if (cells[row][col] === "unknown" && !confinedIds.has(board.grid[row][col])) {
            cells[row][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}
