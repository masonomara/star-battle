import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { squeezePairLoop } from "../../helpers/tilingPairs";
import { Board, CellState } from "../../helpers/types";

export default function tilingPairForcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;

  return squeezePairLoop(cells, size, board.stars, analysis, "col", (_pairCells, tiling) => {
    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "star";
        return true;
      }
    }
    return false;
  });
}
