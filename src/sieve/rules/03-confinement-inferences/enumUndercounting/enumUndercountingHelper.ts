/**
 * Shared enumeration loop for undercounting: iterates all subsets of regions,
 * finds tight constraints (totalMax === totalNeeded), and delegates
 * deductions to a callback for each contributing line (row or column).
 *
 * Dual of the overcounting helper — overcounting iterates line subsets,
 * undercounting iterates region subsets.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export function enumUndercountingLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  deduct: (
    cells: CellState[][],
    regionIdSet: Set<number>,
    lineIndex: number,
    inside: number,
    maxContrib: number,
    lineStarsNeeded: number,
  ) => boolean,
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
  if (size === 0) return false;

  // Assign indices to active regions and precompute per-line unknowns
  const activeRegions: {
    id: number;
    starsNeeded: number;
    unknownsByLine: number[];
  }[] = [];

  for (const region of regions.values()) {
    if (region.starsNeeded <= 0) continue;
    const unknownsByLine = new Array(size).fill(0);
    for (const [r, c] of region.unknownCoords) {
      const lineIdx = axis === "row" ? r : c;
      unknownsByLine[lineIdx]++;
    }
    activeRegions.push({
      id: region.id,
      starsNeeded: region.starsNeeded,
      unknownsByLine,
    });
  }

  const numRegions = activeRegions.length;
  if (numRegions === 0) return false;

  // Precompute stars needed per line
  const lineNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    lineNeeded[i] = board.stars - axisStars[i];
  }

  // Precompute per-line: which regions it touches (bitmask) and unknowns per region
  const lineRegionMask = new Array(size).fill(0);
  const lineUnknownsByRegion: number[][] = [];
  for (let i = 0; i < size; i++) {
    const unknownsByRegion = new Array(numRegions).fill(0);
    for (let ri = 0; ri < numRegions; ri++) {
      const count = activeRegions[ri].unknownsByLine[i];
      if (count > 0) {
        lineRegionMask[i] |= 1 << ri;
        unknownsByRegion[ri] = count;
      }
    }
    lineUnknownsByRegion.push(unknownsByRegion);
  }

  const limit = 1 << numRegions;

  for (let mask = 1; mask < limit; mask++) {
    // Total stars needed by these regions
    let totalNeeded = 0;
    for (let ri = 0; ri < numRegions; ri++) {
      if ((mask >> ri) & 1) totalNeeded += activeRegions[ri].starsNeeded;
    }
    if (totalNeeded <= 0) continue;

    // Sum max contributions from each line, caching inside counts
    let totalMax = 0;
    let exceeded = false;
    const insideCounts = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      if (!(lineRegionMask[i] & mask)) continue;
      let inside = 0;
      for (let ri = 0; ri < numRegions; ri++) {
        if ((mask >> ri) & 1) inside += lineUnknownsByRegion[i][ri];
      }
      insideCounts[i] = inside;
      totalMax += Math.min(lineNeeded[i], inside);
      if (totalMax > totalNeeded) {
        exceeded = true;
        break;
      }
    }
    if (exceeded || totalMax !== totalNeeded) continue;

    // Tight constraint — build region ID set and delegate deductions
    const regionIdSet = new Set<number>();
    for (let ri = 0; ri < numRegions; ri++) {
      if ((mask >> ri) & 1) regionIdSet.add(activeRegions[ri].id);
    }

    let changed = false;
    for (let i = 0; i < size; i++) {
      if (!(lineRegionMask[i] & mask)) continue;
      const inside = insideCounts[i];
      const maxContrib = Math.min(lineNeeded[i], inside);
      if (deduct(cells, regionIdSet, i, inside, maxContrib, lineNeeded[i])) {
        changed = true;
      }
    }
    if (changed) return true;
  }

  return false;
}
