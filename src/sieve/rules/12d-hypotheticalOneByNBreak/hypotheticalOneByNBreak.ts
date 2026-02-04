/**
 * Rule 12d: Hypothetical 1×N Break
 *
 * Marks cells where placing a star would make a 1×N constraint unsatisfiable.
 *
 * A 1×N constraint is when a region's remaining cells are all in one row/column,
 * guaranteeing that row/column receives stars from that region.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can all affected 1×N constraints still be satisfied?"
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import {
  computeConfinement,
  ConfinedRegion,
} from "../../helpers/confinement";
import { buildMarkedCellSet } from "../../helpers/oneByN";

function checkOneByNViolation(
  starRow: number,
  starCol: number,
  markedCells: Set<string>,
  oneByNConstraints: ConfinedRegion[],
): boolean {
  const starKey = `${starRow},${starCol}`;

  for (const constraint of oneByNConstraints) {
    // Check if the hypothetical star is in this constraint
    const starInConstraint = constraint.cells.some(
      ([r, c]) => r === starRow && c === starCol,
    );

    // Count remaining cells in the constraint after marking
    let remainingInConstraint = 0;
    for (const [r, c] of constraint.cells) {
      const key = `${r},${c}`;
      if (key !== starKey && !markedCells.has(key)) {
        remainingInConstraint++;
      }
    }

    // Adjust needed stars if the hypothetical star is in the constraint
    const adjustedNeed = starInConstraint
      ? constraint.starsNeeded - 1
      : constraint.starsNeeded;

    // If we still need stars but don't have enough cells, violation
    if (adjustedNeed > 0 && remainingInConstraint < adjustedNeed) {
      return true;
    }
  }

  return false;
}

export default function hypotheticalOneByNBreak(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  // Precompute 1×N constraints once
  const confinement = computeConfinement(analysis);
  const oneByNConstraints: ConfinedRegion[] = [];
  for (const regions of confinement.row.values()) {
    oneByNConstraints.push(...regions);
  }
  for (const regions of confinement.col.values()) {
    oneByNConstraints.push(...regions);
  }
  if (oneByNConstraints.length === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (checkOneByNViolation(row, col, markedCells, oneByNConstraints)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
