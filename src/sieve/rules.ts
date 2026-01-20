import { Board, CellState, Coord } from "./types";
import { findAllMinimalTilings } from "./tiling";

/**
 * Rule 1. Star Neighbors: Mark all 8 neighbors of placed stars
 */
export function trivialStarMarks(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "star") continue;

      // Mark all 8 neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;

          const nr = row + dr;
          const nc = col + dc;

          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

          if (cells[nr][nc] === "unknown") {
            cells[nr][nc] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

/**
 * Rule 2. Row Complete: Mark remaining cells in rows that have enough stars
 */
export function trivialRowComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;

  for (let row = 0; row < size; row++) {
    let starCount = 0;
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") starCount++;
    }

    if (starCount === board.stars) {
      for (let col = 0; col < size; col++) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * Rule 3. Column Complete: Mark remaining cells in columns that have enough stars
 */
export function trivialColComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;

  for (let col = 0; col < size; col++) {
    let starCount = 0;
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") starCount++;
    }

    if (starCount === board.stars) {
      for (let row = 0; row < size; row++) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * Rule 4. Region Complete: Mark remaining cells in regions that have enough stars
 */
export function trivialRegionComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;

  const regionCells = new Map<number, [number, number][]>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId)!.push([row, col]);
    }
  }

  for (const [, cellList] of regionCells) {
    let starCount = 0;
    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") starCount++;
    }

    if (starCount === board.stars) {
      for (const [row, col] of cellList) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * Check if any two cells in the list are adjacent (including diagonally)
 */
function hasAdjacentPair(cells: [number, number][]): boolean {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const [r1, c1] = cells[i];
      const [r2, c2] = cells[j];
      if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Rule 5. Forced Placement: Place stars when unknowns equal needed stars
 * If a row, column, or region has exactly as many unknowns as stars needed, place ONE star.
 * Only applies if the unknown cells are not adjacent (otherwise they can't all be stars).
 * Returns immediately after placing one star so trivialStarMarks can mark neighbors.
 */
export function forcedPlacement(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  // Check rows
  for (let row = 0; row < size; row++) {
    let starCount = 0;
    const unknowns: [number, number][] = [];

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknowns.length === starsNeeded && !hasAdjacentPair(unknowns)) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    let starCount = 0;
    const unknowns: [number, number][] = [];

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknowns.length === starsNeeded && !hasAdjacentPair(unknowns)) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  // Check regions
  const regionCells = new Map<number, [number, number][]>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId)!.push([row, col]);
    }
  }

  for (const [, cellList] of regionCells) {
    let starCount = 0;
    const unknowns: [number, number][] = [];

    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknowns.length === starsNeeded && !hasAdjacentPair(unknowns)) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  return false;
}

/**
 * Rule 6. The 2×2 Tiling: Use tiling to bound stars and find forced placements
 *
 * - minTileCount = max stars the region can hold
 * - If minTileCount == stars needed, each tile has exactly 1 star
 * - If a tile covers only 1 region cell in ALL tilings, that cell must be a star
 */
export function twoByTwoTiling(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  // Group cells by region
  const regionCells = new Map<number, Coord[]>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId)!.push([row, col]);
    }
  }

  // Process each region
  for (const [, cellList] of regionCells) {
    // Count existing stars in region
    let existingStars = 0;
    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") existingStars++;
    }

    const starsNeeded = board.stars - existingStars;
    if (starsNeeded <= 0) continue; // Region already has enough stars

    // Get all minimal tilings for this region
    const tiling = findAllMinimalTilings(cellList, cells, size);

    // If no valid tilings exist, skip (unsolvable or already solved)
    if (tiling.allMinimalTilings.length === 0) continue;

    const minTiles = tiling.minTileCount;

    // If minTiles < starsNeeded, puzzle is unsolvable from this region
    // If minTiles > starsNeeded, no forced placements (tiles don't all need stars)
    if (minTiles !== starsNeeded) continue;

    // minTiles == starsNeeded: each tile has exactly 1 star
    // Find cells that are the ONLY region cell in their tile across ALL tilings
    const cellKey = (c: Coord) => `${c[0]},${c[1]}`;

    // For each cell, check if it's single-coverage in ALL tilings
    for (const [row, col] of cellList) {
      if (cells[row][col] !== "unknown") continue;

      const coord: Coord = [row, col];
      const key = cellKey(coord);

      // Check if this cell is the only region cell in its tile in EVERY tiling
      const isSingleInAllTilings = tiling.allMinimalTilings.every((tilingSet) => {
        // Find the tile that covers this cell
        const coveringTile = tilingSet.find((tile) =>
          tile.coveredCells.some((c) => cellKey(c) === key)
        );

        // If no tile covers it (shouldn't happen), not single
        if (!coveringTile) return false;

        // Is this cell the only region cell in this tile?
        return coveringTile.coveredCells.length === 1;
      });

      if (isSingleInAllTilings) {
        cells[row][col] = "star";
        return true; // Place ONE star, then let trivialStarMarks run
      }
    }
  }

  return false;
}
