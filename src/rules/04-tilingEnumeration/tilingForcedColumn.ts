import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState } from "../../helpers/types";

export default function tilingForcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (let col = 0; col < analysis.size; col++) {
    const needed = board.stars - analysis.colStars[col];
    if (needed <= 0) continue;

    const tiling = analysis.getTiling(analysis.colUnknowns[col]);
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
