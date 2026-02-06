/**
 * Rule: Consumed Region (Column)
 *
 * When a region's remaining stars can't satisfy a column's star need,
 * the column must get the overflow from outside that region.
 * If the cells outside equal the overflow, they're all forced stars.
 */

import { Board, CellState, Coord } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

export default function consumedRegionColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, colStars, colToRegions } = analysis;

  for (let col = 0; col < size; col++) {
    const colStarsNeeded = board.stars - colStars[col];
    if (colStarsNeeded <= 0) continue;

    const touchedRegions = colToRegions.get(col);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    for (const regionId of touchedRegions) {
      const meta = regions.get(regionId);
      if (!meta || meta.starsNeeded <= 0) continue;

      const overflow = colStarsNeeded - meta.starsNeeded;
      if (overflow <= 0) continue;

      const cellsOutside: Coord[] = [];
      for (let row = 0; row < size; row++) {
        if (cells[row][col] === "unknown" && board.grid[row][col] !== regionId) {
          cellsOutside.push([row, col]);
        }
      }
      if (cellsOutside.length !== overflow) continue;

      return applyDeductions(
        cells,
        cellsOutside.map((coord) => ({ coord, state: "star" as const })),
      );
    }
  }

  return false;
}
