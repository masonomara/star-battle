import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * Core: When tiling capacity equals stars needed,
 * cells with single-coverage in all minimal tilings must be stars.
 */
function tilingForced(
  cells: CellState[][],
  unknowns: Coord[],
  needed: number,
  analysis: BoardAnalysis,
): boolean {
  if (needed <= 0) return false;

  const tiling = analysis.getTiling(unknowns);
  if (tiling.capacity !== needed) return false;

  for (const [r, c] of tiling.forcedCells) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "star";
      return true;
    }
  }

  return false;
}

/**
 * Rule 08a: Tiling Forced Stars (Row)
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
