import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "../../helpers/tilingCounting";

export default function groupTilingCountingMarkRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return tilingCountingLoop(
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
    2,
    4,
  );
}
