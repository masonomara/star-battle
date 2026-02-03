/**
 * Rule 11: Pressured Exclusion
 *
 * Marks cells where placing a star would make it impossible to satisfy
 * geometric constraints:
 * 1. 1×n constraints (regions confined to single row/col)
 * 2. Star-containing 2×2s (from squeeze analysis)
 *
 * Both types of constraints guarantee stars in specific cells.
 * This rule marks cells where placing a star would break these constraints.
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
import { BoardAnalysis } from "../../helpers/boardAnalysis";

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

export default function pressuredExclusion(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  // Find all constraints
  const oneByNConstraints = findOneByNConstraints(board, cells, analysis);
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

      // Only check direct constraint violations (geometric)
      if (wouldBreakConstraint(row, col, allConstraints, markedCells, size)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
