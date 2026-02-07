/**
 * Rule 12c: Hypothetical Region Capacity
 *
 * Marks cells where placing a star would leave its own region
 * unable to fit its remaining required stars.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can my own region still meet its quota?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/neighbors";

function checkOwnRegionViolation(
  starRow: number,
  starCol: number,
  board: Board,
  markedCells: Set<string>,
  analysis: BoardAnalysis,
): boolean {
  const starKey = `${starRow},${starCol}`;
  const regionId = board.grid[starRow][starCol];
  const regionMeta = analysis.regions.get(regionId);
  if (!regionMeta) return false;

  let existingStars = regionMeta.starsPlaced;
  const remainingCells: Coord[] = [];

  for (const [r, c] of regionMeta.unknownCoords) {
    const key = `${r},${c}`;
    if (key === starKey) {
      existingStars++;
    } else if (!markedCells.has(key)) {
      remainingCells.push([r, c]);
    }
  }

  const needed = board.stars - existingStars;
  if (needed <= 0) return false;

  if (remainingCells.length < needed) {
    return true;
  }

  if (analysis.getTiling(remainingCells).capacity < needed) {
    return true;
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

      if (checkOwnRegionViolation(row, col, board, markedCells, analysis)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
