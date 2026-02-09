import { BoardAnalysis } from "./boardAnalysis";
import { CellState, Coord } from "./types";

/**
 * When tiling capacity equals stars needed,
 * cells with single-coverage in all minimal tilings must be stars.
 */
export function tilingForced(
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
