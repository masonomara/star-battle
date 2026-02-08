/**
 * Propagated Hypothetical Capacity
 *
 * Observation: Propagated hypothetical state + tiling capacity
 * Technique:   Hypothetical
 * Deduction:   Mark — if any row, column, or region can't tile enough stars
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { propagateHypothetical, PropagatedState } from "../../helpers/propagateHypothetical";

export default function propagatedCapacity(
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

      if (hasCapacityViolation(board, cells, state, analysis)) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}

function hasCapacityViolation(
  board: Board,
  cells: CellState[][],
  state: PropagatedState,
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const { starKeys, marked } = state;

  for (let r = 0; r < size; r++) {
    let starCount = 0;
    const remaining: Coord[] = [];
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      if (cells[r][c] === "star" || starKeys.has(key)) starCount++;
      else if (cells[r][c] === "unknown" && !marked.has(key))
        remaining.push([r, c]);
    }
    const needed = board.stars - starCount;
    if (needed <= 0) continue;
    if (analysis.getTiling(remaining).capacity < needed) return true;
  }

  for (let c = 0; c < size; c++) {
    let starCount = 0;
    const remaining: Coord[] = [];
    for (let r = 0; r < size; r++) {
      const key = `${r},${c}`;
      if (cells[r][c] === "star" || starKeys.has(key)) starCount++;
      else if (cells[r][c] === "unknown" && !marked.has(key))
        remaining.push([r, c]);
    }
    const needed = board.stars - starCount;
    if (needed <= 0) continue;
    if (analysis.getTiling(remaining).capacity < needed) return true;
  }

  for (const [, region] of analysis.regions) {
    let extraStars = 0;
    const remaining: Coord[] = [];
    for (const [r, c] of region.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (starKeys.has(key)) extraStars++;
      else if (!marked.has(key)) remaining.push([r, c]);
    }
    const needed = region.starsNeeded - extraStars;
    if (needed <= 0) continue;
    if (analysis.getTiling(remaining).capacity < needed) return true;
  }

  return false;
}
