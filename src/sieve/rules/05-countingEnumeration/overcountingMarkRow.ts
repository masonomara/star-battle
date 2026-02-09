/**
 * Rule: Overcounting Mark (Row)
 *
 * If a group of rows forms a tight counting constraint,
 * cells in those rows that belong to regions NOT supplying the group
 * can't be stars — the group is already fully supplied.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function overcountingMarkRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const flow = analysis.getCountingFlow("row");
  if (!flow.feasible) return false;

  for (const ts of flow.tightSets) {
    // Collect cells inside the mask from contributing regions
    const supplied = new Set<number>();
    for (const contrib of ts.regionContribs) {
      if (contrib.maxContrib <= 0) continue;
      for (const [r, c] of contrib.unknownCoords) {
        if ((ts.mask >> r) & 1) {
          supplied.add(r * size + c);
        }
      }
    }

    // Mark cells in masked rows not from any supplying region
    let changed = false;
    for (let row = 0; row < size; row++) {
      if (!((ts.mask >> row) & 1)) continue;
      for (const [r, c] of analysis.rowUnknowns[row]) {
        if (!supplied.has(r * size + c) && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
    }
    if (changed) return true;
  }

  return false;
}
