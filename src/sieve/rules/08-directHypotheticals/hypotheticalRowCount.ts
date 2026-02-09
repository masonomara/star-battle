/**
 * Hypothetical Row Count
 *
 * For each unknown cell, asks: "If I place a star here,
 * do rows r-1, r, and r+1 still have enough cells for their quotas?"
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypothetical";

export default function hypotheticalRowCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, false, (row, _col, state) => {
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      let stars = 0;
      let remaining = 0;
      for (let c = 0; c < size; c++) {
        const key = cellKey(r, c, size);
        if (cells[r][c] === "star" || state.starKeys.has(key)) stars++;
        else if (cells[r][c] === "unknown" && !state.marked.has(key)) remaining++;
      }
      const needed = board.stars - stars;
      if (needed > 0 && remaining < needed) return true;
    }
    return false;
  });
}
