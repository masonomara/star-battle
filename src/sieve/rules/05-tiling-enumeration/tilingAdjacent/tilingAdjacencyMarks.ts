import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { Board, CellState, Coord, Tile } from "../../../helpers/types";

/**
 * Check if two cells are adjacent (including diagonals).
 */
function cellsAreAdjacent(c1: Coord, c2: Coord): boolean {
  return Math.abs(c1[0] - c2[0]) <= 1 && Math.abs(c1[1] - c2[1]) <= 1;
}

/**
 * Rule 8e: Tiling Adjacency Marks
 *
 * When capacity === starsNeeded, each tile contains exactly one star.
 * Cells that don't appear in any valid star assignment across all tilings
 * cannot be stars.
 */
export default function tilingAdjacencyMarks(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  let changed = false;

  for (const [, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const tiling = analysis.getTiling(meta.unknownCoords);
    if (tiling.capacity !== meta.starsNeeded) continue;

    const unknownSet = new Set(
      meta.unknownCoords.map((c) => `${c[0]},${c[1]}`),
    );
    const validStarCells = collectValidStarCells(
      tiling.tilings,
      unknownSet,
      cells,
    );

    for (const [row, col] of meta.unknownCoords) {
      if (!validStarCells.has(`${row},${col}`) && cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Collect all cells that appear as stars in any valid assignment
 * across all minimal tilings.
 */
function collectValidStarCells(
  allMinimalTilings: Tile[][],
  unknownSet: Set<string>,
  cells: CellState[][],
): Set<string> {
  const validCells = new Set<string>();

  for (const tiling of allMinimalTilings) {
    const assignments = enumerateStarAssignments(tiling, unknownSet, cells);
    for (const assignment of assignments) {
      for (const [r, c] of assignment) {
        validCells.add(`${r},${c}`);
      }
    }
  }

  return validCells;
}

/**
 * Enumerate all valid star assignments for a single tiling.
 * Each tile gets exactly one star. No two stars are adjacent.
 * Builds assignments iteratively, tile by tile.
 */
function enumerateStarAssignments(
  tiling: Tile[],
  unknownSet: Set<string>,
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
      const candidates = tile.coveredCells.filter((c) =>
        unknownSet.has(`${c[0]},${c[1]}`),
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
