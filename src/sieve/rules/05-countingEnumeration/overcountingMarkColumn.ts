/**
 * Rule: Overcounting Mark (Column)
 *
 * If a group of columns forms a tight counting constraint,
 * cells in those columns that belong to regions NOT supplying the group
 * can't be stars — the group is already fully supplied.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

export default function overcountingMarkColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const flow = analysis.getCountingFlow("col");
  if (!flow.feasible) return false;

  for (const ts of flow.tightSets) {
    // Collect cells inside the mask from contributing regions
    const supplied = new Set<number>();
    for (const contrib of ts.regionContribs) {
      if (contrib.maxContrib <= 0) continue;
      for (const [r, c] of contrib.unknownCoords) {
        if ((ts.mask >> c) & 1) {
          supplied.add(r * size + c);
        }
      }
    }

    // Mark cells in masked columns not from any supplying region
    let changed = false;
    for (let col = 0; col < size; col++) {
      if (!((ts.mask >> col) & 1)) continue;
      for (const [r, c] of analysis.colUnknowns[col]) {
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
