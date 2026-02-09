import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord } from "../../helpers/types";
import { tilingForced } from "../../helpers/tilingForcedHelper";

/**
 * Tiling Forced Stars (Column)
 */
export default function tilingForcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;

  for (let col = 0; col < size; col++) {
    const needed = board.stars - analysis.colStars[col];
    if (needed <= 0) continue;

    const unknowns: Coord[] = [];
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "unknown") {
        unknowns.push([row, col]);
      }
    }

    if (tilingForced(cells, unknowns, needed, analysis)) return true;
  }

  return false;
}
