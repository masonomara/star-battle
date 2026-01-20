import { Board, CellState } from "./types";

/**
 * Rule 1. Star Neighbors: Mark all 8 neighbors of placed stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialStarMarks(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let result: CellState[][] | null = null;

  const ensureResult = () => {
    if (!result) {
      result = cells.map((row) => [...row]);
    }
    return result;
  };

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
            ensureResult()[nr][nc] = "marked";
          }
        }
      }
    }
  }

  return result;
}

/**
 * Rule 2. Row Complete: Mark remaining cells in rows that have enough stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialRowComplete(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let result: CellState[][] | null = null;

  const ensureResult = () => {
    if (!result) {
      result = cells.map((row) => [...row]);
    }
    return result;
  };

  for (let row = 0; row < size; row++) {
    // Count stars in this row
    let starCount = 0;
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") starCount++;
    }

    // If row has enough stars, mark all unknowns
    if (starCount === board.stars) {
      for (let col = 0; col < size; col++) {
        if (cells[row][col] === "unknown") {
          ensureResult()[row][col] = "marked";
        }
      }
    }
  }

  return result;
}

/**
 * Rule 3. Column Complete: Mark remaining cells in columns that have enough stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialColComplete(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let result: CellState[][] | null = null;

  const ensureResult = () => {
    if (!result) {
      result = cells.map((row) => [...row]);
    }
    return result;
  };

  for (let col = 0; col < size; col++) {
    // Count stars in this column
    let starCount = 0;
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") starCount++;
    }

    // If column has enough stars, mark all unknowns
    if (starCount === board.stars) {
      for (let row = 0; row < size; row++) {
        if (cells[row][col] === "unknown") {
          ensureResult()[row][col] = "marked";
        }
      }
    }
  }

  return result;
}

/**
 * Rule 4. Region Complete: Mark remaining cells in regions that have enough stars
 * Returns new cells array if changes made, null if no changes
 */
export function trivialRegionComplete(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let result: CellState[][] | null = null;

  const ensureResult = () => {
    if (!result) {
      result = cells.map((row) => [...row]);
    }
    return result;
  };

  // Build region map in single pass
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
    // Count stars in this region
    let starCount = 0;
    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") starCount++;
    }

    // If region has enough stars, mark all unknowns in that region
    if (starCount === board.stars) {
      for (const [row, col] of cellList) {
        if (cells[row][col] === "unknown") {
          ensureResult()[row][col] = "marked";
        }
      }
    }
  }

  return result;
}

/**
 * Rule 5. Forced Placement: Place stars when unknowns equal needed stars
 * If a row, column, or region has exactly as many unknowns as stars needed, place stars
 * Returns new cells array if changes made, null if no changes
 */
export function forcedPlacement(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let changed = false;
  let result: CellState[][] | null = null;

  // Helper to ensure result is initialized
  const ensureResult = () => {
    if (!result) {
      result = cells.map((row) => [...row]);
    }
    return result;
  };

  // Check rows
  for (let row = 0; row < size; row++) {
    let starCount = 0;
    let unknownCount = 0;

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknownCount++;
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknownCount === starsNeeded) {
      const r = ensureResult();
      for (let col = 0; col < size; col++) {
        if (r[row][col] === "unknown") {
          r[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    let starCount = 0;
    let unknownCount = 0;

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknownCount++;
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknownCount === starsNeeded) {
      const r = ensureResult();
      for (let row = 0; row < size; row++) {
        if (r[row][col] === "unknown") {
          r[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  // Check regions - build region map first for efficiency
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
    let unknownCount = 0;

    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknownCount++;
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknownCount === starsNeeded) {
      const r = ensureResult();
      for (const [row, col] of cellList) {
        if (r[row][col] === "unknown") {
          r[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  return changed ? result : null;
}

/**
 * Rule 6. 2x2 Tiling: The 2×2 tiling rule
 * A 2×2 can hold at most 1 star. If a region tiles with N 2×2s and needs N stars,
 * each tile has exactly 1 star. Place stars when a tile has only 1 viable cell.
 */
export function twoByTwoTiling(
  board: Board,
  cells: CellState[][],
): CellState[][] | null {
  const size = board.grid.length;
  let result: CellState[][] | null = null;

  const ensureResult = () => {
    if (!result) {
      result = cells.map((row) => [...row]);
    }
    return result;
  };

  // Build region data: cells and current star count
  const regionCells = new Map<number, [number, number][]>();
  const regionStars = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
        regionStars.set(regionId, 0);
      }
      regionCells.get(regionId)!.push([row, col]);
      if (cells[row][col] === "star") {
        regionStars.set(regionId, regionStars.get(regionId)! + 1);
      }
    }
  }

  // Process each region
  for (const [regionId, cellList] of regionCells) {
    const currentStars = regionStars.get(regionId)!;
    const starsNeeded = board.stars - currentStars;

    if (starsNeeded <= 0) continue; // Region already has enough stars

    // Get unknown cells in this region
    const unknowns = cellList.filter(([r, c]) => cells[r][c] === "unknown");

    if (unknowns.length === 0) continue;

    // Find minimal 2×2 tiling for the unknown cells
    const regionSet = new Set(unknowns.map(([r, c]) => `${r},${c}`));
    const { tiles, assignedCells } = minimalTiling(regionSet, size);

    // Only proceed if tiling count equals stars needed (tight bound)
    if (tiles.length !== starsNeeded) continue;

    // For each tile, check if it has exactly 1 assigned cell (viable for star)
    for (const [tr, tc] of tiles) {
      const tileKey = `${tr},${tc}`;
      const assigned = assignedCells.get(tileKey) || [];

      if (assigned.length === 1) {
        const [r, c] = assigned[0].split(",").map(Number);
        if (cells[r][c] === "unknown") {
          ensureResult()[r][c] = "star";
        }
      }
    }
  }

  return result;
}

/**
 * Get cells covered by a 2×2 tile with top-left at (row, col)
 */
function getTileCells(
  row: number,
  col: number,
  size: number,
): [number, number][] {
  const cells: [number, number][] = [];
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r < size && c < size) {
        cells.push([r, c]);
      }
    }
  }
  return cells;
}

/**
 * Find minimal set of 2×2 tiles to cover all cells in regionSet
 * Returns tiles and the cells assigned to each tile (for determining viable cells)
 * Uses greedy approach: pick tile covering most uncovered cells
 */
function minimalTiling(
  regionSet: Set<string>,
  size: number,
): { tiles: [number, number][]; assignedCells: Map<string, string[]> } {
  if (regionSet.size === 0) return { tiles: [], assignedCells: new Map() };

  const uncovered = new Set(regionSet);
  const tiles: [number, number][] = [];
  const assignedCells = new Map<string, string[]>(); // tile key -> cells assigned to it

  while (uncovered.size > 0) {
    let bestTile: [number, number] | null = null;
    let bestCount = 0;

    // Find all possible 2×2 positions
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const tileCells = getTileCells(r, c, size);
        const coverCount = tileCells.filter(([tr, tc]) =>
          uncovered.has(`${tr},${tc}`),
        ).length;

        if (coverCount > bestCount) {
          bestCount = coverCount;
          bestTile = [r, c];
        }
      }
    }

    if (!bestTile || bestCount === 0) {
      break;
    }

    tiles.push(bestTile);
    const tileKey = `${bestTile[0]},${bestTile[1]}`;
    const assigned: string[] = [];

    // Assign uncovered cells to this tile, then mark them covered
    const tileCells = getTileCells(bestTile[0], bestTile[1], size);
    for (const [tr, tc] of tileCells) {
      const cellKey = `${tr},${tc}`;
      if (uncovered.has(cellKey)) {
        assigned.push(cellKey);
        uncovered.delete(cellKey);
      }
    }
    assignedCells.set(tileKey, assigned);
  }

  return { tiles, assignedCells };
}
