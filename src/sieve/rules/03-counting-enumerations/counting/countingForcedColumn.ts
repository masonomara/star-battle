/**
 * Rule: Counting Forced (Column)
 *
 * If a group of columns forms a tight constraint and a region has exactly as
 * many unknowns inside as it must contribute, those cells must be stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

export default function countingForcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const flow = analysis.getCountingFlow("col");
  if (!flow.feasible) return false;

  for (const ts of flow.tightSets) {
    for (const contrib of ts.regionContribs) {
      if (contrib.inside !== contrib.maxContrib) continue;
      let changed = false;
      for (const [r, c] of contrib.unknownCoords) {
        if ((ts.mask >> c) & 1 && cells[r][c] === "unknown") {
          cells[r][c] = "star";
          changed = true;
        }
      }
      if (changed) return true;
    }
  }

  return false;
}
