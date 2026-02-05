/**
 * Rule: Confinement Overflow (Column)
 *
 * When a column's remaining quota can't satisfy a region's star need,
 * the region must place the overflow outside that column.
 * If the cells outside equal the overflow, they're all forced stars.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { applyDeductions } from "../../helpers/applyDeductions";
import { detectQuotaOverflow } from "./detectQuotaOverflow";

export default function overflowColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions, colStars } = analysis;

  for (const [, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    for (const col of meta.unknownCols) {
      const remainingQuota = board.stars - colStars[col];
      const cellsOutside = meta.unknownCoords.filter(([, c]) => c !== col);

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
