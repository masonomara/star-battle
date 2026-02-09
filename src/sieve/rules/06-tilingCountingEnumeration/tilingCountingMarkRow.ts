/**
 * Rule: Tiling Counting Mark (Row)
 *
 * For each row, if the sum of minimum region contributions equals the row's
 * star need, regions with minimum = 0 can't place stars in this row — mark them.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "../../helpers/tilingCountingHelper";

export default function tilingCountingMarkRow(
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
      if (minContrib !== 0) return false;
      let changed = false;
      for (const [r, c] of regionMeta.unknownCoords) {
        if (r === lineIndex && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
