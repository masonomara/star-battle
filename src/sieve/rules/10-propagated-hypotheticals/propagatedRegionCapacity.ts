/**
 * Propagated Hypothetical Region Capacity
 *
 * Observation: Propagated hypothetical state + tiling capacity
 * Technique:   Hypothetical
 * Deduction:   Mark — if any region can't tile enough stars
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { propagateHypothetical } from "../../helpers/propagateHypothetical";

export default function propagatedRegionCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const state = propagateHypothetical(board, cells, row, col, analysis);
      if (state.violation !== null) continue;

      let violation = false;
      for (const [, region] of analysis.regions) {
        let extraStars = 0;
        const remaining: Coord[] = [];
        for (const [r, c] of region.unknownCoords) {
          if (cells[r][c] !== "unknown") continue;
          const key = `${r},${c}`;
          if (state.starKeys.has(key)) extraStars++;
          else if (!state.marked.has(key)) remaining.push([r, c]);
        }
        const needed = region.starsNeeded - extraStars;
        if (needed > 0 && analysis.getTiling(remaining).capacity < needed) {
          violation = true;
          break;
        }
      }

      if (violation) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
