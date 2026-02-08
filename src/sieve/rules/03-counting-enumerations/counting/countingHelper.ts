/**
 * Shared enumeration loop for counting: iterates all subsets of rows or
 * columns, finds tight constraints (totalMax === totalNeeded), and delegates
 * deductions to a callback for each contributing region.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

type RegionInfo = {
  starsNeeded: number;
  axisMask: number;
  unknownsByAxis: number[];
  unknownCoords: [number, number][];
};

export function countingLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  deduct: (
    cells: CellState[][],
    mask: number,
    inside: number,
    maxContrib: number,
    starsNeeded: number,
    unknownCoords: [number, number][],
  ) => boolean,
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
  if (size === 0) return false;

  // Precompute per-region info
  const regionInfos: RegionInfo[] = [];
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0) continue;
    let axisMask = 0;
    const unknownsByAxis = new Array(size).fill(0);
    for (const [r, c] of region.unknownCoords) {
      const idx = axis === "row" ? r : c;
      axisMask |= 1 << idx;
      unknownsByAxis[idx]++;
    }
    regionInfos.push({
      starsNeeded: region.starsNeeded,
      axisMask,
      unknownsByAxis,
      unknownCoords: region.unknownCoords as [number, number][],
    });
  }

  // Precompute stars needed per axis line
  const axisNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    axisNeeded[i] = board.stars - axisStars[i];
  }

  const limit = 1 << size;

  for (let mask = 1; mask < limit; mask++) {
    // Total stars needed by these lines
    let totalNeeded = 0;
    for (let i = 0; i < size; i++) {
      if ((mask >> i) & 1) totalNeeded += axisNeeded[i];
    }
    if (totalNeeded <= 0) continue;

    // Sum max contributions from each region, caching inside counts
    let totalMax = 0;
    let exceeded = false;
    const insideCounts: number[] = [];
    for (let ri = 0; ri < regionInfos.length; ri++) {
      const info = regionInfos[ri];
      if (!(info.axisMask & mask)) {
        insideCounts.push(0);
        continue;
      }
      let inside = 0;
      for (let i = 0; i < size; i++) {
        if ((mask >> i) & 1) inside += info.unknownsByAxis[i];
      }
      insideCounts.push(inside);
      totalMax += Math.min(info.starsNeeded, inside);
      if (totalMax > totalNeeded) {
        exceeded = true;
        break;
      }
    }
    if (exceeded || totalMax !== totalNeeded) continue;

    // Tight constraint — delegate deductions
    let changed = false;
    for (let ri = 0; ri < regionInfos.length; ri++) {
      const info = regionInfos[ri];
      if (!(info.axisMask & mask)) continue;
      const inside = insideCounts[ri];
      const maxContrib = Math.min(info.starsNeeded, inside);
      if (deduct(cells, mask, inside, maxContrib, info.starsNeeded, info.unknownCoords)) {
        changed = true;
      }
    }
    if (changed) return true;
  }

  return false;
}
