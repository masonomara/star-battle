import { Board } from "./helpers/types";

// Generate board layout from seed
export function layout(size: number, stars: number, seed: number): Board {
  // LCG for deterministic randomness (using Math.imul for 32-bit precision)
  let s = seed | 0;
  const rng = () => {
    s = (Math.imul(s, 1103515245) + 12345) | 0;
    return (s >>> 0) / 0x100000000;
  };

  const grid: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => -1),
  );

  // Place N region starting cells randomly
  let placed = 0;
  while (placed < size) {
    const row = Math.floor(rng() * size);
    const col = Math.floor(rng() * size);
    if (grid[row][col] === -1) grid[row][col] = placed++;
  }

  const minRegionSize = stars * 2 - 1;
  const regionSizes = new Array(size).fill(1);
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // Get valid neighbors for a cell
  const getUnfilledNeighbors = (
    row: number,
    col: number,
  ): Array<[number, number]> => {
    const neighbors: Array<[number, number]> = [];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
        neighbors.push([nr, nc]);
      }
    }
    return neighbors;
  };

  // Build frontier for each region
  const frontiers: Map<number, Set<string>> = new Map();
  for (let regionId = 0; regionId < size; regionId++) {
    frontiers.set(regionId, new Set());
  }

  // Initialize frontiers from seed cells
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] !== -1) {
        const regionId = grid[row][col];
        for (const [nr, nc] of getUnfilledNeighbors(row, col)) {
          frontiers.get(regionId)!.add(`${nr},${nc}`);
        }
      }
    }
  }

  // Phase 1: Balanced growth until all regions reach minimum size
  while (regionSizes.some((s) => s < minRegionSize)) {
    // Find regions below minimum that can expand
    const needsGrowth: number[] = [];
    for (let regionId = 0; regionId < size; regionId++) {
      if (regionSizes[regionId] < minRegionSize) {
        // Clean frontier
        const frontier = frontiers.get(regionId)!;
        for (const key of [...frontier]) {
          const [r, c] = key.split(",").map(Number);
          if (grid[r][c] !== -1) frontier.delete(key);
        }
        if (frontier.size > 0) needsGrowth.push(regionId);
      }
    }

    if (needsGrowth.length === 0) break; // Can't grow anymore

    // Pick random region that needs growth
    const regionId = needsGrowth[Math.floor(rng() * needsGrowth.length)];
    const frontier = frontiers.get(regionId)!;
    const keys = [...frontier];
    const key = keys[Math.floor(rng() * keys.length)];
    frontier.delete(key);

    const [row, col] = key.split(",").map(Number);
    if (grid[row][col] !== -1) continue;

    grid[row][col] = regionId;
    regionSizes[regionId]++;

    // Add new neighbors to this region's frontier
    for (const [nr, nc] of getUnfilledNeighbors(row, col)) {
      frontier.add(`${nr},${nc}`);
    }
  }

  // Phase 2: Random fill for remaining cells (irregular shapes)
  let unfilled = true;
  let iterations = 0;
  const maxIterations = size * size * 100;
  while (unfilled) {
    if (++iterations > maxIterations) {
      throw new Error("Layout generation stuck - could not fill grid");
    }
    unfilled = false;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] !== -1) continue;

        const neighbors = [];
        if (row > 0 && grid[row - 1][col] !== -1)
          neighbors.push(grid[row - 1][col]);
        if (row < size - 1 && grid[row + 1][col] !== -1)
          neighbors.push(grid[row + 1][col]);
        if (col > 0 && grid[row][col - 1] !== -1)
          neighbors.push(grid[row][col - 1]);
        if (col < size - 1 && grid[row][col + 1] !== -1)
          neighbors.push(grid[row][col + 1]);

        if (neighbors.length > 0) {
          grid[row][col] = neighbors[Math.floor(rng() * neighbors.length)];
        } else {
          unfilled = true;
        }
      }
    }
  }

  return { grid, stars };
}
