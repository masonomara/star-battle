/**
 * Rule: Squeeze Adjacency Column (Level 5 — Tiling + Enumeration)
 *
 * When a consecutive column pair has a tight tiling,
 * enumerate valid star assignments (one per tile, no adjacency).
 * Cells that never appear as a star in any valid assignment get marked.
 */

import { Board, CellState, Coord, Deduction } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";
import { collectValidStarCells } from "../../../helpers/tilingEnumeration";

export default functionsqueezeAdjacencyColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  const starsPerPair = board.stars * 2;
  let changed = false;

  for (let col = 0; col < size - 1; col++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "unknown") pairCells.push([row, col]);
      if (cells[row][col + 1] === "unknown") pairCells.push([row, col + 1]);
      if (cells[row][col] === "star") existingStars++;
      if (cells[row][col + 1] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;
    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;
    if (tiling.tilings.length === 0) continue;

    const pairSet = new Set(pairCells.map(([r, c]) => `${r},${c}`));
    const validStarCells = collectValidStarCells(tiling.tilings, pairSet, cells);
    const deductions: Deduction[] = [];

    for (const [r, c] of pairCells) {
      if (!validStarCells.has(`${r},${c}`)) {
        deductions.push({ coord: [r, c], state: "marked" });
      }
    }

    if (applyDeductions(cells, deductions)) {
      changed = true;
    }
  }

  return changed;
}
