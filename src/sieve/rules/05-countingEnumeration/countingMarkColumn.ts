/**
 * Rule: Counting Mark (Column)
 *
 * If a group of columns forms a tight constraint with its touching regions,
 * every region must contribute its max — mark region cells outside those columns.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export default functioncountingMarkColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const flow = analysis.getCountingFlow("col");
  if (!flow.feasible) return false;

  for (const ts of flow.tightSets) {
    for (const contrib of ts.regionContribs) {
      if (contrib.maxContrib !== contrib.starsNeeded) continue;
      let changed = false;
      for (const [r, c] of contrib.unknownCoords) {
        if (!((ts.mask >> c) & 1) && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      if (changed) return true;
    }
  }

  return false;
}
