import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { tilingCountingLoop } from "../../helpers/tilingCounting";

export function tilingCountingForced(axis: "row" | "col") {
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
        const starsOutside = regionMeta.starsNeeded - minContrib;
        if (starsOutside <= 0) return false;
        let outsideCount = 0;
        for (const [r, c] of regionMeta.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if (!((mask >> lineIdx) & 1) && cells[r][c] === "unknown") outsideCount++;
        }
        if (outsideCount !== starsOutside) return false;
        let changed = false;
        for (const [r, c] of regionMeta.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if (!((mask >> lineIdx) & 1) && cells[r][c] === "unknown") {
            cells[r][c] = "star";
            changed = true;
          }
        }
        return changed;
      },
    );
  };
}
