import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * Rule 08a: Tiling Forced Stars (Row)
 *
 * When a row's tiling capacity equals stars needed,
 * cells with single-coverage in all minimal tilings must be stars.
 */
export default function tilingForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  const numCols = board.grid[0]?.length ?? 0;

  for (let row = 0; row < size; row++) {
    const needed = board.stars - analysis.rowStars[row];
    if (needed <= 0) continue;

    const unknowns: Coord[] = [];
    for (let col = 0; col < numCols; col++) {
      if (cells[row][col] === "unknown") {
        unknowns.push([row, col]);
      }
    }

    const tiling = analysis.getTiling(unknowns);
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
