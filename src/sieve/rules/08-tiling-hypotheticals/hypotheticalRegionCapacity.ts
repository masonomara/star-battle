/**
 * Hypothetical Region Capacity
 *
 * Marks cells where placing a star would leave any affected region
 * (its own region or adjacent regions) unable to fit its required stars.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can all affected regions still meet their quotas?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet, neighbors } from "../../helpers/neighbors";

function checkRegionViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  markedCells: Set<string>,
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  const starKey = `${starRow},${starCol}`;
  const starRegionId = board.grid[starRow][starCol];

  const affectedRegions = new Set<number>();
  affectedRegions.add(starRegionId);
  for (const [nr, nc] of neighbors(starRow, starCol, size)) {
    affectedRegions.add(board.grid[nr][nc]);
  }

  for (const regionId of affectedRegions) {
    const region = analysis.regions.get(regionId);
    if (!region) continue;

    let extraStars = 0;
    const remainingCells: Coord[] = [];

    for (const [r, c] of region.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (key === starKey) {
        extraStars = 1;
      } else if (!markedCells.has(key)) {
        remainingCells.push([r, c]);
      }
    }

    const needed = region.starsNeeded - extraStars;
    if (needed <= 0) continue;

    if (remainingCells.length < needed) return true;
    if (analysis.getTiling(remainingCells).capacity < needed) return true;
  }

  return false;
}

export default function hypotheticalRegionCapacity(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (checkRegionViolation(row, col, board, cells, markedCells, analysis)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
