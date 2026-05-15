import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export function tilingForcedLine(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
    const axisUnknowns = axis === "row" ? analysis.rowUnknowns : analysis.colUnknowns;
    for (let i = 0; i < analysis.size; i++) {
      const needed = board.stars - axisStars[i];
      if (needed <= 0) continue;
      const tiling = analysis.getTiling(axisUnknowns[i]);
      if (tiling.capacity !== needed) continue;
      for (const [r, c] of tiling.forcedCells) {
        if (cells[r][c] === "unknown") {
          cells[r][c] = "star";
          return true;
        }
      }
    }
    return false;
  };
}
