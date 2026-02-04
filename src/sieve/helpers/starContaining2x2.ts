/**
 * Helper for finding star-containing 2×2s via squeeze analysis.
 *
 * When a pair of rows/columns can be minimally tiled with exactly
 * the number of 2×2s matching the needed star count, each 2×2
 * must contain exactly one star.
 *
 * These act as constraints similar to 1×n: they guarantee a star
 * in a specific set of cells.
 */

import { computeTiling } from "./tiling";
import { Board, CellState, Coord, Tile } from "./types";

export type StarContaining2x2 = {
  cells: Coord[]; // The cells covered by this 2×2 (within the row/col pair)
  allCells: Coord[]; // All 4 cells of the 2×2 (including outside pair)
  starsNeeded: 1; // Always 1 for a 2×2
  source: "row-pair" | "col-pair";
  pairIndex: number; // Which row or column pair (the first index)
};

/**
 * Find all star-containing 2×2s from row pair squeezes.
 */
function findFromRowPairs(
  board: Board,
  cells: CellState[][],
): StarContaining2x2[] {
  const size = board.grid.length;
  const starsPerPair = board.stars * 2;
  const results: StarContaining2x2[] = [];

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

    const tiling = computeTiling(pairCells, size);

    // Only proceed if tiles exactly match needed stars
    if (tiling.capacity !== neededStars) continue;

    // Each tile in the minimal tiling is a star-containing 2×2
    // We need tiles that appear in ALL minimal tilings
    if (tiling.tilings.length === 0) continue;

    // Find tiles that are common to all tilings
    // For simplicity, if there's only one tiling, all its tiles are star-containing
    if (tiling.tilings.length === 1) {
      for (const tile of tiling.tilings[0]) {
        results.push({
          cells: tile.coveredCells,
          allCells: tile.cells,
          starsNeeded: 1,
          source: "row-pair",
          pairIndex: row,
        });
      }
    } else {
      // Multiple tilings - find tiles that appear in all of them
      // A tile "appears" if its covered cells match
      const firstTiling = tiling.tilings[0];
      for (const tile of firstTiling) {
        const coveredKey = tile.coveredCells
          .map(([r, c]) => `${r},${c}`)
          .sort()
          .join("|");

        const inAllTilings = tiling.tilings.every((t) =>
          t.some((otherTile) => {
            const otherKey = otherTile.coveredCells
              .map(([r, c]) => `${r},${c}`)
              .sort()
              .join("|");
            return coveredKey === otherKey;
          }),
        );

        if (inAllTilings) {
          results.push({
            cells: tile.coveredCells,
            allCells: tile.cells,
            starsNeeded: 1,
            source: "row-pair",
            pairIndex: row,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Find all star-containing 2×2s from column pair squeezes.
 */
function findFromColPairs(
  board: Board,
  cells: CellState[][],
): StarContaining2x2[] {
  const size = board.grid.length;
  const starsPerPair = board.stars * 2;
  const results: StarContaining2x2[] = [];

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

    const tiling = computeTiling(pairCells, size);

    if (tiling.capacity !== neededStars) continue;
    if (tiling.tilings.length === 0) continue;

    if (tiling.tilings.length === 1) {
      for (const tile of tiling.tilings[0]) {
        results.push({
          cells: tile.coveredCells,
          allCells: tile.cells,
          starsNeeded: 1,
          source: "col-pair",
          pairIndex: col,
        });
      }
    } else {
      const firstTiling = tiling.tilings[0];
      for (const tile of firstTiling) {
        const coveredKey = tile.coveredCells
          .map(([r, c]) => `${r},${c}`)
          .sort()
          .join("|");

        const inAllTilings = tiling.tilings.every((t) =>
          t.some((otherTile) => {
            const otherKey = otherTile.coveredCells
              .map(([r, c]) => `${r},${c}`)
              .sort()
              .join("|");
            return coveredKey === otherKey;
          }),
        );

        if (inAllTilings) {
          results.push({
            cells: tile.coveredCells,
            allCells: tile.cells,
            starsNeeded: 1,
            source: "col-pair",
            pairIndex: col,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Find all star-containing 2×2s in the current board state.
 *
 * These are 2×2 tiles from squeeze analysis that must contain
 * exactly one star.
 */
export function findStarContaining2x2s(
  board: Board,
  cells: CellState[][],
): StarContaining2x2[] {
  const fromRows = findFromRowPairs(board, cells);
  const fromCols = findFromColPairs(board, cells);

  // Deduplicate - same 2×2 might be found from both row and column analysis
  const seen = new Set<string>();
  const results: StarContaining2x2[] = [];

  for (const constraint of [...fromRows, ...fromCols]) {
    const key = constraint.cells
      .map(([r, c]) => `${r},${c}`)
      .sort()
      .join("|");

    if (!seen.has(key)) {
      seen.add(key);
      results.push(constraint);
    }
  }

  return results;
}
