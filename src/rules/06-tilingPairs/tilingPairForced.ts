import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { squeezePairLoop } from "../../helpers/tilingPairs";

export function tilingPairForced(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return squeezePairLoop(cells, analysis.size, board.stars, analysis, axis, (_pairCells, tiling) => {
      for (const [r, c] of tiling.forcedCells) {
        if (cells[r][c] === "unknown") {
          cells[r][c] = "star";
          return true;
        }
      }
      return false;
    });
  };
}
