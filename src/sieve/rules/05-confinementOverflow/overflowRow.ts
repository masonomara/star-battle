/**
 * Rule: Confinement Overflow (Row)
 *
 * When a row's remaining quota can't satisfy a region's star need,
 * the region must place the overflow outside that row.
 * If the cells outside equal the overflow, they're all forced stars.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { applyDeductions } from "../../helpers/applyDeductions";
import { detectQuotaOverflow } from "./detectQuotaOverflow";

export default function overflowRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions, rowStars } = analysis;

  for (const [, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    for (const row of meta.unknownRows) {
      const remainingQuota = board.stars - rowStars[row];
      const cellsOutside = meta.unknownCoords.filter(([r]) => r !== row);

      const deductions = detectQuotaOverflow(
        meta.starsNeeded,
        remainingQuota,
        cellsOutside,
      );

      if (deductions.length > 0) {
        return applyDeductions(cells, deductions);
      }
    }
  }

  return false;
}
