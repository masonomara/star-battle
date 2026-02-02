/**
 * Rule 11: Pressured Exclusion
 *
 * Like exclusion, but accounting for:
 * 1. 1×n constraints (regions confined to single row/col)
 * 2. Star-containing 2×2s (from squeeze analysis)
 *
 * Both types of constraints guarantee stars in specific cells.
 * This rule marks cells where placing a star would make it impossible
 * to satisfy these constraints.
 */

import { cellKey } from "../../helpers/cellKey";
import {
  findOneByNConstraints,
  buildMarkedCellSet,
  OneByNConstraint,
} from "../../helpers/oneByN";
import {
  findStarContaining2x2s,
  StarContaining2x2,
} from "../../helpers/starContaining2x2";
import { canTileWithMinCount } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * A unified constraint type that represents either a 1×n or a star-containing 2×2.
 */
type StarConstraint = {
  cells: Coord[];
  starsNeeded: number;
  type: "1xn" | "2x2";
};

/**
 * Convert 1×n constraints to unified format.
 */
function convertOneByN(constraints: OneByNConstraint[]): StarConstraint[] {
  return constraints.map((c) => ({
    cells: c.cells,
    starsNeeded: c.starsNeeded,
    type: "1xn" as const,
  }));
}

/**
 * Convert star-containing 2×2s to unified format.
 */
function convert2x2s(constraints: StarContaining2x2[]): StarConstraint[] {
  return constraints.map((c) => ({
    cells: c.cells,
    starsNeeded: c.starsNeeded,
    type: "2x2" as const,
  }));
}

/**
 * Check if placing a star at (row, col) would break any constraint.
 */
function wouldBreakConstraint(
  row: number,
  col: number,
  constraints: StarConstraint[],
  markedCells: Set<string>,
  size: number,
): boolean {
  const starKey = cellKey(row, col);

  for (const constraint of constraints) {
    const starInConstraint = constraint.cells.some(
      ([r, c]) => r === row && c === col,
    );

    // Count remaining cells after hypothetical marks
    const remaining: Coord[] = [];
    for (const [cr, cc] of constraint.cells) {
      const key = cellKey(cr, cc);
      if (key !== starKey && !markedCells.has(key)) {
        remaining.push([cr, cc]);
      }
    }

    const adjustedNeed = starInConstraint
      ? constraint.starsNeeded - 1
      : constraint.starsNeeded;

    if (adjustedNeed <= 0) continue;

    // Not enough cells remain
    if (remaining.length < adjustedNeed) {
      return true;
    }

    // Can't tile the required stars
    if (!canTileWithMinCount(remaining, size, adjustedNeed)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if placing a star would break row/column quotas given constraints.
 *
 * For each affected row/column:
 * 1. Check if it can still fit its required stars
 * 2. Check if constraints (1×n, 2×2) within that row/col can still be satisfied
 * 3. Check if "free" stars (non-constraint) can fit in remaining non-constraint cells
 */
function wouldBreakRowOrColumn(
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

  // Group 1×n constraints by row/column
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
          // Only cells actually in this row
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
          existingStars++; // The hypothetical star
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    // Basic check
    if (remainingCells.length < needed) {
      return true;
    }

    if (!canTileWithMinCount(remainingCells, size, needed)) {
      return true;
    }

    // Check each constraint in this row
    const rowOneByN = oneByNByRow.get(row) || [];
    const rowTwoByTwo = twoByTwoByRow.get(row) || [];

    // Calculate total guaranteed stars from constraints in this row
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
        return true; // Constraint broken
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
      const adjustedNeed = starInConstraint ? 0 : 1; // 2×2 needs exactly 1 star
      if (adjustedNeed > 0 && remainingInConstraint === 0) {
        return true; // Constraint broken
      }
      // Only count contribution if constraint cell is in this row
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

      if (!canTileWithMinCount(freeCells, size, freeNeeded)) {
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

    if (!canTileWithMinCount(remainingCells, size, needed)) {
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

      if (!canTileWithMinCount(freeCells, size, freeNeeded)) {
        return true;
      }
    }
  }

  return false;
}

export default function pressuredExclusion(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  // Find all constraints
  const oneByNConstraints = findOneByNConstraints(board, cells);
  const twoByTwoConstraints = findStarContaining2x2s(board, cells);

  // No constraints means no pressure-based exclusions possible
  if (oneByNConstraints.length === 0 && twoByTwoConstraints.length === 0) {
    return false;
  }

  // Convert to unified format for direct constraint checking
  const allConstraints: StarConstraint[] = [
    ...convertOneByN(oneByNConstraints),
    ...convert2x2s(twoByTwoConstraints),
  ];

  let changed = false;

  // Check all unknown cells
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      // Check direct constraint violations
      if (wouldBreakConstraint(row, col, allConstraints, markedCells, size)) {
        cells[row][col] = "marked";
        changed = true;
        continue;
      }

      // Check row/column quota violations with constraint awareness
      if (
        wouldBreakRowOrColumn(
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
