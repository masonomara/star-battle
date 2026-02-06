/**
 * Rule: Squeeze Adjacency (Level 5 — Tiling + Enumeration)
 *
 * O: Tiling of consecutive row/col pairs
 * T: Enumerate valid star assignments within tight tilings
 * D: Marks
 *
 * When a consecutive row pair or column pair has a tight tiling,
 * enumerate valid star assignments (one per tile, no adjacency).
 * Pair cells that never appear as a star in any valid assignment → mark.
 */

import { Board, CellState, Coord, Deduction, Tile } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

function cellsAreAdjacent(c1: Coord, c2: Coord): boolean {
  return Math.abs(c1[0] - c2[0]) <= 1 && Math.abs(c1[1] - c2[1]) <= 1;
}

/**
 * Enumerate all valid star assignments for a single tiling.
 * Each tile gets exactly one star from its covered cells. No two stars adjacent.
 */
function enumerateStarAssignments(
  tiling: Tile[],
  pairSet: Set<string>,
  cells: CellState[][],
): Coord[][] {
  const fixed: Coord[] = [];
  const candidatesPerTile: Coord[][] = [];

  for (const tile of tiling) {
    const existingStar = tile.coveredCells.find(
      ([r, c]) => cells[r][c] === "star",
    );
    if (existingStar) {
      fixed.push(existingStar);
    } else {
      const candidates = tile.coveredCells.filter(
        ([r, c]) =>
          pairSet.has(`${r},${c}`) && cells[r][c] === "unknown",
      );
      if (candidates.length === 0) return [];
      candidatesPerTile.push(candidates);
    }
  }

  for (let i = 0; i < fixed.length; i++) {
    for (let j = i + 1; j < fixed.length; j++) {
      if (cellsAreAdjacent(fixed[i], fixed[j])) return [];
    }
  }

  let assignments: Coord[][] = [[...fixed]];

  for (const candidates of candidatesPerTile) {
    const extended: Coord[][] = [];
    for (const partial of assignments) {
      for (const cell of candidates) {
        if (partial.some((p) => cellsAreAdjacent(cell, p))) continue;
        extended.push([...partial, cell]);
      }
    }
    if (extended.length === 0) return [];
    assignments = extended;
  }

  return assignments;
}

function collectValidStarCells(
  allTilings: Tile[][],
  pairSet: Set<string>,
  cells: CellState[][],
): Set<string> {
  const valid = new Set<string>();
  for (const tiling of allTilings) {
    for (const assignment of enumerateStarAssignments(tiling, pairSet, cells)) {
      for (const [r, c] of assignment) {
        valid.add(`${r},${c}`);
      }
    }
  }
  return valid;
}

export default function squeezeAdjacency(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  const starsPerPair = board.stars * 2;
  let changed = false;

  // Row pairs
  for (let row = 0; row < size - 1; row++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "unknown") pairCells.push([row, col]);
      if (cells[row + 1][col] === "unknown") pairCells.push([row + 1, col]);
      if (cells[row][col] === "star") existingStars++;
      if (cells[row + 1][col] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;
    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;
    if (tiling.tilings.length === 0) continue;

    const pairSet = new Set(pairCells.map(([r, c]) => `${r},${c}`));
    const validStarCells = collectValidStarCells(tiling.tilings, pairSet, cells);
    const deductions: Deduction[] = [];

    for (const [r, c] of pairCells) {
      if (!validStarCells.has(`${r},${c}`)) {
        deductions.push({ coord: [r, c], state: "marked" });
      }
    }

    if (applyDeductions(cells, deductions)) {
      changed = true;
    }
  }

  // Column pairs
  for (let col = 0; col < size - 1; col++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "unknown") pairCells.push([row, col]);
      if (cells[row][col + 1] === "unknown") pairCells.push([row, col + 1]);
      if (cells[row][col] === "star") existingStars++;
      if (cells[row][col + 1] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;
    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;
    if (tiling.tilings.length === 0) continue;

    const pairSet = new Set(pairCells.map(([r, c]) => `${r},${c}`));
    const validStarCells = collectValidStarCells(tiling.tilings, pairSet, cells);
    const deductions: Deduction[] = [];

    for (const [r, c] of pairCells) {
      if (!validStarCells.has(`${r},${c}`)) {
        deductions.push({ coord: [r, c], state: "marked" });
      }
    }

    if (applyDeductions(cells, deductions)) {
      changed = true;
    }
  }

  return changed;
}
