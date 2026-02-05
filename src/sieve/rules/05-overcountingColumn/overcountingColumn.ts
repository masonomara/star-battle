/**
 * Rule 12d: Overcounting (Column)
 *
 * When n columns are confined to n regions (only touch those regions) and need all the stars
 * those regions can provide, cells in those regions outside those columns can be marked.
 *
 * "These columns can only get stars from these regions. The regions are saturated. Mark what's outside."
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function overcountingColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, colStars, colToRegions } = analysis;
  if (size === 0) return false;

  let changed = false;

  // For each column, use the regions it touches as a candidate confining set
  for (let startCol = 0; startCol < size; startCol++) {
    const starsNeededInCol = board.stars - colStars[startCol];
    if (starsNeededInCol <= 0) continue;

    const touchedRegions = colToRegions.get(startCol);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    // Find all columns whose touched regions are subsets of these regions
    const confinedCols = new Set<number>();
    for (let col = 0; col < size; col++) {
      const colRegs = colToRegions.get(col);
      if (!colRegs || colRegs.size === 0) continue;
      if ([...colRegs].every((rid) => touchedRegions.has(rid))) {
        confinedCols.add(col);
      }
    }

    // Sum stars needed by confined columns
    let starsNeeded = 0;
    for (const col of confinedCols) {
      starsNeeded += board.stars - colStars[col];
    }

    // Sum stars available in these regions (capped by their starsNeeded)
    let starsAvailable = 0;
    for (const rid of touchedRegions) {
      const region = regions.get(rid);
      if (region) {
        starsAvailable += region.starsNeeded;
      }
    }

    // If saturated: all stars from these regions must go to confined columns
    if (starsNeeded === starsAvailable) {
      for (const rid of touchedRegions) {
        const region = regions.get(rid);
        if (!region) continue;

        for (const [row, col] of region.unknownCoords) {
          if (!confinedCols.has(col) && cells[row][col] === "unknown") {
            cells[row][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}
