/**
 * Max-flow based hypothetical confinement violation detection.
 *
 * For a hypothetical star at (starRow, starCol) with neighbors in markedCells,
 * checks if any group of rows (or columns) now needs more stars than its
 * touching regions can provide — using a single max-flow computation instead
 * of O(2^N) bitmask enumeration.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { hasCountingViolation, CountingFlowInput } from "../../helpers/countingFlow";

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

  // Build flow input under hypothesis
  const axisNeeded = new Array(size);
  for (let i = 0; i < size; i++) {
    axisNeeded[i] = board.stars - axisStars[i] - (i === starAxis ? 1 : 0);
  }

  const regionInfos: CountingFlowInput["regionInfos"] = [];
  for (const [id, meta] of regions) {
    const needed = meta.starsNeeded - (id === starRegionId ? 1 : 0);
    if (needed <= 0) continue;

    const unknownsByAxis = new Array(size).fill(0);
    let total = 0;
    for (const [r, c] of meta.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      if (markedCells.has(`${r},${c}`)) continue;
      const idx = axis === "row" ? r : c;
      unknownsByAxis[idx]++;
      total++;
    }

    // Region needs stars but has no available unknowns — immediate violation
    if (total < needed) return true;

    regionInfos.push({
      starsNeeded: needed,
      unknownsByAxis,
      unknownCoords: meta.unknownCoords as [number, number][],
    });
  }

  return hasCountingViolation({ size, axisNeeded, regionInfos });
}
