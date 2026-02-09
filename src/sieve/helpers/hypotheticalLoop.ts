/**
 * Shared per-cell hypothetical loop.
 *
 * For each unknown cell, builds a hypothetical state (single-star or
 * propagated), passes it to a check callback, and marks the cell if
 * the check returns true.
 */

import { Board, CellState } from "./types";
import { BoardAnalysis } from "./boardAnalysis";
import { buildMarkedCellSet, cellKey } from "./neighbors";
import {
  propagateHypothetical,
  PropagatedState,
} from "./propagateHypothetical";

export function hypotheticalLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  propagate: boolean,
  check: (row: number, col: number, state: PropagatedState) => boolean,
): boolean {
  const { size } = analysis;
  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const state: PropagatedState = propagate
        ? propagateHypothetical(board, cells, row, col, analysis)
        : {
            violation: null,
            starKeys: new Set([cellKey(row, col, size)]),
            marked: buildMarkedCellSet(row, col, size),
          };

      if (check(row, col, state)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
