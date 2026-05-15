import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "../../helpers/tilingCounting";

export function tilingCountingMark(axis: "row" | "col", minGroup = 1, maxGroup = 1) {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return tilingCountingLoop(
      board,
      cells,
      analysis,
      axis,
      (cells, mask, regionMeta, minContrib) => {
        if (minContrib !== 0) return false;
        let changed = false;
        for (const [r, c] of regionMeta.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if ((mask >> lineIdx) & 1 && cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
        return changed;
      },
      minGroup,
      maxGroup,
    );
  };
}
