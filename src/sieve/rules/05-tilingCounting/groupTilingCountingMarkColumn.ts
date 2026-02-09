/**
 * Rule: Group Tiling Counting Mark (Column)
 *
 * For groups of columns, if the sum of tiling-based minimum region contributions
 * equals the group's star need, regions with minimum = 0 can't place stars
 * in these columns — mark them.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "../../helpers/tilingCountingHelper";

export default function groupTilingCountingMarkColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return tilingCountingLoop(
    board,
    cells,
    analysis,
    "col",
    (cells, mask, regionMeta, minContrib) => {
      if (minContrib !== 0) return false;
      let changed = false;
      for (const [r, c] of regionMeta.unknownCoords) {
        if ((mask >> c) & 1 && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      return changed;
    },
    2,
    4,
  );
}
