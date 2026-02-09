import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { squeezePairLoop } from "../../helpers/squeezeHelper";
import { Board, CellState } from "../../helpers/types";

export default function tilingPairForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;

  return squeezePairLoop(cells, size, board.stars, analysis, "row", (_pairCells, tiling) => {
    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "star";
        return true;
      }
    }
    return false;
  });
}
