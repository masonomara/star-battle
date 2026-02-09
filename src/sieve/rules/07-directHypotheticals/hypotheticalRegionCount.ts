/**
 * Hypothetical Region Count
 *
 * For each unknown cell, asks: "If I place a star here,
 * do all affected regions still have enough cells for their quotas?"
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey, neighbors } from "../../helpers/neighbors";
import { hypotheticalLoop } from "../../helpers/hypotheticalLoop";

export default function hypotheticalRegionCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = analysis.size;

  return hypotheticalLoop(board, cells, analysis, false, (row, col, state) => {
    const affectedRegions = new Set<number>();
    affectedRegions.add(board.grid[row][col]);
    for (const [nr, nc] of neighbors(row, col, size)) {
      affectedRegions.add(board.grid[nr][nc]);
    }

    for (const regionId of affectedRegions) {
      const region = analysis.regions.get(regionId);
      if (!region) continue;

      let extraStars = 0;
      let remaining = 0;
      for (const [r, c] of region.unknownCoords) {
        if (cells[r][c] !== "unknown") continue;
        const key = cellKey(r, c, size);
        if (state.starKeys.has(key)) extraStars = 1;
        else if (!state.marked.has(key)) remaining++;
      }

      const needed = region.starsNeeded - extraStars;
      if (needed > 0 && remaining < needed) return true;
    }
    return false;
  });
}
