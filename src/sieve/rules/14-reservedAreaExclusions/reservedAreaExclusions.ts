/**
 * Rule 14: Reserved Area Exclusions
 *
 * For each line (row/column), compute the minimum number of stars each
 * intersecting region MUST contribute to that line. If the sum of minimums
 * equals the line's star requirement, cells from regions with min=0 can be excluded.
 *
 * This implements the "reserved area" pattern: when certain regions are forced
 * to provide all stars for a line (because their cells outside the line can't
 * hold enough stars), cells from non-forced regions can be excluded.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, RegionMeta, capacity } from "../../helpers/boardAnalysis";

function applyForAxis(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  let changed = false;
  const size = board.grid.length;
  const lineStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  for (let lineIdx = 0; lineIdx < size; lineIdx++) {
    const starsNeeded = board.stars - lineStars[lineIdx];
    if (starsNeeded <= 0) continue;

    // Gather regions intersecting this line with their cells inside/outside
    const regionData = new Map<number, { inLine: Coord[]; outside: Coord[] }>();

    for (const [regionId, meta] of regions) {
      if (meta.starsNeeded <= 0) continue;

      const inLine: Coord[] = [];
      const outside: Coord[] = [];

      for (const [r, c] of meta.unknownCoords) {
        const isInLine = axis === "row" ? r === lineIdx : c === lineIdx;
        (isInLine ? inLine : outside).push([r, c]);
      }

      if (inLine.length > 0) {
        regionData.set(regionId, { inLine, outside });
      }
    }

    // Compute min contribution per region
    let totalMin = 0;
    const forcedRegions = new Set<number>();

    for (const [regionId, { outside }] of regionData) {
      const meta = regions.get(regionId)!;
      const maxOutside = capacity(outside, analysis);
      const minContrib = Math.max(0, meta.starsNeeded - maxOutside);

      totalMin += minContrib;
      if (minContrib > 0) {
        forcedRegions.add(regionId);
      }
    }

    // If forced regions exactly cover the line's need, exclude others
    if (totalMin === starsNeeded && forcedRegions.size > 0) {
      for (let i = 0; i < size; i++) {
        const [row, col] = axis === "row" ? [lineIdx, i] : [i, lineIdx];
        if (cells[row][col] !== "unknown") continue;

        const regionId = board.grid[row][col];
        if (!forcedRegions.has(regionId)) {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}

export default function reservedAreaExclusions(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions } = analysis;

  if (applyForAxis(board, cells, regions, analysis, "row")) {
    return true;
  }
  if (applyForAxis(board, cells, regions, analysis, "col")) {
    return true;
  }
  return false;
}
