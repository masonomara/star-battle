import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord } from "../../helpers/types";
import { tilingForced } from "../../helpers/tilingForcedHelper";

/**
 * Tiling Forced Stars (Row)
 */
export default function tilingForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    const needed = board.stars - analysis.rowStars[row];
    if (needed <= 0) continue;

    const unknowns: Coord[] = [];
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "unknown") {
        unknowns.push([row, col]);
      }
    }

    if (tilingForced(cells, unknowns, needed, analysis)) return true;
  }

  return false;
}
