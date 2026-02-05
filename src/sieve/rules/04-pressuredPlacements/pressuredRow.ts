/**
 * Rule: Region-Line Overflow (Row)
 *
 * When a row cannot satisfy a region's full star quota,
 * the region must place stars outside that row.
 *
 * If the region's cells outside the row equal the overflow amount,
 * those cells are forced stars.
 *
 * This is the dual of confinement:
 * - Confinement: "region fits in line → eliminate line's other cells"
 * - Overflow: "line can't satisfy region → force stars outside line"
 */

import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeTiling } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";

export default function pressuredRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowStars } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (const [, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    // Check each row that this region touches
    for (const row of meta.unknownRows) {
      // Get region's unknown cells in this row
      const cellsInRow: Coord[] = [];
      const cellsOutsideRow: Coord[] = [];

      for (const [r, c] of meta.unknownCoords) {
        if (r === row) {
          cellsInRow.push([r, c]);
        } else {
          cellsOutsideRow.push([r, c]);
        }
      }

      if (cellsInRow.length === 0 || cellsOutsideRow.length === 0) continue;

      // How many stars can this row contribute to the region?
      // Limited by: row's remaining quota AND tiling capacity of region's cells in row
      const rowRemainingQuota = board.stars - rowStars[row];
      const tilingCapacityInRow = computeTiling(cellsInRow, size).capacity;
      const maxContributionFromRow = Math.min(
        rowRemainingQuota,
        tilingCapacityInRow,
      );

      // How many stars must the region place outside this row?
      const mustPlaceOutside = meta.starsNeeded - maxContributionFromRow;

      if (mustPlaceOutside <= 0) continue;

      // Check if cells outside row can exactly satisfy the overflow
      const capacityOutsideRow = computeTiling(cellsOutsideRow, size).capacity;

      if (capacityOutsideRow === mustPlaceOutside) {
        // All cells outside row with capacity must be stars
        // Use tiling to find forced cells
        const tiling = analysis.getTiling(cellsOutsideRow);
        for (const [r, c] of tiling.forcedCells) {
          if (cells[r][c] === "unknown") {
            cells[r][c] = "star";
            changed = true;
            return true; // Return after placing one star
          }
        }

        // If no forced cells from tiling but capacity matches needed,
        // and there's only one cell, it must be a star
        if (cellsOutsideRow.length === mustPlaceOutside) {
          for (const [r, c] of cellsOutsideRow) {
            if (cells[r][c] === "unknown") {
              cells[r][c] = "star";
              changed = true;
              return true;
            }
          }
        }
      }
    }
  }

  return changed;
}
