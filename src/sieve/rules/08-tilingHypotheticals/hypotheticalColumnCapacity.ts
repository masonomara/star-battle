/**
 * Hypothetical Column Capacity
 *
 * For each unknown cell, asks: "If I place a star here,
 * can columns c-1, c, and c+1 still tile their required stars?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";

export default function hypotheticalColumnCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, false, (_row, col, state) => {
    for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
      let stars = 0;
      const remaining: Coord[] = [];
      for (let r = 0; r < size; r++) {
        const key = cellKey(r, c, size);
        if (cells[r][c] === "star" || state.starKeys.has(key)) stars++;
        else if (cells[r][c] === "unknown" && !state.marked.has(key))
          remaining.push([r, c]);
      }
      const needed = board.stars - stars;
      if (needed <= 0) continue;
      if (remaining.length < needed) return true;
      if (remaining.length >= needed * 2) continue;
      if (analysis.getTiling(remaining).capacity < needed) return true;
    }
    return false;
  });
}
