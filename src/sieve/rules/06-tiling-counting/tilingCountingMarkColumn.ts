/**
 * Rule: Tiling Counting Mark (Column)
 *
 * For each column, if the sum of minimum region contributions equals the
 * column's star need, regions with minimum = 0 can't place stars here — mark them.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "./tilingCountingHelper";

export default function tilingCountingMarkColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return tilingCountingLoop(
    board,
    cells,
    analysis,
    "col",
    (cells, lineIndex, regionMeta, minContrib) => {
      if (minContrib !== 0) return false;
      let changed = false;
      for (const [r, c] of regionMeta.unknownCoords) {
        if (c === lineIndex && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
