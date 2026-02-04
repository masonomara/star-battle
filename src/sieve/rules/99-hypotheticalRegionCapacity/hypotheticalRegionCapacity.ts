/**
 * Rule 12c: Hypothetical Region Capacity
 *
 * Marks cells where placing a star would leave the affected region
 * unable to fit its required stars.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can this region still meet its quota?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeTiling } from "../../helpers/tiling";
import { buildMarkedCellSet } from "../../helpers/oneByN";
import { neighbors } from "../../helpers/neighbors";

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

  // Get all regions affected by this star placement
  // This includes the region the star is in, plus regions of adjacent cells
  const affectedRegions = new Set<number>();
  affectedRegions.add(board.grid[starRow][starCol]);
  for (const [nr, nc] of neighbors(starRow, starCol, size)) {
    affectedRegions.add(board.grid[nr][nc]);
  }

  // Check each affected region
  for (const regionId of affectedRegions) {
    const regionMeta = analysis.regions.get(regionId);
    if (!regionMeta) continue;

    let existingStars = regionMeta.starCount;
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
    if (needed <= 0) continue;

    // Basic count check
    if (remainingCells.length < needed) {
      return true;
    }

    // Tiling capacity check
    if (computeTiling(remainingCells, size).capacity < needed) {
      return true;
    }
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

      if (
        checkRegionViolation(row, col, board, cells, markedCells, analysis)
      ) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
