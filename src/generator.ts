import { Board, GeneratorError } from "./helpers/types";

const DIRECTIONS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function getNeighbors(
  grid: number[][],
  size: number,
  row: number,
  col: number,
  filled: boolean,
): [number, number][] {
  const result: [number, number][] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && (grid[nr][nc] !== -1) === filled) {
      result.push([nr, nc]);
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
      return { board, seed };
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

function validateInputs(size: number, stars: number): void {
  if (!Number.isInteger(size) || size < 4 || size > 25)
    throw new Error(`size must be an integer between 4 and 25, got ${size}`);
  if (!Number.isInteger(stars) || stars < 1 || stars > 6)
    throw new Error(`stars must be an integer between 1 and 6, got ${stars}`);
  if (stars > Math.floor(size / 2))
    throw new Error(`stars (${stars}) cannot exceed size/2 (${Math.floor(size / 2)})`);
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
  frontiers: Map<number, Set<number>>,
  rng: () => number,
): void {
  while (regionSizes.some((s) => s < minRegionSize)) {
    const needsGrowth: number[] = [];
    for (let regionId = 0; regionId < size; regionId++) {
      if (regionSizes[regionId] < minRegionSize) {
        const frontier = frontiers.get(regionId)!;
        for (const key of [...frontier]) {
          const r = Math.floor(key / size);
          const c = key % size;
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

    const row = Math.floor(key / size);
    const col = key % size;
    if (grid[row][col] !== -1) continue;

    grid[row][col] = regionId;
    regionSizes[regionId]++;

    for (const [nr, nc] of getNeighbors(grid, size, row, col, false)) {
      frontier.add(nr * size + nc);
    }
  }
}

/**
 * Fill remaining unfilled cells by assigning to adjacent regions.
 * Creates irregular region shapes.
 */
function fillRemaining(grid: number[][], size: number, rng: () => number): void {
  const frontier: number[] = [];
  const inFrontier = new Set<number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== -1) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
          const key = r * size + c;
          frontier.push(key);
          inFrontier.add(key);
          break;
        }
      }
    }
  }

  while (frontier.length > 0) {
    const idx = Math.floor(rng() * frontier.length);
    const key = frontier[idx];
    frontier[idx] = frontier[frontier.length - 1];
    frontier.pop();
    inFrontier.delete(key);

    const r = Math.floor(key / size);
    const c = key % size;

    const filledNeighbors = getNeighbors(grid, size, r, c, true);
    const [nr, nc] = filledNeighbors[Math.floor(rng() * filledNeighbors.length)];
    grid[r][c] = grid[nr][nc];

    for (const [dr, dc] of DIRECTIONS) {
      const nnr = r + dr, nnc = c + dc;
      if (nnr >= 0 && nnr < size && nnc >= 0 && nnc < size && grid[nnr][nnc] === -1) {
        const nkey = nnr * size + nnc;
        if (!inFrontier.has(nkey)) {
          frontier.push(nkey);
          inFrontier.add(nkey);
        }
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === -1)
        throw new GeneratorError("Layout generation stuck", "generator_stuck");
    }
  }
}

export function layoutWithSeed(size: number, stars: number, seed: number): Board {
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
  const frontiers: Map<number, Set<number>> = new Map();
  for (let regionId = 0; regionId < size; regionId++) {
    frontiers.set(regionId, new Set());
  }
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] !== -1) {
        const regionId = grid[row][col];
        for (const [nr, nc] of getNeighbors(grid, size, row, col, false)) {
          frontiers.get(regionId)!.add(nr * size + nc);
        }
      }
    }
  }

  growRegionsBalanced(grid, size, minRegionSize, regionSizes, frontiers, rng);
  fillRemaining(grid, size, rng);

  return { grid, stars };
}
