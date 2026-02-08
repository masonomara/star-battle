/**
 * Rule: Enum Overcounting (Column)
 *
 * Generalized overcounting: for each subset of columns, compute the max stars
 * each touching region can contribute (capped by its unknowns inside the group).
 * If the total equals exactly what the columns need, every region must contribute
 * its max — forcing placements and marks.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export default function enumOvercountingColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, colStars } = analysis;
  if (size === 0) return false;

  // Precompute per-region: unknowns count per column and column bitmask
  const regionInfos: {
    starsNeeded: number;
    colMask: number;
    unknownsByCol: number[];
    unknownCoords: [number, number][];
  }[] = [];

  for (const region of regions.values()) {
    if (region.starsNeeded <= 0) continue;
    let colMask = 0;
    const unknownsByCol = new Array(size).fill(0);
    for (const [, c] of region.unknownCoords) {
      colMask |= 1 << c;
      unknownsByCol[c]++;
    }
    regionInfos.push({
      starsNeeded: region.starsNeeded,
      colMask,
      unknownsByCol,
      unknownCoords: region.unknownCoords as [number, number][],
    });
  }

  // Precompute stars needed per column
  const colNeeded = new Array(size);
  for (let col = 0; col < size; col++) {
    colNeeded[col] = board.stars - colStars[col];
  }

  const limit = 1 << size;

  for (let mask = 1; mask < limit; mask++) {
    // Total stars needed by these columns
    let totalNeeded = 0;
    for (let col = 0; col < size; col++) {
      if ((mask >> col) & 1) totalNeeded += colNeeded[col];
    }
    if (totalNeeded <= 0) continue;

    // Sum max contributions from each region
    let totalMax = 0;
    let exceeded = false;
    for (const info of regionInfos) {
      if (!(info.colMask & mask)) continue;
      let inside = 0;
      for (let col = 0; col < size; col++) {
        if ((mask >> col) & 1) inside += info.unknownsByCol[col];
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
      if (!(info.colMask & mask)) continue;
      let inside = 0;
      for (let col = 0; col < size; col++) {
        if ((mask >> col) & 1) inside += info.unknownsByCol[col];
      }
      const maxContrib = Math.min(info.starsNeeded, inside);

      // All cells inside must be stars (region has exactly as many cells as it must contribute)
      if (inside === maxContrib) {
        for (const [r, c] of info.unknownCoords) {
          if ((mask >> c) & 1 && cells[r][c] === "unknown") {
            cells[r][c] = "star";
            changed = true;
          }
        }
      }

      // All region's stars go inside — mark cells outside the column group
      if (maxContrib === info.starsNeeded) {
        for (const [r, c] of info.unknownCoords) {
          if (!((mask >> c) & 1) && cells[r][c] === "unknown") {
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
