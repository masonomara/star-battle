import type { Cell, Shape, Grid, LayoutConfig } from "./types";

export function layout(config: LayoutConfig): Grid {
  const { size } = config;
  if (size < 4 || size > 30)
    throw new Error("Grid size must be between 4 and 30");

  const cellToShape: number[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(-1));
  const shapes: Shape[] = Array(size)
    .fill(null)
    .map(() => []);

  generateSeedCells(size).forEach((cell, shapeId) => {
    shapes[shapeId].push(cell);
    cellToShape[cell.row][cell.col] = shapeId;
  });

  let assigned = 0;
  while (assigned < size * size - size) {
    const growable = findGrowableShapes(shapes, cellToShape, size);
    if (growable.length === 0) {
      fillRemainingCells(shapes, cellToShape, size);
      break;
    }

    const shapeId = growable[Math.floor(Math.random() * growable.length)];
    const candidates = getUnassignedNeighbors(
      shapes[shapeId],
      cellToShape,
      size
    );
    if (candidates.length === 0) continue;

    const cell = candidates[Math.floor(Math.random() * candidates.length)];
    shapes[shapeId].push(cell);
    cellToShape[cell.row][cell.col] = shapeId;
    assigned++;
  }

  return { size, shapes };
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

function findGrowableShapes(
  shapes: Shape[],
  cellToShape: number[][],
  size: number
): number[] {
  return shapes
    .map((_, id) => ({
      id,
      neighbors: getUnassignedNeighbors(shapes[id], cellToShape, size),
    }))
    .filter(({ neighbors }) => neighbors.length > 0)
    .map(({ id }) => id);
}

function getUnassignedNeighbors(
  shape: Shape,
  cellToShape: number[][],
  size: number
): Cell[] {
  const neighbors = new Set<string>();
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const cell of shape) {
    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;
      if (
        newRow >= 0 &&
        newRow < size &&
        newCol >= 0 &&
        newCol < size &&
        cellToShape[newRow][newCol] === -1
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
  shapes: Shape[],
  cellToShape: number[][],
  size: number
): void {
  const unassigned: Cell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cellToShape[row][col] === -1) unassigned.push({ row, col });
    }
  }

  const shapeSizes = shapes
    .map((r, i) => ({ id: i, size: r.length }))
    .sort((a, b) => a.size - b.size);
  unassigned.forEach((cell, i) => {
    const shapeId = shapeSizes[i % shapeSizes.length].id;
    shapes[shapeId].push(cell);
    cellToShape[cell.row][cell.col] = shapeId;
  });
}

export function visualizeGrid(grid: Grid): string {
  const { size, shapes } = grid;
  const cellToShape: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(" "));
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  shapes.forEach((shape, shapeId) => {
    const char = chars[shapeId % chars.length];
    shape.forEach((cell) => {
      cellToShape[cell.row][cell.col] = char;
    });
  });

  return cellToShape.map((row) => row.join(" ")).join("\n") + "\n";
}
