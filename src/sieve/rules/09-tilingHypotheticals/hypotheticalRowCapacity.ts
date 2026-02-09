/**
 * Hypothetical Row Capacity
 *
 * For each unknown cell, asks: "If I place a star here,
 * can rows r-1, r, and r+1 still tile their required stars?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypothetical";

export default function hypotheticalRowCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, false, (row, _col, state) => {
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      let stars = 0;
      const remaining: Coord[] = [];
      for (let c = 0; c < size; c++) {
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
