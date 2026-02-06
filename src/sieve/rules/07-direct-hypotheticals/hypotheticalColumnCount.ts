/**
 * Hypothetical Column Count
 *
 * Marks cells where placing a star would leave a nearby column
 * without enough remaining cells for its required stars.
 *
 * For each unknown cell, asks: "If I place a star here,
 * do columns c-1, c, and c+1 still have enough cells for their quotas?"
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/oneByN";

function checkColumnViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  markedCells: Set<string>,
): boolean {
  const size = board.grid.length;
  const starKey = `${starRow},${starCol}`;

  for (
    let col = Math.max(0, starCol - 1);
    col <= Math.min(size - 1, starCol + 1);
    col++
  ) {
    let existingStars = 0;
    let remainingCount = 0;

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = `${row},${col}`;
        if (key === starKey) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCount++;
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    if (remainingCount < needed) {
      return true;
    }
  }

  return false;
}

export default function hypotheticalColumnCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (checkColumnViolation(row, col, board, cells, markedCells)) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}
