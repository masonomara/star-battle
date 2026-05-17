import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export function countingMark(axis: "row" | "col") {
  return function (
    _board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const flow = analysis.getCountingFlow(axis);
    if (!flow.feasible) return false;
    for (const ts of flow.tightSets) {
      for (const contrib of ts.regionContribs) {
        if (contrib.maxContrib !== contrib.starsNeeded) continue;
        let changed = false;
        for (const [r, c] of contrib.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if (!((ts.mask >> lineIdx) & 1) && cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
        if (changed) return true;
      }
    }
    return false;
  };
}
