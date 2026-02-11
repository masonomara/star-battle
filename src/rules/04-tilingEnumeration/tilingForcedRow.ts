import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState } from "../../helpers/types";

export default function tilingForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (let row = 0; row < analysis.size; row++) {
    const needed = board.stars - analysis.rowStars[row];
    if (needed <= 0) continue;

    const tiling = analysis.getTiling(analysis.rowUnknowns[row]);
    if (tiling.capacity !== needed) continue;

    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "star";
        return true;
      }
    }
  }

  return false;
}
