/**
 * Shared loop for tiling counting: for line groups (single or multi), compute
 * the minimum number of stars each touching region must place in that group
 * using tiling capacity of cells outside the group. When the sum of minimums
 * equals the group's star need, the constraint is tight — delegate deductions.
 *
 * minContrib(region, group) = max(0, starsNeeded - capacity(cellsOutside))
 */

import { Board, CellState, Coord } from "./types";
import { BoardAnalysis, RegionMeta } from "./boardAnalysis";

export function tilingCountingLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  deduct: (
    cells: CellState[][],
    mask: number,
    regionMeta: RegionMeta,
    minContrib: number,
  ) => boolean,
  minGroupSize = 1,
  maxGroupSize = 1,
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  // Precompute per-region: axisMask (which lines have unknowns)
  const regionEntries: { meta: RegionMeta; axisMask: number }[] = [];
  for (const meta of regions.values()) {
    if (meta.starsNeeded <= 0) continue;
    let axisMask = 0;
    for (const [r, c] of meta.unknownCoords) {
      axisMask |= 1 << (axis === "row" ? r : c);
    }
    regionEntries.push({ meta, axisMask });
  }

  // Precompute stars needed per line
  const lineNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    lineNeeded[i] = board.stars - axisStars[i];
  }

  const limit = 1 << size;

  for (let mask = 1; mask < limit; mask++) {
    let bits = mask;
    let popcount = 0;
    while (bits) {
      popcount++;
      bits &= bits - 1;
    }
    if (popcount < minGroupSize || popcount > maxGroupSize) continue;

    // Total stars needed by these lines
    let totalNeeded = 0;
    for (let i = 0; i < size; i++) {
      if ((mask >> i) & 1) totalNeeded += lineNeeded[i];
    }
    if (totalNeeded <= 0) continue;

    // Sum min contributions from each region
    let totalMin = 0;
    let exceeded = false;
    const entries: { meta: RegionMeta; minContrib: number }[] = [];

    for (let ri = 0; ri < regionEntries.length; ri++) {
      const { meta, axisMask } = regionEntries[ri];
      if (!(axisMask & mask)) continue;

      const cellsOutside: Coord[] = [];
      for (const [r, c] of meta.unknownCoords) {
        if (!((mask >> (axis === "row" ? r : c)) & 1)) {
          cellsOutside.push([r, c]);
        }
      }

      const capacityOutside =
        cellsOutside.length === 0
          ? 0
          : analysis.getTiling(cellsOutside).capacity;

      const minContrib = Math.max(0, meta.starsNeeded - capacityOutside);
      totalMin += minContrib;
      entries.push({ meta, minContrib });

      if (totalMin > totalNeeded) {
        exceeded = true;
        break;
      }
    }

    if (exceeded || totalMin !== totalNeeded) continue;

    let changed = false;
    for (const { meta, minContrib } of entries) {
      if (deduct(cells, mask, meta, minContrib)) {
        changed = true;
      }
    }
    if (changed) return true;
  }

  return false;
}
