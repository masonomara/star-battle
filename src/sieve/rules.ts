import { Board, CellState, Coord, TilingCache } from "./types";
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
export function twoByTwoTiling(
  board: Board,
  cells: CellState[][],
  cache?: TilingCache,
): boolean {
  const size = board.grid.length;

  // Group cells by region (needed for star counting even with cache)
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
  for (const [regionId, cellList] of regionCells) {
    // Count existing stars in region
    let existingStars = 0;
    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") existingStars++;
    }

    const starsNeeded = board.stars - existingStars;
    if (starsNeeded <= 0) continue; // Region already has enough stars

    // Get tiling from cache or compute directly
    const tiling = cache?.byRegion.get(regionId) ??
      findAllMinimalTilings(cellList, cells, size);

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

/**
 * Rule 7. The 1×n Confinement: Mark row/col remainder when 1×n regions account for all stars
 *
 * A 1×n is a region (or portion of a region) whose stars must be in a single row.
 * An n×1 is the column equivalent.
 *
 * When multiple 1×n's in the same row together account for all stars in that row,
 * the remainder of the row can be marked.
 *
 * Detection:
 * - Simple: region's unknown cells are all in one row/col
 * - Advanced: partial 2×2 tiling bounds part of region, remainder is a 1×n
 */
export function oneByNConfinement(
  board: Board,
  cells: CellState[][],
  cache?: TilingCache,
): boolean {
  const numRows = board.grid.length;
  const numCols = board.grid[0].length;
  let changed = false;

  // Build region info: unknowns and existing stars
  const regionInfo = new Map<number, { unknowns: Coord[]; stars: number }>();

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const regionId = board.grid[row][col];
      if (!regionInfo.has(regionId)) {
        regionInfo.set(regionId, { unknowns: [], stars: 0 });
      }
      const info = regionInfo.get(regionId)!;
      if (cells[row][col] === "unknown") {
        info.unknowns.push([row, col]);
      } else if (cells[row][col] === "star") {
        info.stars++;
      }
    }
  }

  // Track 1×n contributions per row and n×1 contributions per column
  type Contribution = { starsContributed: number; cells: Set<string> };
  const rowContributions = new Map<number, Contribution[]>();
  const colContributions = new Map<number, Contribution[]>();

  const coordKey = (r: number, c: number) => `${r},${c}`;

  for (const [regionId, info] of regionInfo) {
    const starsNeeded = board.stars - info.stars;
    if (starsNeeded <= 0 || info.unknowns.length === 0) continue;

    const rows = new Set(info.unknowns.map(([r]) => r));
    const cols = new Set(info.unknowns.map(([, c]) => c));

    // Simple detection: all unknowns are in a single row (1×n)
    if (rows.size === 1) {
      const row = [...rows][0];
      if (!rowContributions.has(row)) {
        rowContributions.set(row, []);
      }
      const cellSet = new Set(info.unknowns.map(([r, c]) => coordKey(r, c)));
      rowContributions.get(row)!.push({ starsContributed: starsNeeded, cells: cellSet });
    }

    // Simple detection: all unknowns are in a single column (n×1)
    if (cols.size === 1) {
      const col = [...cols][0];
      if (!colContributions.has(col)) {
        colContributions.set(col, []);
      }
      const cellSet = new Set(info.unknowns.map(([r, c]) => coordKey(r, c)));
      colContributions.get(col)!.push({ starsContributed: starsNeeded, cells: cellSet });
    }

    // Advanced detection: use tiling to find 1×n remainders
    // If tiling shows minTiles < starsNeeded, remainder must have (starsNeeded - minTiles) stars
    if (cache && rows.size > 1 && cols.size > 1) {
      const tiling = cache.byRegion.get(regionId);
      if (tiling && tiling.allMinimalTilings.length > 0) {
        const minTiles = tiling.minTileCount;

        // If minTiles < starsNeeded, we can bound stars in tiled portion
        // The remainder (cells not covered by any tile in ALL tilings) must have remaining stars
        if (minTiles < starsNeeded) {
          const remainderStars = starsNeeded - minTiles;

          // Find cells that are NOT covered by tiles in ANY minimal tiling
          // These cells form the "remainder" that must contain remainderStars
          const coveredInAll = new Set<string>();
          const firstTiling = tiling.allMinimalTilings[0];
          for (const tile of firstTiling) {
            for (const c of tile.coveredCells) {
              coveredInAll.add(coordKey(c[0], c[1]));
            }
          }

          // Intersect with all other tilings
          for (let i = 1; i < tiling.allMinimalTilings.length; i++) {
            const thisTilingCovered = new Set<string>();
            for (const tile of tiling.allMinimalTilings[i]) {
              for (const c of tile.coveredCells) {
                thisTilingCovered.add(coordKey(c[0], c[1]));
              }
            }
            // Keep only cells covered in both
            for (const key of coveredInAll) {
              if (!thisTilingCovered.has(key)) {
                coveredInAll.delete(key);
              }
            }
          }

          // Remainder = unknowns not in coveredInAll
          const remainder: Coord[] = info.unknowns.filter(
            ([r, c]) => !coveredInAll.has(coordKey(r, c))
          );

          if (remainder.length > 0) {
            const remainderRows = new Set(remainder.map(([r]) => r));
            const remainderCols = new Set(remainder.map(([, c]) => c));

            // If remainder is a 1×n (single row)
            if (remainderRows.size === 1) {
              const row = [...remainderRows][0];
              if (!rowContributions.has(row)) {
                rowContributions.set(row, []);
              }
              const cellSet = new Set(remainder.map(([r, c]) => coordKey(r, c)));
              rowContributions.get(row)!.push({ starsContributed: remainderStars, cells: cellSet });
            }

            // If remainder is an n×1 (single column)
            if (remainderCols.size === 1) {
              const col = [...remainderCols][0];
              if (!colContributions.has(col)) {
                colContributions.set(col, []);
              }
              const cellSet = new Set(remainder.map(([r, c]) => coordKey(r, c)));
              colContributions.get(col)!.push({ starsContributed: remainderStars, cells: cellSet });
            }
          }
        }
      }
    }
  }

  // Process rows: if total contribution >= row quota, mark cells outside 1×n's
  for (const [row, contribs] of rowContributions) {
    let existingRowStars = 0;
    for (let col = 0; col < numCols; col++) {
      if (cells[row][col] === "star") existingRowStars++;
    }
    const rowQuota = board.stars - existingRowStars;
    if (rowQuota <= 0) continue;

    const totalContribution = contribs.reduce((sum, c) => sum + c.starsContributed, 0);
    if (totalContribution < rowQuota) continue;

    // Collect all 1×n cells in this row
    const oneByNCells = new Set<string>();
    for (const c of contribs) {
      for (const cell of c.cells) {
        oneByNCells.add(cell);
      }
    }

    // Mark cells in this row that are NOT in any 1×n
    for (let col = 0; col < numCols; col++) {
      const key = coordKey(row, col);
      if (cells[row][col] === "unknown" && !oneByNCells.has(key)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  // Process columns: if total contribution >= col quota, mark cells outside n×1's
  for (const [col, contribs] of colContributions) {
    let existingColStars = 0;
    for (let row = 0; row < numRows; row++) {
      if (cells[row][col] === "star") existingColStars++;
    }
    const colQuota = board.stars - existingColStars;
    if (colQuota <= 0) continue;

    const totalContribution = contribs.reduce((sum, c) => sum + c.starsContributed, 0);
    if (totalContribution < colQuota) continue;

    // Collect all n×1 cells in this column
    const nByOneCells = new Set<string>();
    for (const c of contribs) {
      for (const cell of c.cells) {
        nByOneCells.add(cell);
      }
    }

    // Mark cells in this column that are NOT in any n×1
    for (let row = 0; row < numRows; row++) {
      const key = coordKey(row, col);
      if (cells[row][col] === "unknown" && !nByOneCells.has(key)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
