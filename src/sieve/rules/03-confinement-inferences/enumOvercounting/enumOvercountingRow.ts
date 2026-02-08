/**
 * Rule: Enum Overcounting (Row)
 *
 * Generalized overcounting: for each subset of rows, compute the max stars
 * each touching region can contribute (capped by its unknowns inside the group).
 * If the total equals exactly what the rows need, every region must contribute
 * its max — forcing placements and marks.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export default function enumOvercountingRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowStars } = analysis;
  if (size === 0) return false;

  // Precompute per-region: unknowns count per row and row bitmask
  const regionInfos: {
    starsNeeded: number;
    rowMask: number;
    unknownsByRow: number[];
    unknownCoords: [number, number][];
  }[] = [];

  for (const region of regions.values()) {
    if (region.starsNeeded <= 0) continue;
    let rowMask = 0;
    const unknownsByRow = new Array(size).fill(0);
    for (const [r] of region.unknownCoords) {
      rowMask |= 1 << r;
      unknownsByRow[r]++;
    }
    regionInfos.push({
      starsNeeded: region.starsNeeded,
      rowMask,
      unknownsByRow,
      unknownCoords: region.unknownCoords as [number, number][],
    });
  }

  // Precompute stars needed per row
  const rowNeeded = new Array(size);
  for (let row = 0; row < size; row++) {
    rowNeeded[row] = board.stars - rowStars[row];
  }

  const limit = 1 << size;

  for (let mask = 1; mask < limit; mask++) {
    // Total stars needed by these rows
    let totalNeeded = 0;
    for (let row = 0; row < size; row++) {
      if ((mask >> row) & 1) totalNeeded += rowNeeded[row];
    }
    if (totalNeeded <= 0) continue;

    // Sum max contributions from each region
    let totalMax = 0;
    let exceeded = false;
    for (const info of regionInfos) {
      if (!(info.rowMask & mask)) continue;
      let inside = 0;
      for (let row = 0; row < size; row++) {
        if ((mask >> row) & 1) inside += info.unknownsByRow[row];
      }
      totalMax += Math.min(info.starsNeeded, inside);
      if (totalMax > totalNeeded) {
        exceeded = true;
        break;
      }
    }
    if (exceeded || totalMax !== totalNeeded) continue;

    // Tight constraint — apply deductions
    let changed = false;

    for (const info of regionInfos) {
      if (!(info.rowMask & mask)) continue;
      let inside = 0;
      for (let row = 0; row < size; row++) {
        if ((mask >> row) & 1) inside += info.unknownsByRow[row];
      }
      const maxContrib = Math.min(info.starsNeeded, inside);

      // All cells inside must be stars (region has exactly as many cells as it must contribute)
      if (inside === maxContrib) {
        for (const [r, c] of info.unknownCoords) {
          if ((mask >> r) & 1 && cells[r][c] === "unknown") {
            cells[r][c] = "star";
            changed = true;
          }
        }
      }

      // All region's stars go inside — mark cells outside the row group
      if (maxContrib === info.starsNeeded) {
        for (const [r, c] of info.unknownCoords) {
          if (!((mask >> r) & 1) && cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
      }
    }

    if (changed) return true;
  }

  return false;
}
