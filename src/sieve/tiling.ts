/**
 * 2×2 Tiling Algorithm for Star Battle
 *
 * An exact cover problem: tiling an irregular grid region with non-overlapping 2×2 polyominoes, allowing boundary overhang.
 * or
 * Exact polyomino tiling with fixed 2×2 tiles.
 *
 * Generates tile candidates and finds all non-overlapping tilings for regions.
 * Uses DLX (Dancing Links) to find exact covers efficiently.
 *
 * Used by multiple rules: 2×2, Exclusion, Pressured Exclusion, Squeeze, Composite Regions.
 */

import {
  Board,
  CellState,
  Coord,
  Tile,
  RegionTiling,
  TilingCache,
} from "./types";
import { dlxSolve } from "./dlx";

/**
 * Convert a coordinate to a string key for Set/Map operations.
 */
function coordKey(coord: Coord): string {
  return `${coord[0]},${coord[1]}`;
}

/**
 * Check if a coordinate is within grid bounds.
 */
function inBounds(row: number, col: number, gridSize: number): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

/**
 * Generate all valid 2×2 tile candidates that overlap the given region cells.
 * Only considers unknown cells (excludes marked and star cells from coverage).
 */
export function generateTileCandidates(
  regionCells: Coord[],
  cells: CellState[][],
  gridSize: number,
): Tile[] {
  // Build set of unknown cells in the region
  const unknownCells = new Set<string>();
  for (const [r, c] of regionCells) {
    if (cells[r][c] === "unknown") {
      unknownCells.add(coordKey([r, c]));
    }
  }

  // If no unknown cells, no candidates needed
  if (unknownCells.size === 0) {
    return [];
  }

  // Find all possible 2×2 anchors that could cover any unknown cell
  // A 2×2 anchored at (r, c) covers cells (r,c), (r,c+1), (r+1,c), (r+1,c+1)
  const candidateAnchors = new Set<string>();

  for (const [r, c] of regionCells) {
    if (cells[r][c] !== "unknown") continue;

    // This cell could be covered by 2×2s anchored at:
    // (r-1, c-1), (r-1, c), (r, c-1), (r, c)
    for (const dr of [-1, 0]) {
      for (const dc of [-1, 0]) {
        const anchorR = r + dr;
        const anchorC = c + dc;

        // Check if anchor is valid (2×2 fits in grid)
        if (
          inBounds(anchorR, anchorC, gridSize) &&
          inBounds(anchorR + 1, anchorC + 1, gridSize)
        ) {
          candidateAnchors.add(coordKey([anchorR, anchorC]));
        }
      }
    }
  }

  // Build tile objects for each candidate anchor
  const tiles: Tile[] = [];

  for (const anchorKey of candidateAnchors) {
    const [anchorR, anchorC] = anchorKey.split(",").map(Number) as [
      number,
      number,
    ];

    // All 4 cells of the 2×2
    const allCells: Coord[] = [
      [anchorR, anchorC],
      [anchorR, anchorC + 1],
      [anchorR + 1, anchorC],
      [anchorR + 1, anchorC + 1],
    ];

    // Which cells are unknown AND in the region
    const coveredCells: Coord[] = [];
    for (const cell of allCells) {
      if (unknownCells.has(coordKey(cell))) {
        coveredCells.push(cell);
      }
    }

    // Only include tiles that cover at least one unknown cell
    if (coveredCells.length > 0) {
      tiles.push({
        anchor: [anchorR, anchorC],
        cells: allCells,
        coveredCells,
      });
    }
  }

  return tiles;
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
): RegionTiling {
  const candidates = generateTileCandidates(regionCells, cells, gridSize);

  // Build set of unknown cells to cover (primary columns)
  const unknownCells: Coord[] = [];
  const primaryCellToIndex = new Map<string, number>();

  for (const [r, c] of regionCells) {
    if (cells[r][c] === "unknown") {
      primaryCellToIndex.set(coordKey([r, c]), unknownCells.length);
      unknownCells.push([r, c]);
    }
  }

  // Handle empty case (no cells to cover)
  if (unknownCells.length === 0) {
    return {
      regionId: -1,
      cells: regionCells,
      candidates: [],
      minTileCount: 0,
      allMinimalTilings: [[]],
    };
  }

  // Handle case with no valid candidates
  if (candidates.length === 0) {
    return {
      regionId: -1,
      cells: regionCells,
      candidates: [],
      minTileCount: Infinity,
      allMinimalTilings: [],
    };
  }

  // Collect all non-region cells touched by any tile (secondary columns)
  const secondaryCells: Coord[] = [];
  const secondaryCellToIndex = new Map<string, number>();

  for (const tile of candidates) {
    for (const cell of tile.cells) {
      const key = coordKey(cell);
      if (!primaryCellToIndex.has(key) && !secondaryCellToIndex.has(key)) {
        secondaryCellToIndex.set(key, secondaryCells.length);
        secondaryCells.push(cell);
      }
    }
  }

  const numPrimary = unknownCells.length;
  const numSecondary = secondaryCells.length;

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
    return {
      regionId: -1,
      cells: regionCells,
      candidates,
      minTileCount: Infinity,
      allMinimalTilings: [],
    };
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

  return {
    regionId: -1,
    cells: regionCells,
    candidates,
    minTileCount,
    allMinimalTilings,
  };
}

/**
 * Get all cells in a region from the board.
 */
function getRegionCells(board: Board, regionId: number): Coord[] {
  const cells: Coord[] = [];
  const size = board.grid.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board.grid[r][c] === regionId) {
        cells.push([r, c]);
      }
    }
  }

  return cells;
}

/**
 * Get all cells in a pair of consecutive rows.
 */
function getRowPairCells(gridSize: number, firstRow: number): Coord[] {
  const cells: Coord[] = [];

  for (let c = 0; c < gridSize; c++) {
    cells.push([firstRow, c]);
    cells.push([firstRow + 1, c]);
  }

  return cells;
}

/**
 * Get all cells in a pair of consecutive columns.
 */
function getColPairCells(gridSize: number, firstCol: number): Coord[] {
  const cells: Coord[] = [];

  for (let r = 0; r < gridSize; r++) {
    cells.push([r, firstCol]);
    cells.push([r, firstCol + 1]);
  }

  return cells;
}

/**
 * Compute tilings for all regions and row/column pairs.
 * Called once when solver moves past level 1 rules.
 */
export function computeAllTilings(
  board: Board,
  cells: CellState[][],
): TilingCache {
  const size = board.grid.length;
  const byRegion = new Map<number, RegionTiling>();
  const byRowPair = new Map<number, RegionTiling>();
  const byColPair = new Map<number, RegionTiling>();

  // Find all unique region IDs
  const regionIds = new Set<number>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      regionIds.add(board.grid[r][c]);
    }
  }

  // Compute tilings for each region
  for (const regionId of regionIds) {
    const regionCells = getRegionCells(board, regionId);
    const tiling = findAllMinimalTilings(regionCells, cells, size);
    tiling.regionId = regionId;
    byRegion.set(regionId, tiling);
  }

  // Compute tilings for row pairs (for squeeze rule)
  for (let r = 0; r < size - 1; r++) {
    const rowPairCells = getRowPairCells(size, r);
    const tiling = findAllMinimalTilings(rowPairCells, cells, size);
    tiling.regionId = -1; // Not a region
    byRowPair.set(r, tiling);
  }

  // Compute tilings for column pairs (for squeeze rule)
  for (let c = 0; c < size - 1; c++) {
    const colPairCells = getColPairCells(size, c);
    const tiling = findAllMinimalTilings(colPairCells, cells, size);
    tiling.regionId = -1; // Not a region
    byColPair.set(c, tiling);
  }

  return { byRegion, byRowPair, byColPair };
}
