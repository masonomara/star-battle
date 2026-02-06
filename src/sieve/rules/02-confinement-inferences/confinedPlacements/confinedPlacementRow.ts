/**
 * Rule: Confined Line Placements (Row)
 *
 * When a row's remaining quota can't satisfy a region's star need,
 * the region must place the overflow outside that row.
 * If the cells outside equal the overflow, they're all forced stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

export default function confinedPlacementRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions, rowStars } = analysis;

  for (const [, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    for (const row of meta.unknownRows) {
      const overflow = meta.starsNeeded - (board.stars - rowStars[row]);
      if (overflow <= 0) continue;

      const cellsOutside = meta.unknownCoords.filter(([r]) => r !== row);
      if (cellsOutside.length !== overflow) continue;

      return applyDeductions(
        cells,
        cellsOutside.map((coord) => ({ coord, state: "star" as const })),
      );
    }
  }

  return false;
}
