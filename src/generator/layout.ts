import type { Cell, Shape, Grid, LayoutConfig } from "./types";

/** Mulberry32 seeded PRNG - returns function that generates 0-1 */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layout(config: LayoutConfig): Grid {
  const { size, seed = Date.now() } = config;
  const random = createRng(seed);
  if (size < 4 || size > 30)
    throw new Error("Grid size must be between 4 and 30");

  const cellToShape: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(-1)
  );
  const shapes: Shape[] = Array.from({ length: size }, () => []);

  generateSeedCells(size, random).forEach((cell, id) => {
    shapes[id].push(cell);
    cellToShape[cell.row][cell.col] = id;
  });

  let assigned = 0;
  let stuckCount = 0;
  const maxStuck = size * size * 2;

  while (assigned < size * size - size) {
    const growable = shapes
      .map((_, id) => ({
        id,
        n: getUnassignedNeighbors(shapes[id], cellToShape, size),
      }))
      .filter(({ n }) => n.length > 0);

    if (growable.length === 0 || stuckCount >= maxStuck) {
      fillRemainingCells(shapes, cellToShape, size);
      break;
    }

    const { id, n } = growable[Math.floor(random() * growable.length)];
    const cell = n[Math.floor(random() * n.length)];

    // Skip isolation check if we're stuck too long
    if (stuckCount < maxStuck / 2 && wouldIsolate(cell, cellToShape, size)) {
      stuckCount++;
      continue;
    }

    shapes[id].push(cell);
    cellToShape[cell.row][cell.col] = id;
    assigned++;
    stuckCount = 0;
  }
  return { size, shapes };
}

function generateSeedCells(size: number, random: () => number): Cell[] {
  const seeds: Cell[] = [],
    used = new Set<string>(),
    sectorSize = Math.ceil(Math.sqrt(size));
  for (let i = 0; i < size; i++) {
    let attempts = 0,
      cell: Cell;
    do {
      const sr = Math.floor(i / sectorSize),
        sc = i % sectorSize;
      const [rs, re] = [
        Math.floor((sr * size) / sectorSize),
        Math.floor(((sr + 1) * size) / sectorSize),
      ];
      const [cs, ce] = [
        Math.floor((sc * size) / sectorSize),
        Math.floor(((sc + 1) * size) / sectorSize),
      ];
      cell =
        ++attempts > 100
          ? {
              row: Math.floor(random() * size),
              col: Math.floor(random() * size),
            }
          : {
              row: rs + Math.floor(random() * (re - rs)),
              col: cs + Math.floor(random() * (ce - cs)),
            };
    } while (used.has(`${cell.row},${cell.col}`) && attempts < 1000);
    seeds.push(cell);
    used.add(`${cell.row},${cell.col}`);
  }
  return seeds;
}

function getUnassignedNeighbors(
  shape: Shape,
  cellToShape: number[][],
  size: number
): Cell[] {
  const neighbors = new Set<string>();
  for (const { row, col } of shape)
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const [nr, nc] = [row + dr, col + dc];
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        cellToShape[nr][nc] === -1
      )
        neighbors.add(`${nr},${nc}`);
    }
  return [...neighbors].map((k) => {
    const [r, c] = k.split(",").map(Number);
    return { row: r, col: c };
  });
}

function wouldIsolate(
  cell: Cell,
  cellToShape: number[][],
  size: number
): boolean {
  // Check if assigning this cell would isolate any unassigned neighbor
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of dirs) {
    const nr = cell.row + dr;
    const nc = cell.col + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (cellToShape[nr][nc] !== -1) continue;

    // Count unassigned neighbors of this neighbor (excluding the cell we're assigning)
    let openNeighbors = 0;
    for (const [dr2, dc2] of dirs) {
      const nnr = nr + dr2;
      const nnc = nc + dc2;
      if (nnr < 0 || nnr >= size || nnc < 0 || nnc >= size) continue;
      if (nnr === cell.row && nnc === cell.col) continue;
      if (cellToShape[nnr][nnc] === -1) openNeighbors++;
    }

    // If neighbor would have no open neighbors, it would be isolated
    if (openNeighbors === 0) return true;
  }

  return false;
}

function fillRemainingCells(
  shapes: Shape[],
  cellToShape: number[][],
  size: number
): void {
  const unassigned: Cell[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (cellToShape[r][c] === -1) unassigned.push({ row: r, col: c });
  const sorted = shapes
    .map((s, id) => ({ id, size: s.length }))
    .sort((a, b) => a.size - b.size);
  unassigned.forEach((cell, i) => {
    const id = sorted[i % sorted.length].id;
    shapes[id].push(cell);
    cellToShape[cell.row][cell.col] = id;
  });
}

export function visualizeGrid({ size, shapes }: Grid): string {
  const g: string[][] = Array.from({ length: size }, () =>
    Array(size).fill(" ")
  );
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  shapes.forEach((shape, id) =>
    shape.forEach((c) => (g[c.row][c.col] = chars[id % chars.length]))
  );
  return g.map((r) => r.join(" ")).join("\n") + "\n";
}
