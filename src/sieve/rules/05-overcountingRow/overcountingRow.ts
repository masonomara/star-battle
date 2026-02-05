/**
 * Rule 12c: Overcounting (Row)
 *
 * When n rows are confined to n regions (only touch those regions) and need all the stars
 * those regions can provide, cells in those regions outside those rows can be marked.
 *
 * "These rows can only get stars from these regions. The regions are saturated. Mark what's outside."
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function overcountingRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowStars, rowToRegions } = analysis;
  if (size === 0) return false;

  let changed = false;

  // For each row, use the regions it touches as a candidate confining set
  for (let startRow = 0; startRow < size; startRow++) {
    const starsNeededInRow = board.stars - rowStars[startRow];
    if (starsNeededInRow <= 0) continue;

    const touchedRegions = rowToRegions.get(startRow);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    // Find all rows whose touched regions are subsets of these regions
    const confinedRows = new Set<number>();
    for (let row = 0; row < size; row++) {
      const rowRegs = rowToRegions.get(row);
      if (!rowRegs || rowRegs.size === 0) continue;
      if ([...rowRegs].every((rid) => touchedRegions.has(rid))) {
        confinedRows.add(row);
      }
    }

    // Sum stars needed by confined rows
    let starsNeeded = 0;
    for (const row of confinedRows) {
      starsNeeded += board.stars - rowStars[row];
    }

    // Sum stars available in these regions (capped by their starsNeeded)
    let starsAvailable = 0;
    for (const rid of touchedRegions) {
      const region = regions.get(rid);
      if (region) {
        starsAvailable += region.starsNeeded;
      }
    }

    // If saturated: all stars from these regions must go to confined rows
    if (starsNeeded === starsAvailable) {
      for (const rid of touchedRegions) {
        const region = regions.get(rid);
        if (!region) continue;

        for (const [row, col] of region.unknownCoords) {
          if (!confinedRows.has(row) && cells[row][col] === "unknown") {
            cells[row][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}
