/**
 * Propagated Hypothetical Counting
 *
 * Observation: Propagated hypothetical state + counting constraints
 * Technique:   Hypothetical
 * Deduction:   Mark — if any group of rows/columns needs more stars
 *              than its touching regions can provide
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { propagateHypothetical, PropagatedState } from "../../helpers/propagateHypothetical";

export default function propagatedCounting(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const state = propagateHypothetical(board, cells, row, col, analysis);
      if (state.violated) continue;

      if (
        hasCountingViolation(board, cells, state, analysis, "row") ||
        hasCountingViolation(board, cells, state, analysis, "col")
      ) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}

function hasCountingViolation(
  board: Board,
  cells: CellState[][],
  state: PropagatedState,
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  const { size, regions } = analysis;
  const { starKeys, marked } = state;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  // Count hypothetical stars per axis line and per region
  const hypStarsPerAxis = new Array(size).fill(0);
  const hypStarsPerRegion = new Map<number, number>();
  for (const key of starKeys) {
    const [r, c] = key.split(",").map(Number);
    hypStarsPerAxis[axis === "row" ? r : c]++;
    const regionId = board.grid[r][c];
    hypStarsPerRegion.set(regionId, (hypStarsPerRegion.get(regionId) || 0) + 1);
  }

  type RegionInfo = {
    starsNeeded: number;
    axisMask: number;
    unknownsByAxis: number[];
  };

  const regionInfos: RegionInfo[] = [];
  for (const [id, meta] of regions) {
    const needed = meta.starsNeeded - (hypStarsPerRegion.get(id) || 0);
    if (needed <= 0) continue;

    let axisMask = 0;
    const unknownsByAxis = new Array(size).fill(0);
    for (const [r, c] of meta.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (starKeys.has(key) || marked.has(key)) continue;
      const idx = axis === "row" ? r : c;
      axisMask |= 1 << idx;
      unknownsByAxis[idx]++;
    }

    if (axisMask === 0) return true;
    regionInfos.push({ starsNeeded: needed, axisMask, unknownsByAxis });
  }

  const axisNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    axisNeeded[i] = board.stars - axisStars[i] - hypStarsPerAxis[i];
  }

  const limit = 1 << size;
  for (let mask = 1; mask < limit; mask++) {
    let totalNeeded = 0;
    for (let i = 0; i < size; i++) {
      if ((mask >> i) & 1) totalNeeded += axisNeeded[i];
    }
    if (totalNeeded <= 0) continue;

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
