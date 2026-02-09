/**
 * Rule: Group Tiling Counting Mark (Row)
 *
 * For groups of rows, if the sum of tiling-based minimum region contributions
 * equals the group's star need, regions with minimum = 0 can't place stars
 * in these rows — mark them.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { groupTilingCountingLoop } from "../../helpers/groupTilingCountingHelper";

export default function groupTilingCountingMarkRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return groupTilingCountingLoop(
    board,
    cells,
    analysis,
    "row",
    (cells, mask, regionMeta, minContrib) => {
      if (minContrib !== 0) return false;
      let changed = false;
      for (const [r, c] of regionMeta.unknownCoords) {
        if ((mask >> r) & 1 && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
