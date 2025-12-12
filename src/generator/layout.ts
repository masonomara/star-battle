import type { Cell, Region, Grid, LayoutConfig } from "./types";

export function layout(config: LayoutConfig): Grid {
  const { size } = config;
  if (size < 4 || size > 30)
    throw new Error("Grid size must be between 4 and 30");

  const cellToRegion: number[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(-1));
  const regions: Region[] = Array(size)
    .fill(null)
    .map(() => []);

  generateSeedCells(size).forEach((cell, regionId) => {
    regions[regionId].push(cell);
    cellToRegion[cell.row][cell.col] = regionId;
  });

  let assigned = 0;
  while (assigned < size * size - size) {
    const growable = findGrowableRegions(regions, cellToRegion, size);
    if (growable.length === 0) {
      fillRemainingCells(regions, cellToRegion, size);
      break;
    }

    const regionId = growable[Math.floor(Math.random() * growable.length)];
    const candidates = getUnassignedNeighbors(
      regions[regionId],
      cellToRegion,
      size
    );
    if (candidates.length === 0) continue;

    const cell = candidates[Math.floor(Math.random() * candidates.length)];
    regions[regionId].push(cell);
    cellToRegion[cell.row][cell.col] = regionId;
    assigned++;
  }

  return { size, regions };
}

function generateSeedCells(size: number): Cell[] {
  const seeds: Cell[] = [];
  const used = new Set<string>();
  const sectorSize = Math.ceil(Math.sqrt(size));

  for (let i = 0; i < size; i++) {
    let attempts = 0;
    let cell: Cell;

    do {
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

      if (++attempts > 100) {
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

function findGrowableRegions(
  regions: Region[],
  cellToRegion: number[][],
  size: number
): number[] {
  return regions
    .map((_, id) => ({
      id,
      neighbors: getUnassignedNeighbors(regions[id], cellToRegion, size),
    }))
    .filter(({ neighbors }) => neighbors.length > 0)
    .map(({ id }) => id);
}

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
    [0, 1],
  ];

  for (const cell of region) {
    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;
      if (
        newRow >= 0 &&
        newRow < size &&
        newCol >= 0 &&
        newCol < size &&
        cellToRegion[newRow][newCol] === -1
      ) {
        neighbors.add(`${newRow},${newCol}`);
      }
    }
  }

  return Array.from(neighbors).map((key) => {
    const [row, col] = key.split(",").map(Number);
    return { row, col };
  });
}

function fillRemainingCells(
  regions: Region[],
  cellToRegion: number[][],
  size: number
): void {
  const unassigned: Cell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cellToRegion[row][col] === -1) unassigned.push({ row, col });
    }
  }

  const regionSizes = regions
    .map((r, i) => ({ id: i, size: r.length }))
    .sort((a, b) => a.size - b.size);
  unassigned.forEach((cell, i) => {
    const regionId = regionSizes[i % regionSizes.length].id;
    regions[regionId].push(cell);
    cellToRegion[cell.row][cell.col] = regionId;
  });
}

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

  return cellToRegion.map((row) => row.join(" ")).join("\n") + "\n";
}
