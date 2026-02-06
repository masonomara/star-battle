/**
 * Rule: Squeeze Overhang (Level 5 — Tiling + Enumeration)
 *
 * O: Tiling of consecutive row/col pairs
 * T: Find non-pair cells consumed by all active tilings
 * D: Marks
 *
 * When a consecutive row pair or column pair has a tight tiling,
 * cells OUTSIDE the pair that are covered by tiles in ALL active
 * tilings → mark. The pair's tiling always spills onto them.
 */

import { Board, CellState, Coord, Deduction, Tile } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { applyDeductions } from "../../../helpers/applyDeductions";

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

export default function squeezeOverhang(
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
    const activeTilings = filterActiveTilings(tiling.tilings, pairSet, cells);
    const overhangCells = findForcedOverhangCells(activeTilings, pairSet);
    const deductions: Deduction[] = [];

    for (const [r, c] of overhangCells) {
      deductions.push({ coord: [r, c], state: "marked" });
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
    const activeTilings = filterActiveTilings(tiling.tilings, pairSet, cells);
    const overhangCells = findForcedOverhangCells(activeTilings, pairSet);
    const deductions: Deduction[] = [];

    for (const [r, c] of overhangCells) {
      deductions.push({ coord: [r, c], state: "marked" });
    }

    if (applyDeductions(cells, deductions)) {
      changed = true;
    }
  }

  return changed;
}
