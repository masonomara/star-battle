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
 * Rule 08c: Tiling Forced Stars (Region)
 */
export default function tilingForcedRegion(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (const [, meta] of analysis.regions) {
    if (tilingForced(cells, meta.unknownCoords, meta.starsNeeded, analysis))
      return true;
  }

  return false;
}
