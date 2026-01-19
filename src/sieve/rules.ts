import { Board, CellState } from "./types";

/**
 * Rule 1.1: Mark all 8 neighbors of placed stars
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
 * Rule 1.1: Mark remaining cells in rows that have enough stars
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
 * Rule 1.1: Mark remaining cells in columns that have enough stars
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
 * Rule 1.1: Mark remaining cells in regions that have enough stars
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
 * Rule 1.1: Place stars when unknowns equal needed stars
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
