/**
 * Rule: Tiling Counting Forced (Row)
 *
 * For each row, if the sum of minimum region contributions equals the row's
 * star need (tight), a region must place (starsNeeded - minContrib) stars
 * outside the row. If it has exactly that many unknown cells outside, they
 * are all forced stars.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "../../helpers/tilingCountingHelper";

export default function tilingCountingForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return tilingCountingLoop(
    board,
    cells,
    analysis,
    "row",
    (cells, lineIndex, regionMeta, minContrib) => {
      const starsOutside = regionMeta.starsNeeded - minContrib;
      if (starsOutside <= 0) return false;

      let outsideCount = 0;
      for (const [r, c] of regionMeta.unknownCoords) {
        if (r !== lineIndex && cells[r][c] === "unknown") {
          outsideCount++;
        }
      }

      if (outsideCount !== starsOutside) return false;

      let changed = false;
      for (const [r, c] of regionMeta.unknownCoords) {
        if (r !== lineIndex && cells[r][c] === "unknown") {
          cells[r][c] = "star";
          changed = true;
        }
      }
      return changed;
    },
  );
}
