/**
 * Shared counting violation check for propagated hypothetical state.
 *
 * Builds a CountingFlowInput from the propagated stars/marks and
 * checks if any group of lines needs more stars than regions can provide.
 */

import { Board, CellState } from "./types";
import { BoardAnalysis } from "./boardAnalysis";
import { cellKey } from "./neighbors";
import { hasCountingViolation, CountingFlowInput } from "./countingFlow";

export function propagatedCountingViolation(
  board: Board,
  cells: CellState[][],
  starKeys: Set<number>,
  marked: Set<number>,
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  const hypStarsPerAxis = new Array(size).fill(0);
  const hypStarsPerRegion = new Map<number, number>();
  for (const key of starKeys) {
    const r = Math.floor(key / size);
    const c = key % size;
    const idx = axis === "row" ? r : c;
    hypStarsPerAxis[idx]++;
    const regionId = board.grid[r][c];
    hypStarsPerRegion.set(regionId, (hypStarsPerRegion.get(regionId) || 0) + 1);
  }

  const axisNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    axisNeeded[i] = board.stars - axisStars[i] - hypStarsPerAxis[i];
  }

  const regionInfos: CountingFlowInput["regionInfos"] = [];
  for (const [id, meta] of regions) {
    const needed = meta.starsNeeded - (hypStarsPerRegion.get(id) || 0);
    if (needed <= 0) continue;

    const unknownsByAxis = new Array(size).fill(0);
    let total = 0;
    for (const [r, c] of meta.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = cellKey(r, c, size);
      if (starKeys.has(key) || marked.has(key)) continue;
      const idx = axis === "row" ? r : c;
      unknownsByAxis[idx]++;
      total++;
    }

    if (total < needed) return true;

    regionInfos.push({
      starsNeeded: needed,
      unknownsByAxis,
      unknownCoords: meta.unknownCoords as [number, number][],
    });
  }

  return hasCountingViolation({ size, axisNeeded, regionInfos });
}
