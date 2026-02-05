import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState } from "../../helpers/types";

/**
 * Rule 08c: Tiling Forced Stars (Region)
 *
 * When a region's tiling capacity equals stars needed,
 * cells with single-coverage in all minimal tilings must be stars.
 */
export default function tilingForcedRegion(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
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
