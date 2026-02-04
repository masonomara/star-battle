/**
 * Rule 12b: Constrained Quota
 *
 * Marks cells where placing a hypothetical star would break a row or column's
 * ability to meet its star quota, considering 1×N and 2×2 constraints.
 *
 * For each affected row/column:
 * 1. Check if it can still fit its required stars
 * 2. Check if constraints (1×N, 2×2) within that row/col can still be satisfied
 * 3. Check if "free" stars (non-constraint) can fit in remaining non-constraint cells
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/cellKey";
import { computeTiling } from "../../helpers/tiling";
import {
  findOneByNConstraints,
  buildMarkedCellSet,
  OneByNConstraint,
} from "../../helpers/oneByN";
import {
  findStarContaining2x2s,
  StarContaining2x2,
} from "../../helpers/starContaining2x2";

function checkRowOrColumnViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  markedCells: Set<string>,
  oneByNConstraints: OneByNConstraint[],
  twoByTwoConstraints: StarContaining2x2[],
): boolean {
  const size = board.grid.length;
  const starKey = cellKey(starRow, starCol);

  // Group 1×N constraints by row/column
  const oneByNByRow = new Map<number, OneByNConstraint[]>();
  const oneByNByCol = new Map<number, OneByNConstraint[]>();

  for (const c of oneByNConstraints) {
    if (c.axis === "row") {
      if (!oneByNByRow.has(c.index)) oneByNByRow.set(c.index, []);
      oneByNByRow.get(c.index)!.push(c);
    } else {
      if (!oneByNByCol.has(c.index)) oneByNByCol.set(c.index, []);
      oneByNByCol.get(c.index)!.push(c);
    }
  }

  // Group 2×2 constraints by the rows/cols they touch
  const twoByTwoByRow = new Map<number, StarContaining2x2[]>();
  const twoByTwoByCol = new Map<number, StarContaining2x2[]>();

  for (const c of twoByTwoConstraints) {
    for (const [r, col] of c.cells) {
      if (!twoByTwoByRow.has(r)) twoByTwoByRow.set(r, []);
      if (!twoByTwoByRow.get(r)!.includes(c)) {
        twoByTwoByRow.get(r)!.push(c);
      }
      if (!twoByTwoByCol.has(col)) twoByTwoByCol.set(col, []);
      if (!twoByTwoByCol.get(col)!.includes(c)) {
        twoByTwoByCol.get(col)!.push(c);
      }
    }
  }

  // Check rows affected by this star
  for (
    let row = Math.max(0, starRow - 1);
    row <= Math.min(size - 1, starRow + 1);
    row++
  ) {
    let existingStars = 0;
    const remainingCells: Coord[] = [];
    const constraintCells = new Set<string>();

    // Collect constraint cells for this row
    for (const c of oneByNByRow.get(row) || []) {
      for (const [cr, cc] of c.cells) {
        constraintCells.add(cellKey(cr, cc));
      }
    }
    for (const c of twoByTwoByRow.get(row) || []) {
      for (const [cr, cc] of c.cells) {
        if (cr === row) {
          constraintCells.add(cellKey(cr, cc));
        }
      }
    }

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = cellKey(row, col);
        if (key === starKey && row === starRow) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    if (remainingCells.length < needed) {
      return true;
    }

    if (computeTiling(remainingCells, size).capacity < needed) {
      return true;
    }

    // Check each constraint in this row
    const rowOneByN = oneByNByRow.get(row) || [];
    const rowTwoByTwo = twoByTwoByRow.get(row) || [];

    let constraintContribution = 0;

    for (const c of rowOneByN) {
      const starInConstraint = c.cells.some(
        ([r, col]) => r === starRow && col === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? c.starsNeeded - 1 : c.starsNeeded;
      if (adjustedNeed > 0 && remainingInConstraint < adjustedNeed) {
        return true;
      }
      constraintContribution += adjustedNeed;
    }

    for (const c of rowTwoByTwo) {
      const starInConstraint = c.cells.some(
        ([r, col]) => r === starRow && col === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? 0 : 1;
      if (adjustedNeed > 0 && remainingInConstraint === 0) {
        return true;
      }
      if (c.cells.some(([r]) => r === row)) {
        constraintContribution += adjustedNeed;
      }
    }

    // Check if free cells can accommodate non-constraint stars
    const freeNeeded = needed - constraintContribution;
    if (freeNeeded > 0) {
      const freeCells = remainingCells.filter(
        ([r, c]) => !constraintCells.has(cellKey(r, c)),
      );

      if (freeCells.length < freeNeeded) {
        return true;
      }

      if (computeTiling(freeCells, size).capacity < freeNeeded) {
        return true;
      }
    }
  }

  // Check columns affected by this star
  for (
    let col = Math.max(0, starCol - 1);
    col <= Math.min(size - 1, starCol + 1);
    col++
  ) {
    let existingStars = 0;
    const remainingCells: Coord[] = [];
    const constraintCells = new Set<string>();

    for (const c of oneByNByCol.get(col) || []) {
      for (const [cr, cc] of c.cells) {
        constraintCells.add(cellKey(cr, cc));
      }
    }
    for (const c of twoByTwoByCol.get(col) || []) {
      for (const [cr, cc] of c.cells) {
        if (cc === col) {
          constraintCells.add(cellKey(cr, cc));
        }
      }
    }

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = cellKey(row, col);
        if (key === starKey && col === starCol) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    if (remainingCells.length < needed) {
      return true;
    }

    if (computeTiling(remainingCells, size).capacity < needed) {
      return true;
    }

    const colOneByN = oneByNByCol.get(col) || [];
    const colTwoByTwo = twoByTwoByCol.get(col) || [];

    let constraintContribution = 0;

    for (const c of colOneByN) {
      const starInConstraint = c.cells.some(
        ([r, cc]) => r === starRow && cc === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? c.starsNeeded - 1 : c.starsNeeded;
      if (adjustedNeed > 0 && remainingInConstraint < adjustedNeed) {
        return true;
      }
      constraintContribution += adjustedNeed;
    }

    for (const c of colTwoByTwo) {
      const starInConstraint = c.cells.some(
        ([r, cc]) => r === starRow && cc === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? 0 : 1;
      if (adjustedNeed > 0 && remainingInConstraint === 0) {
        return true;
      }
      if (c.cells.some(([, cc]) => cc === col)) {
        constraintContribution += adjustedNeed;
      }
    }

    const freeNeeded = needed - constraintContribution;
    if (freeNeeded > 0) {
      const freeCells = remainingCells.filter(
        ([r, c]) => !constraintCells.has(cellKey(r, c)),
      );

      if (freeCells.length < freeNeeded) {
        return true;
      }

      if (computeTiling(freeCells, size).capacity < freeNeeded) {
        return true;
      }
    }
  }

  return false;
}

export default function constrainedQuota(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  // Precompute constraints once
  const oneByNConstraints = findOneByNConstraints(board, cells, analysis);
  const twoByTwoConstraints = findStarContaining2x2s(board, cells);

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (
        checkRowOrColumnViolation(
          row,
          col,
          board,
          cells,
          markedCells,
          oneByNConstraints,
          twoByTwoConstraints,
        )
      ) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
