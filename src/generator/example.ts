// This is going to be replaced by tests soon

import { layout, visualizeGrid } from "./layout";
import type { Grid } from "./types";

function printGrid(size: number, label: string) {
  const grid = layout({ size });
  console.log(`\n=== ${label} ===`);
  console.log(visualizeGrid(grid));
  console.log(
    `Regions: ${grid.regions.length}, sizes: ${grid.regions
      .map((r) => r.length)
      .join(", ")}`
  );
  return grid;
}

function verifyGrid(grid: Grid): boolean {
  const { size, regions } = grid;
  if (regions.length !== size) return false;

  const totalCells = regions.reduce((sum, r) => sum + r.length, 0);
  if (totalCells !== size * size) return false;

  const seen = new Set<string>();
  for (const region of regions) {
    for (const cell of region) {
      const key = `${cell.row},${cell.col}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return true;
}

console.log("╔════════════════════════════════════════╗");
console.log("║         LIBRARY PUZZLES                ║");
console.log("╚════════════════════════════════════════╝");

const grids = [
  printGrid(5, "5x5 (1-star)"),
  printGrid(6, "6x6 (1-star)"),
  printGrid(8, "8x8 (1-star)"),
  printGrid(10, "10x10 (2-star)"),
  printGrid(14, "14x14 (3-star)"),
];

console.log("\n╔════════════════════════════════════════╗");
console.log("║      DAILY/WEEKLY/MONTHLY PUZZLES      ║");
console.log("╚════════════════════════════════════════╝");

grids.push(
  printGrid(17, "17x17 (4-star, DAILY)"),
  printGrid(21, "21x21 (5-star, WEEKLY)"),
  printGrid(25, "25x25 (6-star, MONTHLY)")
);

console.log("\n╔════════════════════════════════════════╗");
console.log("║          VERIFICATION                  ║");
console.log("╚════════════════════════════════════════╝\n");

grids.forEach((g, i) =>
  console.log(`Grid ${i + 1}: ${verifyGrid(g) ? "✓" : "✗"}`)
);
