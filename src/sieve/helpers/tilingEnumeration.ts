/**
 * Shared helpers for tiling-based star assignment enumeration.
 * Used by squeeze rules (window=2) and multi-line rules (window>=3).
 */

import { CellState, Coord, Tile } from "./types";

function cellsAreAdjacent(c1: Coord, c2: Coord): boolean {
  return Math.abs(c1[0] - c2[0]) <= 1 && Math.abs(c1[1] - c2[1]) <= 1;
}

/**
 * Enumerate all valid star assignments for a single tiling.
 * Each tile gets exactly one star from its covered cells. No two stars adjacent.
 */
export function enumerateStarAssignments(
  tiling: Tile[],
  regionSet: Set<string>,
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
          regionSet.has(`${r},${c}`) && cells[r][c] === "unknown",
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
 * Collect all cells that appear as stars in any valid assignment
 * across all minimal tilings.
 */
export function collectValidStarCells(
  allTilings: Tile[][],
  regionSet: Set<string>,
  cells: CellState[][],
): Set<string> {
  const valid = new Set<string>();
  for (const tiling of allTilings) {
    for (const assignment of enumerateStarAssignments(tiling, regionSet, cells)) {
      for (const [r, c] of assignment) {
        valid.add(`${r},${c}`);
      }
    }
  }
  return valid;
}

/**
 * Filter out tilings whose overhang cells are all already marked.
 * Only "active" tilings (with unknown overhang) impose constraints.
 */
export function filterActiveTilings(
  allTilings: Tile[][],
  regionSet: Set<string>,
  cells: CellState[][],
): Tile[][] {
  return allTilings.filter((tiling) => {
    for (const tile of tiling) {
      for (const [r, c] of tile.cells) {
        if (!regionSet.has(`${r},${c}`) && cells[r][c] === "unknown") {
          return true;
        }
      }
    }
    return false;
  });
}

/**
 * Find non-region cells that appear in ALL active tilings.
 * These cells are guaranteed to be covered by the region's tiling,
 * so they cannot be stars.
 */
export function findForcedOverhangCells(
  activeTilings: Tile[][],
  regionSet: Set<string>,
): Coord[] {
  if (activeTilings.length === 0) return [];

  const outsideSets: Set<string>[] = activeTilings.map((tiling) => {
    const outside = new Set<string>();
    for (const tile of tiling) {
      for (const [r, c] of tile.cells) {
        const key = `${r},${c}`;
        if (!regionSet.has(key)) {
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
