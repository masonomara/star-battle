/**
 * Hypothetical Column Count
 *
 * For each unknown cell, asks: "If I place a star here,
 * do columns c-1, c, and c+1 still have enough cells for their quotas?"
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";

export default functionhypotheticalColumnCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, false, (_row, col, state) => {
    for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
      let stars = 0;
      let remaining = 0;
      for (let r = 0; r < size; r++) {
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
