/**
 * Rule: Region-Line Overflow (Column)
 *
 * When a column cannot satisfy a region's full star quota,
 * the region must place stars outside that column.
 *
 * If the region's cells outside the column equal the overflow amount,
 * those cells are forced stars.
 *
 * This is the dual of confinement:
 * - Confinement: "region fits in line → eliminate line's other cells"
 * - Overflow: "line can't satisfy region → force stars outside line"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeTiling } from "../../helpers/tiling";

export default function regionLineOverflowColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, colStars } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (const [, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    // Check each column that this region touches
    for (const col of meta.unknownCols) {
      // Get region's unknown cells in this column
      const cellsInCol: Coord[] = [];
      const cellsOutsideCol: Coord[] = [];

      for (const [r, c] of meta.unknownCoords) {
        if (c === col) {
          cellsInCol.push([r, c]);
        } else {
          cellsOutsideCol.push([r, c]);
        }
      }

      if (cellsInCol.length === 0 || cellsOutsideCol.length === 0) continue;

      // How many stars can this column contribute to the region?
      // Limited by: column's remaining quota AND tiling capacity of region's cells in column
      const colRemainingQuota = board.stars - colStars[col];
      const tilingCapacityInCol = computeTiling(cellsInCol, size).capacity;
      const maxContributionFromCol = Math.min(
        colRemainingQuota,
        tilingCapacityInCol,
      );

      // How many stars must the region place outside this column?
      const mustPlaceOutside = meta.starsNeeded - maxContributionFromCol;

      if (mustPlaceOutside <= 0) continue;

      // Check if cells outside column can exactly satisfy the overflow
      const capacityOutsideCol = computeTiling(cellsOutsideCol, size).capacity;

      if (capacityOutsideCol === mustPlaceOutside) {
        // All cells outside column with capacity must be stars
        // Use tiling to find forced cells
        const tiling = analysis.getTiling(cellsOutsideCol);
        for (const [r, c] of tiling.forcedCells) {
          if (cells[r][c] === "unknown") {
            cells[r][c] = "star";
            changed = true;
            return true; // Return after placing one star
          }
        }

        // If no forced cells from tiling but capacity matches needed,
        // and there's only one cell, it must be a star
        if (cellsOutsideCol.length === mustPlaceOutside) {
          for (const [r, c] of cellsOutsideCol) {
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
