import type { Cell, Region, Grid, LayoutConfig } from "./types";

/**
 * Generates a randomized Star Battle grid layout by dividing an NxN grid into N regions.
 *
 * Algorithm approach:
 * 1. Start with N seed cells (one per region)
 * 2. Grow regions iteratively by adding adjacent cells
 * 3. Use randomization to create organic, varied region shapes
 *
 * @param config - Configuration with grid size and optional seed
 * @returns Grid with randomized regions
 */
export function layout(config: LayoutConfig): Grid {
  const { size } = config;

  if (size < 4 || size > 30) {
    throw new Error("Grid size must be between 4 and 30");
  }

  // Track which region each cell belongs to (-1 = unassigned)
  const cellToRegion: number[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(-1));

  // Initialize N regions with random seed cells
  const regions: Region[] = Array(size)
    .fill(null)
    .map(() => []);

  // Place seed cells for each region
  const seedCells = generateSeedCells(size);
  seedCells.forEach((cell, regionId) => {
    regions[regionId].push(cell);
    cellToRegion[cell.row][cell.col] = regionId;
  });

  // Grow regions until all cells are assigned
  const unassignedCells = size * size - size;
  let assigned = 0;

  while (assigned < unassignedCells) {
    // Find regions that can grow (have unassigned neighbors)
    const growableRegions = findGrowableRegions(regions, cellToRegion, size);

    if (growableRegions.length === 0) {
      // Fallback: assign remaining cells to smallest regions
      fillRemainingCells(regions, cellToRegion, size);
      break;
    }

    // Pick a random region to grow
    const regionId =
      growableRegions[Math.floor(Math.random() * growableRegions.length)];

    // Find candidate cells to add to this region
    const candidates = getUnassignedNeighbors(
      regions[regionId],
      cellToRegion,
      size
    );

    if (candidates.length === 0) continue;

    // Pick a random candidate cell
    const cell = candidates[Math.floor(Math.random() * candidates.length)];

    // Add cell to region
    regions[regionId].push(cell);
    cellToRegion[cell.row][cell.col] = regionId;
    assigned++;
  }

  return { size, regions };
}

/**
 * Generate seed cells - one per region, distributed across the grid
 */
function generateSeedCells(size: number): Cell[] {
  const seeds: Cell[] = [];
  const used = new Set<string>();

  // Strategy: divide grid into sectors and place one seed per sector
  const sectorSize = Math.ceil(Math.sqrt(size));

  for (let i = 0; i < size; i++) {
    let attempts = 0;
    let cell: Cell;

    do {
      // Random placement with slight sector bias for better distribution
      const sectorRow = Math.floor(i / sectorSize);
      const sectorCol = i % sectorSize;

      const rowStart = Math.floor((sectorRow * size) / sectorSize);
      const rowEnd = Math.floor(((sectorRow + 1) * size) / sectorSize);
      const colStart = Math.floor((sectorCol * size) / sectorSize);
      const colEnd = Math.floor(((sectorCol + 1) * size) / sectorSize);

      cell = {
        row: rowStart + Math.floor(Math.random() * (rowEnd - rowStart)),
        col: colStart + Math.floor(Math.random() * (colEnd - colStart)),
      };

      attempts++;

      // After many attempts, allow placement anywhere
      if (attempts > 100) {
        cell = {
          row: Math.floor(Math.random() * size),
          col: Math.floor(Math.random() * size),
        };
      }
    } while (used.has(`${cell.row},${cell.col}`) && attempts < 1000);

    seeds.push(cell);
    used.add(`${cell.row},${cell.col}`);
  }

  return seeds;
}

/**
 * Find regions that have at least one unassigned neighbor
 */
function findGrowableRegions(
  regions: Region[],
  cellToRegion: number[][],
  size: number
): number[] {
  const growable: number[] = [];

  for (let regionId = 0; regionId < regions.length; regionId++) {
    const neighbors = getUnassignedNeighbors(
      regions[regionId],
      cellToRegion,
      size
    );
    if (neighbors.length > 0) {
      growable.push(regionId);
    }
  }

  return growable;
}

/**
 * Get all unassigned cells adjacent to any cell in the region
 */
function getUnassignedNeighbors(
  region: Region,
  cellToRegion: number[][],
  size: number
): Cell[] {
  const neighbors = new Set<string>();
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1], // up, down, left, right
  ];

  for (const cell of region) {
    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;

      // Check bounds
      if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
        continue;
      }

      // Check if unassigned
      if (cellToRegion[newRow][newCol] === -1) {
        neighbors.add(`${newRow},${newCol}`);
      }
    }
  }

  return Array.from(neighbors).map((key) => {
    const [row, col] = key.split(",").map(Number);
    return { row, col };
  });
}

/**
 * Fill any remaining unassigned cells
 */
function fillRemainingCells(
  regions: Region[],
  cellToRegion: number[][],
  size: number
): void {
  const unassigned: Cell[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cellToRegion[row][col] === -1) {
        unassigned.push({ row, col });
      }
    }
  }

  // Sort regions by size (smallest first)
  const regionSizes = regions.map((r, i) => ({ id: i, size: r.length }));
  regionSizes.sort((a, b) => a.size - b.size);

  // Assign remaining cells to smallest regions
  let regionIndex = 0;
  for (const cell of unassigned) {
    const regionId = regionSizes[regionIndex % regionSizes.length].id;
    regions[regionId].push(cell);
    cellToRegion[cell.row][cell.col] = regionId;
    regionIndex++;
  }
}

/* Visualize grid layout */

export function visualizeGrid(grid: Grid): string {
  const { size, regions } = grid;
  const cellToRegion: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(" "));

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  regions.forEach((region, regionId) => {
    const char = chars[regionId % chars.length];
    region.forEach((cell) => {
      cellToRegion[cell.row][cell.col] = char;
    });
  });

  let output = "";
  for (let row = 0; row < size; row++) {
    output += cellToRegion[row].join(" ") + "\n";
  }

  return output;
}
