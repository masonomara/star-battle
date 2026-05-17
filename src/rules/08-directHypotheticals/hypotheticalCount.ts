import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticals";

export function hypotheticalCount(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return hypotheticalLoop(board, cells, analysis, false, (row, col, state) => {
      const idx = axis === "row" ? row : col;
      for (let i = Math.max(0, idx - 1); i <= Math.min(size - 1, idx + 1); i++) {
        let stars = 0;
        let remaining = 0;
        for (let j = 0; j < size; j++) {
          const r = axis === "row" ? i : j;
          const c = axis === "row" ? j : i;
          const key = cellKey(r, c, size);
          if (cells[r][c] === "star" || state.starKeys.has(key)) stars++;
          else if (cells[r][c] === "unknown" && !state.marked.has(key)) remaining++;
        }
        const needed = board.stars - stars;
        if (needed > 0 && remaining < needed) return true;
      }
      return false;
    });
  };
}
