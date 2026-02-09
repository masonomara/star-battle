/**
 * Rule: Squeeze Overhang Row (Level 5 — Tiling + Enumeration)
 *
 * When a consecutive row pair has a tight tiling,
 * cells OUTSIDE the pair that are covered by tiles in ALL active
 * tilings get marked. The pair's tiling always spills onto them.
 */

import { Board, CellState, Coord, Deduction } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";
import {
  filterActiveTilings,
  findForcedOverhangCells,
} from "../../../helpers/tilingEnumeration";

export default functionsqueezeOverhangRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  const starsPerPair = board.stars * 2;
  let changed = false;

  for (let row = 0; row < size - 1; row++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "unknown") pairCells.push([row, col]);
      if (cells[row + 1][col] === "unknown") pairCells.push([row + 1, col]);
      if (cells[row][col] === "star") existingStars++;
      if (cells[row + 1][col] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;
    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;
    if (tiling.tilings.length === 0) continue;

    const pairSet = new Set(pairCells.map(([r, c]) => `${r},${c}`));
    const activeTilings = filterActiveTilings(tiling.tilings, pairSet, cells);
    const overhangCells = findForcedOverhangCells(activeTilings, pairSet);
    const deductions: Deduction[] = [];

    for (const [r, c] of overhangCells) {
      deductions.push({ coord: [r, c], state: "marked" });
    }

    if (applyDeductions(cells, deductions)) {
      changed = true;
    }
  }

  return changed;
}
