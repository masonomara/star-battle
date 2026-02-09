/**
 * Rule: Counting Mark (Row)
 *
 * If a group of rows forms a tight constraint with its touching regions,
 * every region must contribute its max — mark region cells outside those rows.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default functioncountingMarkRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const flow = analysis.getCountingFlow("row");
  if (!flow.feasible) return false;

  for (const ts of flow.tightSets) {
    for (const contrib of ts.regionContribs) {
      if (contrib.maxContrib !== contrib.starsNeeded) continue;
      let changed = false;
      for (const [r, c] of contrib.unknownCoords) {
        if (!((ts.mask >> r) & 1) && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      if (changed) return true;
    }
  }

  return false;
}
