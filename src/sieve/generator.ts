import { Board } from "./types";

// Linear Congruential Generator - deterministic RNG from seed
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Layout Generation

export function layout(
  size: number,
  stars: number,
  seed?: number,
): { board: Board; seed: number } {
  const actualSeed = seed ?? Math.floor(Math.random() * 0x7fffffff);
  const rng = lcg(actualSeed);
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

  // Fill remaining cells - each joins a random adjacent region
  // Multiple passes until all filled
  let unfilled = true;
  while (unfilled) {
    unfilled = false;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] !== -1) continue;

        const neighbors: number[] = [];
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

  return { board: { grid, stars }, seed: actualSeed };
}

// Utilities

export function printBoard(board: Board): string {
  return board.grid
    .map((row) =>
      row.map((id) => String.fromCharCode(65 + (id % 26))).join(" "),
    )
    .join("\n");
}
