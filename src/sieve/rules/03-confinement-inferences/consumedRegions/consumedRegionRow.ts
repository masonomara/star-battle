/**
 * Rule: Consumed Region (Row)
 *
 * When a region's remaining stars can't satisfy a row's star need,
 * the row must get the overflow from outside that region.
 * If the cells outside equal the overflow, they're all forced stars.
 */

import { Board, CellState, Coord } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

export default function consumedRegionRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowStars, rowToRegions } = analysis;

  for (let row = 0; row < size; row++) {
    const rowStarsNeeded = board.stars - rowStars[row];
    if (rowStarsNeeded <= 0) continue;

    const touchedRegions = rowToRegions.get(row);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    for (const regionId of touchedRegions) {
      const meta = regions.get(regionId);
      if (!meta || meta.starsNeeded <= 0) continue;

      const overflow = rowStarsNeeded - meta.starsNeeded;
      if (overflow <= 0) continue;

      const cellsOutside: Coord[] = [];
      for (let col = 0; col < size; col++) {
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
