import { Board, CellState } from "./types";

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
 * Rule 5. Forced Placement: Place stars when unknowns equal needed stars
 * If a row, column, or region has exactly as many unknowns as stars needed, place stars
 */
export function forcedPlacement(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

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
      for (let col = 0; col < size; col++) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "star";
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
      for (let row = 0; row < size; row++) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "star";
          changed = true;
        }
      }
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
    let unknownCount = 0;

    for (const [row, col] of cellList) {
      if (cells[row][col] === "star") starCount++;
      else if (cells[row][col] === "unknown") unknownCount++;
    }

    const starsNeeded = board.stars - starCount;
    if (starsNeeded > 0 && unknownCount === starsNeeded) {
      for (const [row, col] of cellList) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  return changed;
}
