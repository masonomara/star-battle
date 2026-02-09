/**
 * Propagated Hypothetical Region Capacity
 *
 * Observation: Propagated hypothetical state + tiling capacity
 * Technique:   Hypothetical
 * Deduction:   Mark — if any region can't tile enough stars
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";

export default functionpropagatedRegionCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) => {
    if (state.violation !== null) return false;
    for (const [, region] of analysis.regions) {
      let extraStars = 0;
      const remaining: Coord[] = [];
      for (const [r, c] of region.unknownCoords) {
        if (cells[r][c] !== "unknown") continue;
        const key = cellKey(r, c, size);
        if (state.starKeys.has(key)) extraStars++;
        else if (!state.marked.has(key)) remaining.push([r, c]);
      }
      const needed = region.starsNeeded - extraStars;
      if (needed <= 0) continue;
      if (remaining.length < needed) return true;
      if (remaining.length >= needed * 4) continue;
      if (analysis.getTiling(remaining).capacity < needed) return true;
    }
    return false;
  });
}
