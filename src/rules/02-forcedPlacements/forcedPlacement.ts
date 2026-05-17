import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

// Fires on one container at a time — a star placement cascades adjacency marks
// which may change what's forced elsewhere. Re-entering from rule 1 after each
// placement is correct. Do NOT batch all containers into one pass.
export function forcedPlacement(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
    const axisUnknowns = axis === "row" ? analysis.rowUnknowns : analysis.colUnknowns;
    for (let i = 0; i < analysis.size; i++) {
      const needed = board.stars - axisStars[i];
      const unknowns = axisUnknowns[i];
      if (needed > 0 && unknowns.length === needed) {
        for (const [r, c] of unknowns) cells[r][c] = "star";
        return true;
      }
    }
    return false;
  };
}
