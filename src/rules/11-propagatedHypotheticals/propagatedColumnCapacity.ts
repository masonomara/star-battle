import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticals";

export default function propagatedColumnCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) => {
    if (state.violation !== null) return false;
    for (let c = 0; c < size; c++) {
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
