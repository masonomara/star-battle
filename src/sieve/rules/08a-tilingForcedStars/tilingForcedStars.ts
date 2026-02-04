import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * Rule 8a: Tiling Forced Stars
 *
 * When capacity === starsNeeded, each tile contains exactly one star.
 * Cells with single-coverage in ALL minimal tilings must be stars.
 * Applies to rows, columns, and regions.
 */
export default function tilingForcedStars(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  const numCols = board.grid[0]?.length ?? 0;

  // Check rows
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

  // Check columns
  for (let col = 0; col < numCols; col++) {
    const needed = board.stars - analysis.colStars[col];
    if (needed <= 0) continue;

    const unknowns: Coord[] = [];
    for (let row = 0; row < size; row++) {
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

  // Check regions
  for (const [, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const tiling = analysis.getTiling(meta.unknownCoords);
    if (tiling.capacity !== meta.starsNeeded) continue;

    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "star";
        return true;
      }
    }
  }

  return false;
}
