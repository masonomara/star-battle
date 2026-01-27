/**
 * Rule 12: The Squeeze
 *
 * Minimally tile 2×2s across pairs of consecutive rows (or columns) where
 * every star can be accounted for.
 *
 * For N★ puzzles, a row/col pair contains 2N stars. If we can tile the pair
 * with exactly 2N non-overlapping 2×2s, each tile contains exactly one star.
 *
 * This yields:
 * 1. Stars: Cells with single-coverage in ALL minimal tilings must be stars
 * 2. Marks: Cells outside the pair covered by ALL tilings can't have stars
 *    (the tile's star must be in the pair portion)
 */

import { coordKey, parseKey } from "../../helpers/cellKey";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, Coord, Tile } from "../../helpers/types";

export default function squeeze(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  const starsPerPair = board.stars * 2;
  let changed = false;

  // Process row pairs
  for (let row = 0; row < size - 1; row++) {
    if (processRowPair(row, size, starsPerPair, cells)) {
      changed = true;
    }
  }

  // Process column pairs
  for (let col = 0; col < size - 1; col++) {
    if (processColPair(col, size, starsPerPair, cells)) {
      changed = true;
    }
  }

  return changed;
}

function processRowPair(
  row: number,
  size: number,
  starsPerPair: number,
  cells: CellState[][],
): boolean {
  // Collect unknown cells in this row pair
  const pairCells: Coord[] = [];
  for (let col = 0; col < size; col++) {
    if (cells[row][col] === "unknown") pairCells.push([row, col]);
    if (cells[row + 1][col] === "unknown") pairCells.push([row + 1, col]);
  }

  if (pairCells.length === 0) return false;

  // Count existing stars in the pair
  let existingStars = 0;
  for (let col = 0; col < size; col++) {
    if (cells[row][col] === "star") existingStars++;
    if (cells[row + 1][col] === "star") existingStars++;
  }

  const neededStars = starsPerPair - existingStars;
  if (neededStars <= 0) return false;

  const tiling = findAllMinimalTilings(pairCells, cells, size);

  // Only proceed if tiles exactly match needed stars
  if (tiling.minTileCount !== neededStars) return false;

  let changed = false;

  // Place stars on forced cells (single-coverage in all tilings)
  for (const [r, c] of tiling.forcedCells) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "star";
      changed = true;
    }
  }

  // Mark cells outside the pair that are covered by ALL tilings
  const forcedOutside = findForcedOutsideCells(tiling.allMinimalTilings);
  for (const [r, c] of forcedOutside) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "marked";
      changed = true;
    }
  }

  // Mark cells that would block all star candidates via adjacency
  const pairCellSet = new Set(pairCells.map(coordKey));
  const adjacencyBlocked = findAdjacencyBlockedCells(
    tiling.allMinimalTilings,
    pairCellSet,
    cells,
    size,
  );
  for (const [r, c] of adjacencyBlocked) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "marked";
      changed = true;
    }
  }

  return changed;
}

function processColPair(
  col: number,
  size: number,
  starsPerPair: number,
  cells: CellState[][],
): boolean {
  // Collect unknown cells in this column pair
  const pairCells: Coord[] = [];
  for (let row = 0; row < size; row++) {
    if (cells[row][col] === "unknown") pairCells.push([row, col]);
    if (cells[row][col + 1] === "unknown") pairCells.push([row, col + 1]);
  }

  if (pairCells.length === 0) return false;

  // Count existing stars in the pair
  let existingStars = 0;
  for (let row = 0; row < size; row++) {
    if (cells[row][col] === "star") existingStars++;
    if (cells[row][col + 1] === "star") existingStars++;
  }

  const neededStars = starsPerPair - existingStars;
  if (neededStars <= 0) return false;

  const tiling = findAllMinimalTilings(pairCells, cells, size);

  if (tiling.minTileCount !== neededStars) return false;

  let changed = false;

  for (const [r, c] of tiling.forcedCells) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "star";
      changed = true;
    }
  }

  const forcedOutside = findForcedOutsideCells(tiling.allMinimalTilings);
  for (const [r, c] of forcedOutside) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "marked";
      changed = true;
    }
  }

  // Mark cells that would block all star candidates via adjacency
  const pairCellSet = new Set(pairCells.map(coordKey));
  const adjacencyBlocked = findAdjacencyBlockedCells(
    tiling.allMinimalTilings,
    pairCellSet,
    cells,
    size,
  );
  for (const [r, c] of adjacencyBlocked) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = "marked";
      changed = true;
    }
  }

  return changed;
}

/**
 * Find cells outside the target area that are covered by ALL minimal tilings.
 * These cells can't have stars because each tile's star must be in the target area.
 */
function findForcedOutsideCells(allMinimalTilings: Tile[][]): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  // For each tiling, collect cells outside the target (cells - coveredCells)
  const outsideSets: Set<string>[] = allMinimalTilings.map((tiling) => {
    const outside = new Set<string>();
    for (const tile of tiling) {
      const coveredKeys = new Set(tile.coveredCells.map(coordKey));
      for (const cell of tile.cells) {
        const key = coordKey(cell);
        if (!coveredKeys.has(key)) {
          outside.add(key);
        }
      }
    }
    return outside;
  });

  // Intersection: cells that appear in ALL tilings
  const intersection = [...outsideSets[0]].filter((key) =>
    outsideSets.every((set) => set.has(key)),
  );

  return intersection.map((key) => {
    const [r, c] = key.split(",").map(Number);
    return [r, c] as Coord;
  });
}

/**
 * Check if two cells are adjacent (including diagonals).
 */
function isAdjacent(cell1: Coord, cell2: Coord): boolean {
  const [r1, c1] = cell1;
  const [r2, c2] = cell2;
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return dr <= 1 && dc <= 1 && (dr > 0 || dc > 0);
}

/**
 * Find cells that would block all star candidates for some tile via adjacency.
 *
 * If a cell C is adjacent to ALL coveredCells of some tile in EVERY minimal tiling,
 * then starring C would mark all possible star locations for that tile - contradiction.
 * Therefore C can be marked.
 */
function findAdjacencyBlockedCells(
  allMinimalTilings: Tile[][],
  pairCellSet: Set<string>,
  cells: CellState[][],
  size: number,
): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  // Collect unknown cells adjacent to the pair but not in the pair
  const adjacentCells = new Set<string>();
  for (const key of pairCellSet) {
    const [r, c] = parseKey(key);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const nkey = coordKey([nr, nc]);
          if (!pairCellSet.has(nkey) && cells[nr][nc] === "unknown") {
            adjacentCells.add(nkey);
          }
        }
      }
    }
  }

  const blockedCells: Coord[] = [];

  for (const candidateKey of adjacentCells) {
    const candidate = parseKey(candidateKey);

    // Check if in EVERY tiling, this candidate blocks at least one tile completely
    const blocksInAllTilings = allMinimalTilings.every((tiling) =>
      tiling.some((tile) =>
        // Candidate must be adjacent to ALL coveredCells of this tile
        tile.coveredCells.every((covered) => isAdjacent(candidate, covered)),
      ),
    );

    if (blocksInAllTilings) {
      blockedCells.push(candidate);
    }
  }

  return blockedCells;
}
