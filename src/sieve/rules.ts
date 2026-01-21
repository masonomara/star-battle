import {
  Board,
  CellState,
  Coord,
  StripCache,
  TilingCache,
} from "./helpers/types";
import { findAllMinimalTilings } from "./helpers/tiling";

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
    if (
      starsNeeded > 0 &&
      unknowns.length === starsNeeded &&
      !hasAdjacentPair(unknowns)
    ) {
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
    if (
      starsNeeded > 0 &&
      unknowns.length === starsNeeded &&
      !hasAdjacentPair(unknowns)
    ) {
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
    if (
      starsNeeded > 0 &&
      unknowns.length === starsNeeded &&
      !hasAdjacentPair(unknowns)
    ) {
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
  tilingCache?: TilingCache,
  _stripCache?: StripCache,
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
    const tiling =
      tilingCache?.byRegion.get(regionId) ??
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
      const isSingleInAllTilings = tiling.allMinimalTilings.every(
        (tilingSet) => {
          // Find the tile that covers this cell
          const coveringTile = tilingSet.find((tile) =>
            tile.coveredCells.some((c) => cellKey(c) === key),
          );

          // If no tile covers it (shouldn't happen), not single
          if (!coveringTile) return false;

          // Is this cell the only region cell in this tile?
          return coveringTile.coveredCells.length === 1;
        },
      );

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
 * Uses StripCache for efficient lookup of horizontal/vertical strips.
 */
export function oneByNConfinement(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  stripCache?: StripCache,
): boolean {
  if (!stripCache) return false;

  const numRows = board.grid.length;
  const numCols = board.grid[0].length;
  let changed = false;

  const coordKey = (r: number, c: number) => `${r},${c}`;

  // Track contributions per row/col for combined processing
  type Contribution = { starsContributed: number; cells: Set<string> };
  const rowContributions = new Map<number, Contribution[]>();
  const colContributions = new Map<number, Contribution[]>();

  // Helper: check if a region is completely confined to a single row
  // A region is row-confined if all its HORIZONTAL strips are in the same row
  // (vertical strips of length 1 are ignored - they just mean no vertical extent)
  const isRegionConfinedToRow = (regionId: number, row: number): boolean => {
    const regionStrips = stripCache.byRegion.get(regionId) ?? [];
    if (regionStrips.length === 0) return false;

    // Check all horizontal strips - they must all be in the target row
    let hasHorizontalStrip = false;
    for (const strip of regionStrips) {
      if (strip.orientation === "horizontal") {
        hasHorizontalStrip = true;
        if (strip.anchor[0] !== row) return false;
      } else {
        // Vertical strip with length > 1 means region spans multiple rows
        if (strip.cells.length > 1) return false;
      }
    }
    return hasHorizontalStrip;
  };

  // Helper: check if a region is completely confined to a single column
  // A region is col-confined if all its VERTICAL strips are in the same column
  // (horizontal strips of length 1 are ignored - they just mean no horizontal extent)
  const isRegionConfinedToCol = (regionId: number, col: number): boolean => {
    const regionStrips = stripCache.byRegion.get(regionId) ?? [];
    if (regionStrips.length === 0) return false;

    // Check all vertical strips - they must all be in the target column
    let hasVerticalStrip = false;
    for (const strip of regionStrips) {
      if (strip.orientation === "vertical") {
        hasVerticalStrip = true;
        if (strip.anchor[1] !== col) return false;
      } else {
        // Horizontal strip with length > 1 means region spans multiple columns
        if (strip.cells.length > 1) return false;
      }
    }
    return hasVerticalStrip;
  };

  // Phase 1: Simple confinement - collect contributions from regions entirely in one row/col
  for (const [regionId, regionStrips] of stripCache.byRegion) {
    if (regionStrips.length === 0) continue;

    const starsNeeded = regionStrips[0].starsNeeded;
    if (starsNeeded <= 0) continue;

    // Check row confinement
    const horizontalStrips = regionStrips.filter(
      (s) => s.orientation === "horizontal",
    );
    if (horizontalStrips.length > 0) {
      const rows = new Set(horizontalStrips.map((s) => s.anchor[0]));
      if (rows.size === 1) {
        const row = [...rows][0];
        if (isRegionConfinedToRow(regionId, row)) {
          if (!rowContributions.has(row)) rowContributions.set(row, []);
          const cellSet = new Set<string>();
          for (const strip of horizontalStrips) {
            for (const [r, c] of strip.cells) cellSet.add(coordKey(r, c));
          }
          rowContributions
            .get(row)!
            .push({ starsContributed: starsNeeded, cells: cellSet });
        }
      }
    }

    // Check column confinement
    const verticalStrips = regionStrips.filter(
      (s) => s.orientation === "vertical",
    );
    if (verticalStrips.length > 0) {
      const cols = new Set(verticalStrips.map((s) => s.anchor[1]));
      if (cols.size === 1) {
        const col = [...cols][0];
        if (isRegionConfinedToCol(regionId, col)) {
          if (!colContributions.has(col)) colContributions.set(col, []);
          const cellSet = new Set<string>();
          for (const strip of verticalStrips) {
            for (const [r, c] of strip.cells) cellSet.add(coordKey(r, c));
          }
          colContributions
            .get(col)!
            .push({ starsContributed: starsNeeded, cells: cellSet });
        }
      }
    }
  }

  // Phase 2: Tiling-based remainder detection
  // For regions spanning multiple rows/cols, check if tiling leaves a 1×n remainder
  if (tilingCache) {
    for (const [regionId, tiling] of tilingCache.byRegion) {
      if (tiling.allMinimalTilings.length === 0) continue;

      const regionStrips = stripCache.byRegion.get(regionId) ?? [];
      if (regionStrips.length === 0) continue;

      const starsNeeded = regionStrips[0].starsNeeded;
      if (starsNeeded <= 0) continue;

      const minTiles = tiling.minTileCount;
      if (minTiles >= starsNeeded) continue; // No remainder stars

      const remainderStars = starsNeeded - minTiles;

      // Find cells covered in ALL minimal tilings (intersection)
      const coveredInAll = new Set<string>();
      const firstTiling = tiling.allMinimalTilings[0];
      for (const tile of firstTiling) {
        for (const c of tile.coveredCells) {
          coveredInAll.add(coordKey(c[0], c[1]));
        }
      }
      for (let i = 1; i < tiling.allMinimalTilings.length; i++) {
        const thisCovered = new Set<string>();
        for (const tile of tiling.allMinimalTilings[i]) {
          for (const c of tile.coveredCells) {
            thisCovered.add(coordKey(c[0], c[1]));
          }
        }
        for (const key of coveredInAll) {
          if (!thisCovered.has(key)) coveredInAll.delete(key);
        }
      }

      // Remainder = region's unknown cells not covered in all tilings
      const remainderCells: Coord[] = [];
      for (const strip of regionStrips) {
        for (const [r, c] of strip.cells) {
          if (!coveredInAll.has(coordKey(r, c))) {
            remainderCells.push([r, c]);
          }
        }
      }

      if (remainderCells.length === 0) continue;

      const remainderRows = new Set(remainderCells.map(([r]) => r));
      const remainderCols = new Set(remainderCells.map(([, c]) => c));

      // If remainder is a 1×n (single row)
      if (remainderRows.size === 1) {
        const row = [...remainderRows][0];
        if (!rowContributions.has(row)) rowContributions.set(row, []);
        const cellSet = new Set(remainderCells.map(([r, c]) => coordKey(r, c)));
        rowContributions
          .get(row)!
          .push({ starsContributed: remainderStars, cells: cellSet });
      }

      // If remainder is an n×1 (single column)
      if (remainderCols.size === 1) {
        const col = [...remainderCols][0];
        if (!colContributions.has(col)) colContributions.set(col, []);
        const cellSet = new Set(remainderCells.map(([r, c]) => coordKey(r, c)));
        colContributions
          .get(col)!
          .push({ starsContributed: remainderStars, cells: cellSet });
      }
    }
  }

  // Phase 3: Process rows - mark cells outside contributing 1×n's
  for (const [row, contribs] of rowContributions) {
    let existingRowStars = 0;
    for (let col = 0; col < numCols; col++) {
      if (cells[row][col] === "star") existingRowStars++;
    }
    const rowQuota = board.stars - existingRowStars;
    if (rowQuota <= 0) continue;

    const totalContribution = contribs.reduce(
      (sum, c) => sum + c.starsContributed,
      0,
    );
    if (totalContribution < rowQuota) continue;

    // Collect all contributing cells
    const contributingCells = new Set<string>();
    for (const c of contribs) {
      for (const cell of c.cells) contributingCells.add(cell);
    }

    // Mark cells outside contributions
    for (let col = 0; col < numCols; col++) {
      const key = coordKey(row, col);
      if (cells[row][col] === "unknown" && !contributingCells.has(key)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  // Phase 4: Process columns - mark cells outside contributing n×1's
  for (const [col, contribs] of colContributions) {
    let existingColStars = 0;
    for (let row = 0; row < numRows; row++) {
      if (cells[row][col] === "star") existingColStars++;
    }
    const colQuota = board.stars - existingColStars;
    if (colQuota <= 0) continue;

    const totalContribution = contribs.reduce(
      (sum, c) => sum + c.starsContributed,
      0,
    );
    if (totalContribution < colQuota) continue;

    // Collect all contributing cells
    const contributingCells = new Set<string>();
    for (const c of contribs) {
      for (const cell of c.cells) contributingCells.add(cell);
    }

    // Mark cells outside contributions
    for (let row = 0; row < numRows; row++) {
      const key = coordKey(row, col);
      if (cells[row][col] === "unknown" && !contributingCells.has(key)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Rule 8. Exclusion: Mark cells where placing a star would make a tight region unsolvable.
 *
 * Only applies to "tight" regions where minTileCount == starsNeeded.
 * For each unknown cell in or adjacent to a tight region:
 *   - Simulate placing a star there
 *   - Mark its 8 neighbors
 *   - Recompute tiling for the affected tight region
 *   - If new minTileCount < (starsNeeded - 1), exclude the cell
 */
export function exclusion(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  _stripCache?: StripCache,
): boolean {
  const size = board.grid.length;

  // Build region info: cells, stars, and unknowns per region
  const regionCells = new Map<number, Coord[]>();
  const regionStars = new Map<number, number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = board.grid[r][c];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
        regionStars.set(regionId, 0);
      }
      regionCells.get(regionId)!.push([r, c]);
      if (cells[r][c] === "star") {
        regionStars.set(regionId, regionStars.get(regionId)! + 1);
      }
    }
  }

  // Find tight regions: minTileCount == starsNeeded
  const tightRegions = new Map<
    number,
    { cells: Coord[]; starsNeeded: number }
  >();

  for (const [regionId, rCells] of regionCells) {
    const existingStars = regionStars.get(regionId)!;
    const starsNeeded = board.stars - existingStars;

    if (starsNeeded <= 0) continue; // Region already complete

    // Compute tiling for this region
    const tiling =
      tilingCache?.byRegion.get(regionId) ??
      findAllMinimalTilings(rCells, cells, size);

    if (tiling.minTileCount === starsNeeded) {
      tightRegions.set(regionId, { cells: rCells, starsNeeded });
    }
  }

  if (tightRegions.size === 0) return false;

  // Build set of cells to check: cells in tight regions + their neighbors
  const cellsToCheck = new Set<string>();
  const coordKey = (r: number, c: number) => `${r},${c}`;

  for (const [, { cells: rCells }] of tightRegions) {
    for (const [r, c] of rCells) {
      // Add region cell
      cellsToCheck.add(coordKey(r, c));

      // Add all neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            cellsToCheck.add(coordKey(nr, nc));
          }
        }
      }
    }
  }

  // Check each candidate cell
  for (const key of cellsToCheck) {
    const [row, col] = key.split(",").map(Number);

    if (cells[row][col] !== "unknown") continue;

    // Create temp cells with hypothetical star placement
    const tempCells = cells.map((r) => [...r]);
    tempCells[row][col] = "star";

    // Mark all 8 neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (tempCells[nr][nc] === "unknown") {
            tempCells[nr][nc] = "marked";
          }
        }
      }
    }

    // Check if any tight region is now unsolvable
    for (const [regionId, { cells: rCells, starsNeeded }] of tightRegions) {
      // Determine remaining stars needed for this region
      const cellInRegion = board.grid[row][col] === regionId;
      const remainingStarsNeeded = cellInRegion ? starsNeeded - 1 : starsNeeded;

      if (remainingStarsNeeded <= 0) continue; // Placement completes this region

      // Recompute tiling with temp cells
      const newTiling = findAllMinimalTilings(rCells, tempCells, size);

      if (newTiling.minTileCount < remainingStarsNeeded) {
        // Can't fit remaining stars - exclude this cell
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}

/**
 * Rule 9. Pressured Exclusion: Exclusion with 1×n constraints
 *
 * For each 1×n strip (which guarantees at least 1 star):
 *   - Try placing a "faux star" at each cell in the strip
 *   - Mark the faux star's 8 neighbors
 *   - If ANY row, column, or tight region can no longer fit its remaining stars, mark that cell
 *
 * The faux star's marks can span multiple regions/rows/cols simultaneously,
 * creating combined effects that identify invalid star positions.
 */
export function pressuredExclusion(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  stripCache?: StripCache,
): boolean {
  if (!stripCache) return false;

  const numRows = board.grid.length;
  const numCols = board.grid[0].length;

  // Build region info
  const regionCells = new Map<number, Coord[]>();
  const regionStars = new Map<number, number>();

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const regionId = board.grid[r][c];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
        regionStars.set(regionId, 0);
      }
      regionCells.get(regionId)!.push([r, c]);
      if (cells[r][c] === "star") {
        regionStars.set(regionId, regionStars.get(regionId)! + 1);
      }
    }
  }

  // Collect all faux star candidates from strips
  const fauxCandidates: Coord[] = [];
  for (const [regionId, strips] of stripCache.byRegion) {
    const starsNeeded = board.stars - (regionStars.get(regionId) ?? 0);
    if (starsNeeded <= 0) continue;

    for (const strip of strips) {
      if (strip.starsNeeded <= 0) continue;

      for (const [r, c] of strip.cells) {
        if (cells[r][c] === "unknown") {
          fauxCandidates.push([r, c]);
        }
      }
    }
  }

  // Dedupe candidates
  const seen = new Set<string>();
  const uniqueCandidates: Coord[] = [];
  for (const [r, c] of fauxCandidates) {
    const key = `${r},${c}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCandidates.push([r, c]);
    }
  }

  // Try placing a faux star at each candidate
  for (const [fauxRow, fauxCol] of uniqueCandidates) {
    // Create temp cells with faux star placement
    const tempCells = cells.map((row) => [...row]);
    tempCells[fauxRow][fauxCol] = "star";

    // Mark the faux star's 8 neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = fauxRow + dr;
        const nc = fauxCol + dc;
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
          if (tempCells[nr][nc] === "unknown") {
            tempCells[nr][nc] = "marked";
          }
        }
      }
    }

    // Check if ANY region becomes unsolvable (immediate tiling check)
    for (const [regionId, rCells] of regionCells) {
      const existingStars = regionStars.get(regionId) ?? 0;
      const fauxInRegion = board.grid[fauxRow][fauxCol] === regionId;
      const starsNeeded = board.stars - existingStars - (fauxInRegion ? 1 : 0);

      if (starsNeeded <= 0) continue;

      const newTiling = findAllMinimalTilings(rCells, tempCells, numRows);

      if (newTiling.minTileCount < starsNeeded) {
        cells[fauxRow][fauxCol] = "marked";
        return true;
      }
    }

    // Check for forced column conflicts:
    // If a region's tilings ALL use the fauxCol, that column gets 2 stars,
    // which may break other regions that depend on that column
    for (const [regionId, rCells] of regionCells) {
      const fauxInRegion = board.grid[fauxRow][fauxCol] === regionId;
      if (fauxInRegion) continue; // Skip the faux star's own region

      const existingStars = regionStars.get(regionId) ?? 0;
      const starsNeeded = board.stars - existingStars;
      if (starsNeeded <= 0) continue;

      const newTiling = findAllMinimalTilings(rCells, tempCells, numRows);
      if (newTiling.allMinimalTilings.length === 0) continue;

      // Check if fauxCol is used in EVERY minimal tiling for this region
      const fauxColUsedInAll = newTiling.allMinimalTilings.every((tiling) =>
        tiling.some((tile) => tile.coveredCells.some(([, c]) => c === fauxCol)),
      );

      if (fauxColUsedInAll) {
        // This region MUST place a star in fauxCol
        // Combined with faux star, fauxCol has 2 stars - it's full
        // Check if any OTHER region becomes unsolvable without fauxCol

        // Create temp cells with fauxCol cells marked (simulating full column)
        const colBlockedCells = tempCells.map((row) => [...row]);
        for (let r = 0; r < numRows; r++) {
          if (colBlockedCells[r][fauxCol] === "unknown") {
            colBlockedCells[r][fauxCol] = "marked";
          }
        }

        // Check each other region
        for (const [otherRegionId, otherCells] of regionCells) {
          if (otherRegionId === regionId) continue;
          if (board.grid[fauxRow][fauxCol] === otherRegionId) continue;

          const otherExistingStars = regionStars.get(otherRegionId) ?? 0;
          const otherStarsNeeded = board.stars - otherExistingStars;
          if (otherStarsNeeded <= 0) continue;

          const otherTiling = findAllMinimalTilings(
            otherCells,
            colBlockedCells,
            numRows,
          );

          if (otherTiling.minTileCount < otherStarsNeeded) {
            cells[fauxRow][fauxCol] = "marked";
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Rule 10. Undercounting: N regions completely contained within N rows/cols
 *
 * When a collection of N regions is completely contained within N rows (or columns),
 * the stars in those N rows (or columns) must be in those regions.
 * This allows marking the cells of the N rows (or columns) that lie outside the N regions.
 */
export function undercounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  // Build region info: which rows/cols each region occupies
  const regionRows = new Map<number, Set<number>>(); // regionId → set of row indices
  const regionCols = new Map<number, Set<number>>(); // regionId → set of col indices
  const regionStars = new Map<number, number>(); // regionId → star count

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = board.grid[r][c];
      if (!regionRows.has(regionId)) {
        regionRows.set(regionId, new Set());
        regionCols.set(regionId, new Set());
        regionStars.set(regionId, 0);
      }
      regionRows.get(regionId)!.add(r);
      regionCols.get(regionId)!.add(c);
      if (cells[r][c] === "star") {
        regionStars.set(regionId, regionStars.get(regionId)! + 1);
      }
    }
  }

  // Filter to regions that still need stars
  const activeRegions = [...regionRows.keys()].filter(
    (id) => regionStars.get(id)! < board.stars,
  );

  // Helper: check if region is completely contained within a set of rows
  const isContainedInRows = (regionId: number, rows: Set<number>): boolean => {
    for (const r of regionRows.get(regionId)!) {
      if (!rows.has(r)) return false;
    }
    return true;
  };

  // Helper: check if region is completely contained within a set of cols
  const isContainedInCols = (regionId: number, cols: Set<number>): boolean => {
    for (const c of regionCols.get(regionId)!) {
      if (!cols.has(c)) return false;
    }
    return true;
  };

  // Try row-based undercounting
  // For each region, get the rows it occupies, then find other regions in exactly those rows
  for (const regionId of activeRegions) {
    const rows = regionRows.get(regionId)!;

    // Find all regions completely contained within these rows
    const containedRegions = activeRegions.filter((id) =>
      isContainedInRows(id, rows),
    );

    // Undercounting: N regions in N rows
    if (containedRegions.length === rows.size) {
      const containedSet = new Set(containedRegions);

      // Mark cells in these rows that are NOT in the contained regions
      for (const row of rows) {
        for (let c = 0; c < size; c++) {
          const cellRegion = board.grid[row][c];
          if (!containedSet.has(cellRegion) && cells[row][c] === "unknown") {
            cells[row][c] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  if (changed) return true;

  // Try column-based undercounting
  for (const regionId of activeRegions) {
    const cols = regionCols.get(regionId)!;

    // Find all regions completely contained within these columns
    const containedRegions = activeRegions.filter((id) =>
      isContainedInCols(id, cols),
    );

    // Undercounting: N regions in N cols
    if (containedRegions.length === cols.size) {
      const containedSet = new Set(containedRegions);

      // Mark cells in these cols that are NOT in the contained regions
      for (const col of cols) {
        for (let r = 0; r < size; r++) {
          const cellRegion = board.grid[r][col];
          if (!containedSet.has(cellRegion) && cells[r][col] === "unknown") {
            cells[r][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

/**
 * Rule 11. Overcounting: N regions completely CONTAIN N rows/cols
 *
 * When a collection of N regions completely contains N rows (or columns),
 * the stars in those regions must be in those N rows (or columns).
 * This allows marking the cells of each region that lie outside the N rows (or columns).
 */
export function overcounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  // Build region info: cells and stars per region
  const regionCellsList = new Map<number, Coord[]>();
  const regionStars = new Map<number, number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = board.grid[r][c];
      if (!regionCellsList.has(regionId)) {
        regionCellsList.set(regionId, []);
        regionStars.set(regionId, 0);
      }
      regionCellsList.get(regionId)!.push([r, c]);
      if (cells[r][c] === "star") {
        regionStars.set(regionId, regionStars.get(regionId)! + 1);
      }
    }
  }

  // Filter to regions that still need stars
  const activeRegionSet = new Set(
    [...regionCellsList.keys()].filter(
      (id) => regionStars.get(id)! < board.stars,
    ),
  );

  // Build row → active regions mapping (which active regions appear in each row)
  const rowActiveRegions = new Map<number, Set<number>>();
  for (let r = 0; r < size; r++) {
    rowActiveRegions.set(r, new Set());
    for (let c = 0; c < size; c++) {
      const rid = board.grid[r][c];
      if (activeRegionSet.has(rid)) {
        rowActiveRegions.get(r)!.add(rid);
      }
    }
  }

  // Build col → active regions mapping
  const colActiveRegions = new Map<number, Set<number>>();
  for (let c = 0; c < size; c++) {
    colActiveRegions.set(c, new Set());
    for (let r = 0; r < size; r++) {
      const rid = board.grid[r][c];
      if (activeRegionSet.has(rid)) {
        colActiveRegions.get(c)!.add(rid);
      }
    }
  }

  // Try row-based overcounting: find consecutive rows completely covered by N active regions
  for (let startRow = 0; startRow < size; startRow++) {
    const rowSet = new Set<number>();
    const regionSet = new Set<number>();

    for (let endRow = startRow; endRow < size; endRow++) {
      rowSet.add(endRow);

      // Track if this row adds new regions
      const prevRegionCount = regionSet.size;
      for (const rid of rowActiveRegions.get(endRow)!) {
        regionSet.add(rid);
      }
      const addedRegions = regionSet.size > prevRegionCount;

      // Check: N active regions completely contain N rows?
      if (regionSet.size === rowSet.size) {
        // Verify every cell in these rows belongs to these active regions
        let valid = true;
        for (const row of rowSet) {
          for (let c = 0; c < size; c++) {
            if (!regionSet.has(board.grid[row][c])) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }

        if (valid) {
          // Mark cells of these regions that are OUTSIDE these rows
          for (const rid of regionSet) {
            for (const [r, c] of regionCellsList.get(rid)!) {
              if (!rowSet.has(r) && cells[r][c] === "unknown") {
                cells[r][c] = "marked";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }

      // Optimization: if we added new regions and now have more regions than rows,
      // we can't recover by adding more rows (they'll only add more regions)
      // Only apply after first row - first row always adds regions from empty
      if (endRow > startRow && addedRegions && regionSet.size > rowSet.size)
        break;
    }
  }

  // Try column-based overcounting
  for (let startCol = 0; startCol < size; startCol++) {
    const colSet = new Set<number>();
    const regionSet = new Set<number>();

    for (let endCol = startCol; endCol < size; endCol++) {
      colSet.add(endCol);

      // Track if this column adds new regions
      const prevRegionCount = regionSet.size;
      for (const rid of colActiveRegions.get(endCol)!) {
        regionSet.add(rid);
      }
      const addedRegions = regionSet.size > prevRegionCount;

      // Check: N active regions completely contain N cols?
      if (regionSet.size === colSet.size) {
        // Verify every cell in these cols belongs to these active regions
        let valid = true;
        for (const col of colSet) {
          for (let r = 0; r < size; r++) {
            if (!regionSet.has(board.grid[r][col])) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }

        if (valid) {
          // Mark cells of these regions that are OUTSIDE these columns
          for (const rid of regionSet) {
            for (const [r, c] of regionCellsList.get(rid)!) {
              if (!colSet.has(c) && cells[r][c] === "unknown") {
                cells[r][c] = "marked";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }

      // Optimization: if we added new regions and now have more regions than cols,
      // we can't recover by adding more cols (they'll only add more regions)
      // Only apply after first col - first col always adds regions from empty
      if (endCol > startCol && addedRegions && regionSet.size > colSet.size)
        break;
    }
  }

  return changed;
}
