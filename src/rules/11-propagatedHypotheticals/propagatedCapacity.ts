import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticals";

export function propagatedCapacity(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return hypotheticalLoop(board, cells, analysis, true, (_r, _c, state) => {
      if (state.violation !== null) return false;
      for (let i = 0; i < size; i++) {
        let stars = 0;
        const remaining: Coord[] = [];
        for (let j = 0; j < size; j++) {
          const r = axis === "row" ? i : j;
          const c = axis === "row" ? j : i;
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
  };
}
