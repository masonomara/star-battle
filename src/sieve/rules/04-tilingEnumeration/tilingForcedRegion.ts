import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState } from "../../helpers/types";
import { tilingForced } from "../../helpers/tilingForcedHelper";

/**
 * Tiling Forced Stars (Region)
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
