/**
 * Rule: Consumed Line (Column)
 *
 * When a column's remaining quota can't satisfy a region's star need,
 * the region must place the overflow outside that column.
 * If the cells outside equal the overflow, they're all forced stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

export default function consumedLineColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions, colStars } = analysis;

  for (const [, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    for (const col of meta.unknownCols) {
      const overflow = meta.starsNeeded - (board.stars - colStars[col]);
      if (overflow <= 0) continue;

      const cellsOutside = meta.unknownCoords.filter(([, c]) => c !== col);
      if (cellsOutside.length !== overflow) continue;

      return applyDeductions(
        cells,
        cellsOutside.map((coord) => ({ coord, state: "star" as const })),
      );
    }
  }

  return false;
}
