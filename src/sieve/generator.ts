import { Board, Coord, GeneratorError } from "./helpers/types";
import { computeTiling } from "./helpers/tiling";

function buildRegions(grid: number[][]) {
  const map = new Map<number, Coord[]>();
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = grid[r][c];
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push([r, c]);
    }
  }
  return map;
}

const DIRECTIONS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function getUnfilledNeighbors(
  grid: number[][],
  size: number,
  row: number,
  col: number,
): [number, number][] {
  const result: [number, number][] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
      result.push([nr, nc]);
    }
  }
  return result;
}

function getFilledNeighborIds(
  grid: number[][],
  size: number,
  row: number,
  col: number,
): number[] {
  const result: number[] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
      result.push(grid[nr][nc]);
    }
  }
  return result;
}

export type GenerateOptions = {
  maxAttempts?: number;
};

export type GenerateResult = {
  board: Board;
  seed: number;
  attempts: number;
};

/**
 * Generate a valid puzzle layout. Retries internally until success.
 */
export function generate(
  size: number,
  stars: number,
  options: GenerateOptions = {},
): GenerateResult {
  validateInputs(size, stars);

  const maxAttempts = options.maxAttempts ?? 100000;
  const baseSeed = Date.now() ^ (Math.random() * 0x100000000);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = (baseSeed + attempt) | 0;
    try {
      const board = layoutWithSeed(size, stars, seed);
      return { board, seed, attempts: attempt + 1 };
    } catch (e) {
      if (e instanceof GeneratorError) continue;
      throw e;
    }
  }

  throw new GeneratorError(
    `Failed to generate ${size}x${size} ${stars}-star layout after ${maxAttempts} attempts`,
    "generator_stuck",
  );
}

/**
 * Generate board layout from specific seed. For deterministic testing.
 */
export function layout(size: number, stars: number, seed: number): Board {
  validateInputs(size, stars);
  return layoutWithSeed(size, stars, seed);
}

function validateInputs(size: number, stars: number): void {
  if (size <= 0) {
    throw new Error("Layout generation failed: size must be positive");
  }
  if (stars <= 0) {
    throw new Error("Layout generation failed: stars must be positive");
  }
  if (stars > Math.floor(size / 2)) {
    throw new Error(
      `Layout generation failed: stars (${stars}) cannot exceed size/2 (${Math.floor(size / 2)})`,
    );
  }
}

/**
 * Grow regions until all reach minimum size for star placement.
 * Uses balanced frontier-based expansion.
 */
function growRegionsBalanced(
  grid: number[][],
  size: number,
  minRegionSize: number,
  regionSizes: number[],
  frontiers: Map<number, Set<string>>,
  rng: () => number,
): void {
  while (regionSizes.some((s) => s < minRegionSize)) {
    const needsGrowth: number[] = [];
    for (let regionId = 0; regionId < size; regionId++) {
      if (regionSizes[regionId] < minRegionSize) {
        const frontier = frontiers.get(regionId)!;
        for (const key of [...frontier]) {
          const [r, c] = key.split(",").map(Number) as Coord;
          if (grid[r][c] !== -1) frontier.delete(key);
        }
        if (frontier.size > 0) needsGrowth.push(regionId);
      }
    }

    if (needsGrowth.length === 0) break;

    const regionId = needsGrowth[Math.floor(rng() * needsGrowth.length)];
    const frontier = frontiers.get(regionId)!;
    const keys = [...frontier];
    const key = keys[Math.floor(rng() * keys.length)];
    frontier.delete(key);

    const [row, col] = key.split(",").map(Number) as Coord;
    if (grid[row][col] !== -1) continue;

    grid[row][col] = regionId;
    regionSizes[regionId]++;

    for (const [nr, nc] of getUnfilledNeighbors(grid, size, row, col)) {
      frontier.add(`${nr},${nc}`);
    }
  }
}

/**
 * Fill remaining unfilled cells by assigning to adjacent regions.
 * Creates irregular region shapes.
 */
function fillRemaining(
  grid: number[][],
  size: number,
  rng: () => number,
): void {
  let unfilled = true;
  let iterations = 0;
  const maxIterations = size * size * 100;

  while (unfilled) {
    if (++iterations > maxIterations) {
      throw new GeneratorError("Layout generation stuck", "generator_stuck");
    }
    unfilled = false;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] !== -1) continue;

        const neighborIds = getFilledNeighborIds(grid, size, row, col);
        if (neighborIds.length > 0) {
          grid[row][col] = neighborIds[Math.floor(rng() * neighborIds.length)];
        } else {
          unfilled = true;
        }
      }
    }
  }
}

function layoutWithSeed(size: number, stars: number, seed: number): Board {
  let s = seed | 0;
  const rng = () => {
    s = (Math.imul(s, 1103515245) + 12345) | 0;
    return (s >>> 0) / 0x100000000;
  };

  const grid: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => -1),
  );

  // Place N region seeds randomly
  let placed = 0;
  while (placed < size) {
    const row = Math.floor(rng() * size);
    const col = Math.floor(rng() * size);
    if (grid[row][col] === -1) grid[row][col] = placed++;
  }

  const minRegionSize = stars * 2 - 1;
  const regionSizes = new Array(size).fill(1);

  // Initialize frontiers from seed cells
  const frontiers: Map<number, Set<string>> = new Map();
  for (let regionId = 0; regionId < size; regionId++) {
    frontiers.set(regionId, new Set());
  }
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] !== -1) {
        const regionId = grid[row][col];
        for (const [nr, nc] of getUnfilledNeighbors(grid, size, row, col)) {
          frontiers.get(regionId)!.add(`${nr},${nc}`);
        }
      }
    }
  }

  growRegionsBalanced(grid, size, minRegionSize, regionSizes, frontiers, rng);
  fillRemaining(grid, size, rng);

  const board = { grid, stars };
  const regions = buildRegions(grid);

  if (!isValidTiling(regions, board.stars, size)) {
    throw new GeneratorError(
      "Layout generation failed: region cannot fit required stars",
      "invalid_tiling",
    );
  }

  return board;
}

/**
 * Check if a layout can support the required stars.
 *
 * 1. Row/column region count: each row and column must contain at least
 *    `stars` distinct regions, otherwise it can't hold enough stars.
 * 2. Per-region tiling capacity: each region must fit `stars` non-overlapping
 *    2×2 tiles.
 *
 * The row/col check is O(size²) and runs first to reject cheaply before
 * the more expensive per-region tiling computation.
 */
function isValidTiling(
  regions: Map<number, [number, number][]>,
  stars: number,
  size: number,
): boolean {
  // Build grid from regions for row/col checks
  const grid: number[][] = Array.from({ length: size }, () => new Array(size));
  for (const [id, coords] of regions) {
    for (const [r, c] of coords) {
      grid[r][c] = id;
    }
  }

  // Check each row and column has enough distinct regions
  for (let i = 0; i < size; i++) {
    const rowRegions = new Set<number>();
    const colRegions = new Set<number>();
    for (let j = 0; j < size; j++) {
      rowRegions.add(grid[i][j]);
      colRegions.add(grid[j][i]);
    }
    if (rowRegions.size < stars || colRegions.size < stars) {
      return false;
    }
  }

  // Per-region tiling capacity
  for (const [, coords] of regions) {
    if (computeTiling(coords, size).capacity < stars) {
      return false;
    }
  }
  return true;
}
