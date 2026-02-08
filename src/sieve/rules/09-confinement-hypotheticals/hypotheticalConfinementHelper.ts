/**
 * Bitmask enumeration for hypothetical confinement violation detection.
 *
 * For a hypothetical star at (starRow, starCol) with neighbors in markedCells,
 * enumerates all subsets of rows (or columns) and checks if any subset's
 * star demand exceeds the max contribution from its touching regions.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

type RegionInfo = {
  starsNeeded: number;
  axisMask: number;
  unknownsByAxis: number[];
};

export function hypotheticalConfinementViolation(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  starRow: number,
  starCol: number,
  markedCells: Set<string>,
  axis: "row" | "col",
): boolean {
  const { size, regions } = analysis;
  const starRegionId = board.grid[starRow][starCol];
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
  const starAxis = axis === "row" ? starRow : starCol;

  // Precompute per-region info under hypothesis
  const regionInfos: RegionInfo[] = [];
  for (const [id, meta] of regions) {
    const needed = meta.starsNeeded - (id === starRegionId ? 1 : 0);
    if (needed <= 0) continue;

    let axisMask = 0;
    const unknownsByAxis = new Array(size).fill(0);
    for (const [r, c] of meta.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      if (markedCells.has(`${r},${c}`)) continue;
      const idx = axis === "row" ? r : c;
      axisMask |= 1 << idx;
      unknownsByAxis[idx]++;
    }

    // Region needs stars but has no available unknowns — immediate violation
    if (axisMask === 0) return true;

    regionInfos.push({ starsNeeded: needed, axisMask, unknownsByAxis });
  }

  // Precompute axis needs under hypothesis
  const axisNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    axisNeeded[i] = board.stars - axisStars[i] - (i === starAxis ? 1 : 0);
  }

  const limit = 1 << size;

  for (let mask = 1; mask < limit; mask++) {
    // Total stars needed by selected lines
    let totalNeeded = 0;
    for (let i = 0; i < size; i++) {
      if ((mask >> i) & 1) totalNeeded += axisNeeded[i];
    }
    if (totalNeeded <= 0) continue;

    // Sum max contributions from each region
    let totalMax = 0;
    let sufficient = false;
    for (let ri = 0; ri < regionInfos.length; ri++) {
      const info = regionInfos[ri];
      if (!(info.axisMask & mask)) continue;
      let inside = 0;
      for (let i = 0; i < size; i++) {
        if ((mask >> i) & 1) inside += info.unknownsByAxis[i];
      }
      totalMax += Math.min(info.starsNeeded, inside);
      if (totalMax >= totalNeeded) {
        sufficient = true;
        break;
      }
    }

    if (!sufficient) return true;
  }

  return false;
}
