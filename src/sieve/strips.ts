import { Board, CellState, Coord, Strip, StripCache } from "./types";

/**
 * Find all horizontal strips (1×n) in a single row.
 * A strip is a maximal contiguous run of unknown cells within the same region.
 */
function findHorizontalStrips(
  board: Board,
  cells: CellState[][],
  row: number,
  regionStars: Map<number, number>,
): Strip[] {
  const size = board.grid[0].length;
  const strips: Strip[] = [];

  let col = 0;
  while (col < size) {
    // Skip non-unknown cells
    if (cells[row][col] !== "unknown") {
      col++;
      continue;
    }

    // Start of a potential strip
    const regionId = board.grid[row][col];
    const startCol = col;
    const stripCells: Coord[] = [];

    // Extend while same region and unknown
    while (
      col < size &&
      cells[row][col] === "unknown" &&
      board.grid[row][col] === regionId
    ) {
      stripCells.push([row, col]);
      col++;
    }

    // Create strip
    const existingStars = regionStars.get(regionId) ?? 0;
    strips.push({
      regionId,
      orientation: "horizontal",
      anchor: [row, startCol],
      cells: stripCells,
      starsNeeded: board.stars - existingStars,
    });
  }

  return strips;
}

/**
 * Find all vertical strips (n×1) in a single column.
 * A strip is a maximal contiguous run of unknown cells within the same region.
 */
function findVerticalStrips(
  board: Board,
  cells: CellState[][],
  col: number,
  regionStars: Map<number, number>,
): Strip[] {
  const size = board.grid.length;
  const strips: Strip[] = [];

  let row = 0;
  while (row < size) {
    // Skip non-unknown cells
    if (cells[row][col] !== "unknown") {
      row++;
      continue;
    }

    // Start of a potential strip
    const regionId = board.grid[row][col];
    const startRow = row;
    const stripCells: Coord[] = [];

    // Extend while same region and unknown
    while (
      row < size &&
      cells[row][col] === "unknown" &&
      board.grid[row][col] === regionId
    ) {
      stripCells.push([row, col]);
      row++;
    }

    // Create strip
    const existingStars = regionStars.get(regionId) ?? 0;
    strips.push({
      regionId,
      orientation: "vertical",
      anchor: [startRow, col],
      cells: stripCells,
      starsNeeded: board.stars - existingStars,
    });
  }

  return strips;
}

/**
 * Compute all strips (1×n and n×1) for the current board state.
 * Returns a cache indexed by row, column, and region.
 */
export function computeAllStrips(board: Board, cells: CellState[][]): StripCache {
  const numRows = board.grid.length;
  const numCols = board.grid[0].length;

  // Pre-compute stars per region
  const regionStars = new Map<number, number>();
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const regionId = board.grid[row][col];
      if (cells[row][col] === "star") {
        regionStars.set(regionId, (regionStars.get(regionId) ?? 0) + 1);
      }
    }
  }

  const byRow = new Map<number, Strip[]>();
  const byCol = new Map<number, Strip[]>();
  const byRegion = new Map<number, Strip[]>();

  // Find horizontal strips for each row
  for (let row = 0; row < numRows; row++) {
    const strips = findHorizontalStrips(board, cells, row, regionStars);
    byRow.set(row, strips);

    // Also index by region
    for (const strip of strips) {
      if (!byRegion.has(strip.regionId)) {
        byRegion.set(strip.regionId, []);
      }
      byRegion.get(strip.regionId)!.push(strip);
    }
  }

  // Find vertical strips for each column
  for (let col = 0; col < numCols; col++) {
    const strips = findVerticalStrips(board, cells, col, regionStars);
    byCol.set(col, strips);

    // Also index by region
    for (const strip of strips) {
      if (!byRegion.has(strip.regionId)) {
        byRegion.set(strip.regionId, []);
      }
      byRegion.get(strip.regionId)!.push(strip);
    }
  }

  return { byRow, byCol, byRegion };
}
