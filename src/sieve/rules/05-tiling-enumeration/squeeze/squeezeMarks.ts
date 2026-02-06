/**
 * Rule: Squeeze Marks (Level 5 — Tiling + Enumeration)
 *
 * O: Tiling of consecutive row/col pairs
 * T: Enumerate valid star assignments within tight tilings
 * D: Marks
 *
 * When a consecutive row pair or column pair has a tight tiling:
 * 1. Adjacency marks: enumerate valid star assignments (one per tile, no
 *    adjacency); pair cells that never appear as a star → mark
 * 2. Overhang marks: cells OUTSIDE the pair covered by tiles in ALL
 *    active tilings → mark
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

/**
 * Collect all cells that appear as valid star positions across all tilings.
 */
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

/**
 * Filter out tilings whose overhang cells are all already marked.
 */
function filterActiveTilings(
  allTilings: Tile[][],
  pairSet: Set<string>,
  cells: CellState[][],
): Tile[][] {
  return allTilings.filter((tiling) => {
    for (const tile of tiling) {
      for (const [r, c] of tile.cells) {
        if (!pairSet.has(`${r},${c}`) && cells[r][c] === "unknown") {
          return true;
        }
      }
    }
    return false;
  });
}

/**
 * Find non-pair cells that appear in ALL active tilings.
 */
function findForcedOverhangCells(
  activeTilings: Tile[][],
  pairSet: Set<string>,
): Coord[] {
  if (activeTilings.length === 0) return [];

  const outsideSets: Set<string>[] = activeTilings.map((tiling) => {
    const outside = new Set<string>();
    for (const tile of tiling) {
      for (const [r, c] of tile.cells) {
        const key = `${r},${c}`;
        if (!pairSet.has(key)) {
          outside.add(key);
        }
      }
    }
    return outside;
  });

  const intersection = new Set(outsideSets[0]);
  for (let i = 1; i < outsideSets.length; i++) {
    for (const key of intersection) {
      if (!outsideSets[i].has(key)) {
        intersection.delete(key);
      }
    }
  }

  return [...intersection].map((key) => {
    const [r, c] = key.split(",").map(Number);
    return [r, c] as Coord;
  });
}

function markFromPair(
  pairCells: Coord[],
  neededStars: number,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  if (pairCells.length === 0 || neededStars <= 0) return false;

  const tiling = analysis.getTiling(pairCells);
  if (tiling.capacity !== neededStars) return false;
  if (tiling.tilings.length === 0) return false;

  const deductions: Deduction[] = [];
  const pairSet = new Set(pairCells.map(([r, c]) => `${r},${c}`));

  // Mark 1: Adjacency — pair cells that can never be a star in any valid assignment
  const validStarCells = collectValidStarCells(tiling.tilings, pairSet, cells);
  for (const [r, c] of pairCells) {
    if (!validStarCells.has(`${r},${c}`)) {
      deductions.push({ coord: [r, c], state: "marked" });
    }
  }

  // Mark 2: Overhang — non-pair cells in ALL active tilings
  const activeTilings = filterActiveTilings(tiling.tilings, pairSet, cells);
  const overhangCells = findForcedOverhangCells(activeTilings, pairSet);
  for (const [r, c] of overhangCells) {
    deductions.push({ coord: [r, c], state: "marked" });
  }

  return applyDeductions(cells, deductions);
}

export default function squeezeMarks(
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

    const neededStars = starsPerPair - existingStars;
    if (markFromPair(pairCells, neededStars, cells, analysis)) {
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

    const neededStars = starsPerPair - existingStars;
    if (markFromPair(pairCells, neededStars, cells, analysis)) {
      changed = true;
    }
  }

  return changed;
}
