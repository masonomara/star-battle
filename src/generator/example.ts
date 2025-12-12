import { layout, visualizeGrid } from "./layout";

// Example: Generate different grid sizes
console.log("=== 5x5 Grid (1-star, Library) ===");
const grid5x5 = layout({ size: 5 });
console.log(visualizeGrid(grid5x5));
console.log(`Regions: ${grid5x5.regions.length}`);
console.log(
  `Region sizes: ${grid5x5.regions.map((r) => r.length).join(", ")}\n`
);

console.log("=== 8x8 Grid (1-star, Library) ===");
const grid8x8 = layout({ size: 8 });
console.log(visualizeGrid(grid8x8));
console.log(`Regions: ${grid8x8.regions.length}`);
console.log(
  `Region sizes: ${grid8x8.regions.map((r) => r.length).join(", ")}\n`
);

console.log("=== 10x10 Grid (2-star, Library) ===");
const grid10x10 = layout({ size: 10 });
console.log(visualizeGrid(grid10x10));
console.log(`Regions: ${grid10x10.regions.length}`);
console.log(
  `Region sizes: ${grid10x10.regions.map((r) => r.length).join(", ")}\n`
);

console.log("=== 17x17 Grid (4-star, Daily) ===");
const grid17x17 = layout({ size: 17 });
console.log(visualizeGrid(grid17x17));
console.log(`Regions: ${grid17x17.regions.length}`);
console.log(
  `Region sizes: ${grid17x17.regions.map((r) => r.length).join(", ")}\n`
);

// Example: Verify grid properties
function verifyGrid(grid: typeof grid5x5): boolean {
  const { size, regions } = grid;

  // Check region count
  if (regions.length !== size) {
    console.error(`Expected ${size} regions, got ${regions.length}`);
    return false;
  }

  // Check total cell count
  const totalCells = regions.reduce((sum, region) => sum + region.length, 0);
  if (totalCells !== size * size) {
    console.error(`Expected ${size * size} cells, got ${totalCells}`);
    return false;
  }

  // Check for duplicate cells
  const cellSet = new Set<string>();
  for (const region of regions) {
    for (const cell of region) {
      const key = `${cell.row},${cell.col}`;
      if (cellSet.has(key)) {
        console.error(`Duplicate cell found: ${key}`);
        return false;
      }
      cellSet.add(key);
    }
  }

  console.log("✓ Grid verification passed");
  return true;
}

console.log("=== Verification ===");
verifyGrid(grid5x5);
verifyGrid(grid10x10);
verifyGrid(grid17x17);
