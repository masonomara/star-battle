/**
 * Rule 12g: Hypothetical Free Overflow
 *
 * Marks cells where placing a star would leave insufficient "free" cells
 * in a row/column to absorb the remaining quota after constraints claim their share.
 *
 * "Free" cells are cells not part of any 1×N or 2×2 constraint.
 * After constraints take their guaranteed stars, the remaining quota
 * must fit in the free cells.
 *
 * For each unknown cell, asks: "If I place a star here,
 * can the free cells in affected rows/cols handle what's left?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeTiling } from "../../helpers/tiling";
import {
  computeConfinement,
  ConfinementResult,
} from "../../helpers/confinement";
import { buildMarkedCellSet } from "../../helpers/oneByN";
import {
  findStarContaining2x2s,
  StarContaining2x2,
} from "../../helpers/starContaining2x2";

function checkFreeOverflow(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  markedCells: Set<string>,
  confinement: ConfinementResult,
  twoByTwoConstraints: StarContaining2x2[],
): boolean {
  const size = board.grid.length;
  const starKey = `${starRow},${starCol}`;

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
    for (const c of confinement.row.get(row) || []) {
      for (const [cr, cc] of c.cells) {
        constraintCells.add(`${cr},${cc}`);
      }
    }
    for (const c of twoByTwoByRow.get(row) || []) {
      for (const [cr, cc] of c.cells) {
        if (cr === row) {
          constraintCells.add(`${cr},${cc}`);
        }
      }
    }

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = `${row},${col}`;
        if (key === starKey && row === starRow) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    // Calculate constraint contribution
    let constraintContribution = 0;

    for (const c of confinement.row.get(row) || []) {
      const starInConstraint = c.cells.some(
        ([r, col]) => r === starRow && col === starCol,
      );
      const adjustedNeed = starInConstraint ? c.starsNeeded - 1 : c.starsNeeded;
      constraintContribution += adjustedNeed;
    }

    for (const c of twoByTwoByRow.get(row) || []) {
      const starInConstraint = c.cells.some(
        ([r, col]) => r === starRow && col === starCol,
      );
      const adjustedNeed = starInConstraint ? 0 : 1;
      if (c.cells.some(([r]) => r === row)) {
        constraintContribution += adjustedNeed;
      }
    }

    // Check if free cells can handle the remainder
    const freeNeeded = needed - constraintContribution;
    if (freeNeeded > 0) {
      const freeCells = remainingCells.filter(
        ([r, c]) => !constraintCells.has(`${r},${c}`),
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

    for (const c of confinement.col.get(col) || []) {
      for (const [cr, cc] of c.cells) {
        constraintCells.add(`${cr},${cc}`);
      }
    }
    for (const c of twoByTwoByCol.get(col) || []) {
      for (const [cr, cc] of c.cells) {
        if (cc === col) {
          constraintCells.add(`${cr},${cc}`);
        }
      }
    }

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = `${row},${col}`;
        if (key === starKey && col === starCol) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    let constraintContribution = 0;

    for (const c of confinement.col.get(col) || []) {
      const starInConstraint = c.cells.some(
        ([r, cc]) => r === starRow && cc === starCol,
      );
      const adjustedNeed = starInConstraint ? c.starsNeeded - 1 : c.starsNeeded;
      constraintContribution += adjustedNeed;
    }

    for (const c of twoByTwoByCol.get(col) || []) {
      const starInConstraint = c.cells.some(
        ([r, cc]) => r === starRow && cc === starCol,
      );
      const adjustedNeed = starInConstraint ? 0 : 1;
      if (c.cells.some(([, cc]) => cc === col)) {
        constraintContribution += adjustedNeed;
      }
    }

    const freeNeeded = needed - constraintContribution;
    if (freeNeeded > 0) {
      const freeCells = remainingCells.filter(
        ([r, c]) => !constraintCells.has(`${r},${c}`),
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

export default function hypotheticalFreeOverflow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  // Precompute constraints once
  const confinement = computeConfinement(analysis);
  const twoByTwoConstraints = findStarContaining2x2s(board, cells);

  // No constraints means no free overflow possible
  if (
    confinement.row.size === 0 &&
    confinement.col.size === 0 &&
    twoByTwoConstraints.length === 0
  ) {
    return false;
  }

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (
        checkFreeOverflow(
          row,
          col,
          board,
          cells,
          markedCells,
          confinement,
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
