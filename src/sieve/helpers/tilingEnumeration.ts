import { CellState, Coord, Tile } from "./types";
import { cellsAreAdjacent } from "./neighbors";

function enumerateStarAssignments(
  tiling: Tile[],
  insideSet: Set<number>,
  cells: CellState[][],
  size: number,
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
        ([r, c]) => insideSet.has(r * size + c) && cells[r][c] === "unknown",
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

export function collectValidStarCells(
  allTilings: Tile[][],
  insideSet: Set<number>,
  cells: CellState[][],
  size: number,
): Set<number> {
  const valid = new Set<number>();
  for (const tiling of allTilings) {
    for (const assignment of enumerateStarAssignments(tiling, insideSet, cells, size)) {
      for (const [r, c] of assignment) {
        valid.add(r * size + c);
      }
    }
  }
  return valid;
}

export function filterActiveTilings(
  allTilings: Tile[][],
  insideSet: Set<number>,
  cells: CellState[][],
  size: number,
): Tile[][] {
  return allTilings.filter((tiling) => {
    for (const tile of tiling) {
      for (const [r, c] of tile.cells) {
        if (!insideSet.has(r * size + c) && cells[r][c] === "unknown") {
          return true;
        }
      }
    }
    return false;
  });
}

export function findForcedOverhangCells(
  activeTilings: Tile[][],
  insideSet: Set<number>,
  size: number,
): Coord[] {
  if (activeTilings.length === 0) return [];

  const outsideSets: Set<number>[] = activeTilings.map((tiling) => {
    const outside = new Set<number>();
    for (const tile of tiling) {
      for (const [r, c] of tile.cells) {
        const key = r * size + c;
        if (!insideSet.has(key)) {
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
    const r = Math.floor(key / size);
    const c = key % size;
    return [r, c] as Coord;
  });
}
