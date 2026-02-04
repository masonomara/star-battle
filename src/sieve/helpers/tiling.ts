/**
 * 2×2 Tiling Algorithm for Star Battle
 *
 * Tiles a region with non-overlapping 2×2 squares (allowing boundary overhang).
 * Uses DLX (Dancing Links) to find all minimal tilings efficiently.
 *
 * Used by: twoByTwoTiling, exclusion
 */

import { CellState, Coord, Tile, TilingResult } from "./types";
import { dlxSolve } from "./dlx";
import { coordKey, parseKey } from "./cellKey";

/**
 * For cells arranged in a line (single row or column), calculate the
 * maximum number of non-adjacent stars that can be placed.
 *
 * This is equivalent to the maximum independent set on a path graph,
 * which has a simple greedy solution: place stars greedily from one end,
 * skipping adjacent cells.
 */
function maxStarsInLine(positions: number[]): number {
  if (positions.length === 0) return 0;

  const sorted = [...positions].sort((a, b) => a - b);
  let count = 0;
  let lastPlaced = -2; // Position of last placed star (-2 so first is always valid)

  for (const pos of sorted) {
    // Can place here if not adjacent to last placed star
    if (pos > lastPlaced + 1) {
      count++;
      lastPlaced = pos;
    }
  }

  return count;
}

/**
 * Check if two cells are adjacent (including diagonals).
 */
function cellsAreAdjacent(c1: Coord, c2: Coord): boolean {
  return Math.abs(c1[0] - c2[0]) <= 1 && Math.abs(c1[1] - c2[1]) <= 1;
}

/**
 * Calculate maximum stars using 2x2 tiling logic.
 *
 * Uses DLX to find minimum 2x2 tiles needed to cover cells.
 * Each 2x2 tile holds at most 1 star, so minTileCount = capacity.
 */
function capacityVia2x2Tiling(cells: Coord[]): number {
  if (cells.length === 0) return 0;

  const cellSet = new Set(cells.map(coordKey));

  // Find bounding box
  const rows = cells.map((c) => c[0]);
  const cols = cells.map((c) => c[1]);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  // Generate all 2x2 tiles that cover at least one cell
  const tiles: { anchor: Coord; covered: Coord[] }[] = [];

  for (let r = minRow - 1; r <= maxRow; r++) {
    for (let c = minCol - 1; c <= maxCol; c++) {
      const tileCells: Coord[] = [
        [r, c],
        [r, c + 1],
        [r + 1, c],
        [r + 1, c + 1],
      ];
      const covered = tileCells.filter((tc) => cellSet.has(coordKey(tc)));
      if (covered.length > 0) {
        tiles.push({ anchor: [r, c], covered });
      }
    }
  }

  if (tiles.length === 0) return 0;

  // Build DLX problem: cover all cells with tiles (each cell covered exactly once)
  const cellToIndex = new Map<string, number>();
  cells.forEach((cell, i) => cellToIndex.set(coordKey(cell), i));

  const dlxRows: number[][] = [];
  for (const tile of tiles) {
    const row = tile.covered
      .map((c) => cellToIndex.get(coordKey(c)))
      .filter((i) => i !== undefined) as number[];
    if (row.length > 0) {
      dlxRows.push(row);
    }
  }

  // Solve exact cover
  const solutions = dlxSolve(cells.length, 0, dlxRows);

  if (solutions.length === 0) {
    // No exact cover exists - fall back to greedy estimate
    // Each tile covers some cells, capacity is at most number of tiles needed
    return Math.ceil(cells.length / 4) || 1;
  }

  // Minimum tiles needed = maximum stars possible
  let minTiles = Infinity;
  for (const solution of solutions) {
    minTiles = Math.min(minTiles, solution.length);
  }

  return minTiles;
}

/**
 * Calculate maximum stars that can fit in a set of cells.
 * Uses 2x2 tiling logic: each 2x2 block holds at most 1 star.
 *
 * - Single cell: 1
 * - Cells in 2x2 bounding box: 1 (all touch)
 * - Linear arrangement: greedy placement
 * - 2D arrangement: minimum 2x2 tiles needed
 */
export function maxIndependentSetSize(cells: Coord[]): number {
  const n = cells.length;
  if (n === 0) return 0;
  if (n === 1) return 1;

  // Check bounding box
  const rows = cells.map((c) => c[0]);
  const cols = cells.map((c) => c[1]);
  const height = Math.max(...rows) - Math.min(...rows) + 1;
  const width = Math.max(...cols) - Math.min(...cols) + 1;

  // Fits in 2x2: all cells touch, capacity = 1
  if (height <= 2 && width <= 2) return 1;

  // Single row: use line calculation
  if (height === 1) {
    return maxStarsInLine(cols);
  }

  // Single column: use line calculation
  if (width === 1) {
    return maxStarsInLine(rows);
  }

  // 2D arrangement: use 2x2 tiling
  return capacityVia2x2Tiling(cells);
}

/**
 * Check if n non-adjacent stars can be placed in the given cells.
 *
 * For cells in a single row or column, uses closed-form calculation.
 * For general 2D arrangements, uses 2x2 tiling capacity.
 */
function canPlaceNonAdjacentStars(
  cells: Coord[],
  n: number,
  _gridSize: number,
): boolean {
  if (cells.length < n) return false;
  if (n === 0) return true;

  return maxIndependentSetSize(cells) >= n;
}

/**
 * Fast check if a region can fit at least minTiles non-adjacent stars.
 *
 * For linear arrangements (single row or column), uses exact calculation.
 * For 2D arrangements, uses 2×2 tiling capacity.
 */
export function canTileWithMinCount(
  regionCells: Coord[],
  gridSize: number,
  minTiles: number,
): boolean {
  if (regionCells.length === 0) return minTiles <= 0;
  if (regionCells.length < minTiles) return false;

  return canPlaceNonAdjacentStars(regionCells, minTiles, gridSize);
}

/**
 * Find all minimal tilings for a region using DLX.
 *
 * Uses exact cover with:
 * - Primary columns: region cells (must be covered exactly once)
 * - Secondary columns: non-region cells touched by tiles (at most once, prevents overlap)
 *
 * Returns the minimum number of tiles needed and all tilings achieving that minimum.
 */
export function findAllMinimalTilings(
  regionCells: Coord[],
  cells: CellState[][],
  gridSize: number,
): TilingResult {
  // Build unknown cells set and index map in one pass
  const unknownCells: Coord[] = [];
  const unknownSet = new Set<string>();
  const primaryCellToIndex = new Map<string, number>();

  for (const [r, c] of regionCells) {
    if (cells[r][c] === "unknown") {
      const key = coordKey([r, c]);
      unknownSet.add(key);
      primaryCellToIndex.set(key, unknownCells.length);
      unknownCells.push([r, c]);
    }
  }

  if (unknownCells.length === 0) {
    return { minTileCount: 0, allMinimalTilings: [[]], forcedCells: [] };
  }

  // Generate tile candidates
  // A 2×2 anchored at (r,c) covers (r,c), (r,c+1), (r+1,c), (r+1,c+1)
  const candidateAnchors = new Set<string>();
  const maxAnchor = gridSize - 2;

  for (const [r, c] of unknownCells) {
    for (const dr of [-1, 0]) {
      for (const dc of [-1, 0]) {
        const ar = r + dr;
        const ac = c + dc;
        if (ar >= 0 && ac >= 0 && ar <= maxAnchor && ac <= maxAnchor) {
          candidateAnchors.add(coordKey([ar, ac]));
        }
      }
    }
  }

  const candidates: Tile[] = [];
  for (const anchorKey of candidateAnchors) {
    const [ar, ac] = parseKey(anchorKey);
    const allCells: Coord[] = [
      [ar, ac],
      [ar, ac + 1],
      [ar + 1, ac],
      [ar + 1, ac + 1],
    ];
    const coveredCells: Coord[] = [];
    for (const cell of allCells) {
      if (unknownSet.has(coordKey(cell))) {
        coveredCells.push(cell);
      }
    }
    if (coveredCells.length > 0) {
      candidates.push({ anchor: [ar, ac], cells: allCells, coveredCells });
    }
  }

  if (candidates.length === 0) {
    return { minTileCount: Infinity, allMinimalTilings: [], forcedCells: [] };
  }

  // Collect non-region cells touched by any tile (secondary columns prevent overlap)
  const secondaryCellToIndex = new Map<string, number>();
  for (const tile of candidates) {
    for (const cell of tile.cells) {
      const key = coordKey(cell);
      if (!primaryCellToIndex.has(key) && !secondaryCellToIndex.has(key)) {
        secondaryCellToIndex.set(key, secondaryCellToIndex.size);
      }
    }
  }

  const numPrimary = unknownCells.length;
  const numSecondary = secondaryCellToIndex.size;

  // Build DLX rows: each tile covers some primary and some secondary columns
  const dlxRows: number[][] = [];
  for (const tile of candidates) {
    const row: number[] = [];

    // Add primary columns (region cells this tile covers)
    for (const cell of tile.coveredCells) {
      const idx = primaryCellToIndex.get(coordKey(cell));
      if (idx !== undefined) {
        row.push(idx);
      }
    }

    // Add secondary columns (non-region cells this tile covers)
    for (const cell of tile.cells) {
      const key = coordKey(cell);
      if (!primaryCellToIndex.has(key)) {
        const idx = secondaryCellToIndex.get(key);
        if (idx !== undefined) {
          row.push(numPrimary + idx);
        }
      }
    }

    dlxRows.push(row);
  }

  // Solve with DLX
  const solutions = dlxSolve(numPrimary, numSecondary, dlxRows);

  // No solutions found
  if (solutions.length === 0) {
    return { minTileCount: Infinity, allMinimalTilings: [], forcedCells: [] };
  }

  // Find minimum tile count and filter for minimal solutions
  let minTileCount = Infinity;
  for (const solution of solutions) {
    if (solution.length < minTileCount) {
      minTileCount = solution.length;
    }
  }

  const minimalSolutions = solutions.filter((s) => s.length === minTileCount);

  // Convert row indices back to Tile arrays
  const allMinimalTilings: Tile[][] = minimalSolutions.map((solution) =>
    solution.map((rowIdx) => candidates[rowIdx]),
  );

  // Find forced cells: cells that are single-coverage in ALL tilings
  const forcedCells: Coord[] = [];
  for (const cell of unknownCells) {
    const key = coordKey(cell);
    const isForcedInAll = allMinimalTilings.every((tiling) => {
      const tile = tiling.find((t) =>
        t.coveredCells.some((c) => coordKey(c) === key),
      );
      return tile !== undefined && tile.coveredCells.length === 1;
    });
    if (isForcedInAll) {
      forcedCells.push(cell);
    }
  }

  return { minTileCount, allMinimalTilings, forcedCells };
}
