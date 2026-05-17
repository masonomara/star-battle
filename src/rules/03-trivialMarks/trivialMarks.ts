import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export function trivialMarks(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
    const axisUnknowns = axis === "row" ? analysis.rowUnknowns : analysis.colUnknowns;
    let changed = false;
    for (let i = 0; i < analysis.size; i++) {
      if (axisStars[i] === board.stars) {
        for (const [r, c] of axisUnknowns[i]) {
          cells[r][c] = "marked";
          changed = true;
        }
      }
    }
    return changed;
  };
}
