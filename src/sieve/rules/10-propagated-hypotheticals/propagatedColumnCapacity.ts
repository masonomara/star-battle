/**
 * Propagated Hypothetical Column Capacity
 *
 * Observation: Propagated hypothetical state + tiling capacity
 * Technique:   Hypothetical
 * Deduction:   Mark — if any column can't tile enough stars
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { propagateHypothetical } from "../../helpers/propagateHypothetical";

export default function propagatedColumnCapacity(
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
      for (let c = 0; c < size; c++) {
        let starCount = 0;
        const remaining: Coord[] = [];
        for (let r = 0; r < size; r++) {
          const key = `${r},${c}`;
          if (cells[r][c] === "star" || state.starKeys.has(key)) starCount++;
          else if (cells[r][c] === "unknown" && !state.marked.has(key))
            remaining.push([r, c]);
        }
        const needed = board.stars - starCount;
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
