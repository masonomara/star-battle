/**
 * Rule 12a: Hypothetical Row Capacity
 *
 * Marks cells where placing a star would leave a nearby row
 * unable to fit its required stars.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can rows r-1, r, and r+1 still meet their quotas?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeTiling } from "../../helpers/tiling";
import { buildMarkedCellSet } from "../../helpers/neighbors";

function checkRowViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  markedCells: Set<string>,
): boolean {
  const size = board.grid.length;
  const starKey = `${starRow},${starCol}`;

  // Check rows affected by this star (the star's row and adjacent rows)
  for (
    let row = Math.max(0, starRow - 1);
    row <= Math.min(size - 1, starRow + 1);
    row++
  ) {
    let existingStars = 0;
    const remainingCells: Coord[] = [];

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = `${row},${col}`;
        // If this is the hypothetical star location, count it as a star
        if (key === starKey) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
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

export default function hypotheticalRowCapacity(
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

      if (checkRowViolation(row, col, board, cells, markedCells)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
