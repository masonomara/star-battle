/**
 * Hypothetical Counting Column (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if any subset of columns needs more stars than its touching regions
 * can provide. If so, mark the cell.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/neighbors";
import { hypotheticalConfinementViolation } from "./hypotheticalConfinementHelper";

export default function hypotheticalCountingColumn(
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

      if (hypotheticalConfinementViolation(board, cells, analysis, row, col, markedCells, "col")) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
