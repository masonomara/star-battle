/**
 * Rule 12a: Region Confinement (Row)
 *
 * When n regions are confined to n rows and need all the stars those rows can provide,
 * cells in those rows outside those regions can be marked.
 *
 * "These regions live only in these rows. The rows are saturated. Mark what's outside."
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function regionConfinementRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowStars } = analysis;
  if (size === 0) return false;

  let changed = false;

  // For each region, use its unknownRows as a candidate confining set
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0) continue;

    const rows = region.unknownRows;
    if (rows.size === 0) continue;

    // Find all regions whose unknownRows are subsets of these rows
    const confined = [...regions.values()].filter(
      (r) => r.starsNeeded > 0 && [...r.unknownRows].every((row) => rows.has(row)),
    );

    // Sum stars needed by confined regions
    let starsNeeded = 0;
    for (const r of confined) {
      starsNeeded += r.starsNeeded;
    }

    // Sum stars available in these rows
    let starsAvailable = 0;
    for (const row of rows) {
      starsAvailable += board.stars - rowStars[row];
    }

    // If saturated: all stars in these rows must go to confined regions
    if (starsNeeded === starsAvailable) {
      const confinedIds = new Set(confined.map((r) => r.id));

      for (const row of rows) {
        for (let col = 0; col < size; col++) {
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
