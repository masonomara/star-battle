/**
 * Shared loop for tiling counting: for each line (row or column), compute
 * the minimum number of stars each touching region must place in that line
 * using tiling capacity of cells outside the line. When the sum of minimums
 * equals the line's star need, the constraint is tight — delegate deductions.
 *
 * minContrib(region, line) = max(0, starsNeeded - capacity(cellsOutside))
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";

export function tilingCountingLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  deduct: (
    cells: CellState[][],
    lineIndex: number,
    regionMeta: RegionMeta,
    minContrib: number,
  ) => boolean,
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
  const lineToRegions =
    axis === "row" ? analysis.rowToRegions : analysis.colToRegions;

  for (let line = 0; line < size; line++) {
    const lineNeeded = board.stars - axisStars[line];
    if (lineNeeded <= 0) continue;

    const touchingIds = lineToRegions.get(line);
    if (!touchingIds || touchingIds.size === 0) continue;

    let totalMin = 0;
    let exceeded = false;
    const entries: { meta: RegionMeta; minContrib: number }[] = [];

    for (const regionId of touchingIds) {
      const meta = regions.get(regionId)!;
      if (meta.starsNeeded <= 0) continue;

      const cellsOutside: Coord[] = [];
      for (const [r, c] of meta.unknownCoords) {
        if ((axis === "row" ? r : c) !== line) {
          cellsOutside.push([r, c]);
        }
      }

      const capacityOutside =
        cellsOutside.length === 0
          ? 0
          : analysis.getTiling(cellsOutside).capacity;

      const minContrib = Math.max(0, meta.starsNeeded - capacityOutside);
      totalMin += minContrib;
      entries.push({ meta, minContrib });

      if (totalMin > lineNeeded) {
        exceeded = true;
        break;
      }
    }

    if (exceeded || totalMin !== lineNeeded) continue;

    let changed = false;
    for (const { meta, minContrib } of entries) {
      if (deduct(cells, line, meta, minContrib)) {
        changed = true;
      }
    }
    if (changed) return true;
  }

  return false;
}