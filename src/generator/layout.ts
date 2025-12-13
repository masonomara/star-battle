import { Grid, Cell, CellState, Region, LayoutResult } from './types';

export interface LayoutOptions {
  size: number;
  starsPerRegion?: number;
  verbose?: boolean;
  seed?: number;
}

// Simple seeded random for reproducibility
class Random {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Check if cell is valid
function isValid(r: number, c: number, size: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

// Get 4-directional neighbors
function getNeighbors4(r: number, c: number, size: number): Cell[] {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const neighbors: Cell[] = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (isValid(nr, nc, size)) {
      neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

// Flood fill to check connectivity
function isConnected(regions: number[][], regionId: number, size: number): boolean {
  const cells: Cell[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === regionId) {
        cells.push({ row: r, col: c });
      }
    }
  }

  if (cells.length === 0) return true;

  const visited = new Set<string>();
  const queue = [cells[0]];
  visited.add(`${cells[0].row},${cells[0].col}`);

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const neighbors = getNeighbors4(cell.row, cell.col, size);

    for (const n of neighbors) {
      const key = `${n.row},${n.col}`;
      if (!visited.has(key) && regions[n.row][n.col] === regionId) {
        visited.add(key);
        queue.push(n);
      }
    }
  }

  return visited.size === cells.length;
}

// Generate a random layout using region growing
export function layout(options: LayoutOptions): LayoutResult {
  const { size, starsPerRegion = size <= 6 ? 1 : 2, verbose = false, seed } = options;
  const random = new Random(seed);

  const log = (msg: string) => {
    if (verbose) console.log(msg);
  };

  log(`Generating ${size}x${size} layout with ${size} regions...`);

  // Initialize grid with -1 (unassigned)
  const regions: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(-1)
  );

  // Target cells per region
  const totalCells = size * size;
  const targetCellsPerRegion = Math.floor(totalCells / size);
  const regionSizes = new Array(size).fill(targetCellsPerRegion);

  // Distribute remainder
  let remainder = totalCells - targetCellsPerRegion * size;
  for (let i = 0; i < remainder; i++) {
    regionSizes[i]++;
  }

  // Place seed cells for each region
  const seeds: Cell[] = [];
  const usedSeeds = new Set<string>();

  for (let regionId = 0; regionId < size; regionId++) {
    let attempts = 0;
    while (attempts < 100) {
      const r = random.int(size);
      const c = random.int(size);
      const key = `${r},${c}`;

      if (!usedSeeds.has(key)) {
        // Check minimum distance from other seeds
        let tooClose = false;
        for (const seed of seeds) {
          const dist = Math.abs(seed.row - r) + Math.abs(seed.col - c);
          if (dist < 2) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          usedSeeds.add(key);
          seeds.push({ row: r, col: c });
          regions[r][c] = regionId;
          break;
        }
      }
      attempts++;
    }

    // Fallback: use any unassigned cell
    if (seeds.length <= regionId) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === -1) {
            seeds.push({ row: r, col: c });
            regions[r][c] = regionId;
            break;
          }
        }
        if (seeds.length > regionId) break;
      }
    }
  }

  log(`Placed ${seeds.length} seed cells`);

  // Grow regions
  const frontiers: Cell[][] = seeds.map(s => [s]);
  const currentSizes = new Array(size).fill(1);

  let unassigned = totalCells - size;
  let iterations = 0;
  const maxIterations = totalCells * 10;

  while (unassigned > 0 && iterations < maxIterations) {
    iterations++;

    // Pick a region that needs more cells
    const needsGrowth = [];
    for (let regionId = 0; regionId < size; regionId++) {
      if (currentSizes[regionId] < regionSizes[regionId] && frontiers[regionId].length > 0) {
        needsGrowth.push(regionId);
      }
    }

    if (needsGrowth.length === 0) break;

    const regionId = needsGrowth[random.int(needsGrowth.length)];

    // Find candidates to add to this region
    const candidates: Cell[] = [];
    for (const cell of frontiers[regionId]) {
      const neighbors = getNeighbors4(cell.row, cell.col, size);
      for (const n of neighbors) {
        if (regions[n.row][n.col] === -1) {
          candidates.push(n);
        }
      }
    }

    if (candidates.length === 0) {
      frontiers[regionId] = [];
      continue;
    }

    // Pick random candidate
    const candidate = candidates[random.int(candidates.length)];
    regions[candidate.row][candidate.col] = regionId;
    currentSizes[regionId]++;
    unassigned--;

    // Update frontier
    frontiers[regionId].push(candidate);

    // Remove cells from frontier that have no unassigned neighbors
    frontiers[regionId] = frontiers[regionId].filter(cell => {
      const neighbors = getNeighbors4(cell.row, cell.col, size);
      return neighbors.some(n => regions[n.row][n.col] === -1);
    });
  }

  // Handle any remaining unassigned cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === -1) {
        // Assign to adjacent region
        const neighbors = getNeighbors4(r, c, size);
        for (const n of neighbors) {
          if (regions[n.row][n.col] !== -1) {
            regions[r][c] = regions[n.row][n.col];
            break;
          }
        }
      }
    }
  }

  // Build region list
  const regionList: Region[] = [];
  for (let regionId = 0; regionId < size; regionId++) {
    const cells: Cell[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === regionId) {
          cells.push({ row: r, col: c });
        }
      }
    }
    regionList.push({ id: regionId, cells });
  }

  // Initialize cell states
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array(size).fill(CellState.UNKNOWN)
  );

  const grid: Grid = {
    size,
    starsPerRegion,
    cells,
    regions,
    regionList,
  };

  log(`Layout complete: ${regionList.map(r => r.cells.length).join(', ')} cells per region`);

  return {
    grid,
    regionCount: size,
  };
}

// Generate layout with verbose output
export function layoutVerbose(size: number, seed?: number): LayoutResult {
  return layout({ size, verbose: true, seed });
}

// Format regions for display
export function formatRegions(grid: Grid): string {
  const lines: string[] = [];

  for (let r = 0; r < grid.size; r++) {
    let line = '';
    for (let c = 0; c < grid.size; c++) {
      const region = grid.regions[r][c];
      line += String.fromCharCode(65 + region) + ' ';
    }
    lines.push(line);
  }

  return lines.join('\n');
}

// Validate layout
export function validateLayout(grid: Grid): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all cells assigned
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.regions[r][c] < 0 || grid.regions[r][c] >= grid.size) {
        errors.push(`Cell (${r},${c}) has invalid region ${grid.regions[r][c]}`);
      }
    }
  }

  // Check region connectivity
  for (let regionId = 0; regionId < grid.regionList.length; regionId++) {
    if (!isConnected(grid.regions, regionId, grid.size)) {
      errors.push(`Region ${regionId} is not connected`);
    }
  }

  // Check region count
  if (grid.regionList.length !== grid.size) {
    errors.push(`Expected ${grid.size} regions, got ${grid.regionList.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
