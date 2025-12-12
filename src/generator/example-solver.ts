import { layout, visualizeGrid } from "./layout";
import {
  initializeSolver,
  solve,
  visualizeSolverBoard,
  type CellState,
} from "./solver";

/**
 * Simple example showing how the solver works
 * This creates a small grid and attempts to solve it
 */

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║         STAR BATTLE SOLVER - SIMPLE EXAMPLE                ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Generate a small 5x5 grid with 1 star per row/column/region
const grid = layout({ size: 5 });

console.log("Generated layout (regions shown with letters):");
console.log(visualizeGrid(grid));

console.log("Region details:");
grid.regions.forEach((region, id) => {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[id];
  console.log(
    `  Region ${char}: ${region.length} cells at ${region.map((c) => `(${c.row},${c.col})`).join(", ")}`
  );
});

console.log("\n" + "─".repeat(60));
console.log("Attempting to solve with production rules...\n");

const solverGrid = initializeSolver(grid, 1); // 1 star per container
const result = solve(solverGrid);

if (result.solved) {
  console.log("✓ SOLVED!\n");
  console.log("Final board (★ = star, · = eliminated, space = should not exist):");
  console.log(visualizeSolverBoard(solverGrid));
  console.log(`\nIterations: ${result.iterations}`);
  console.log(`Total rule applications: ${result.rulesApplied.length}`);
  console.log(`Unique rules used: ${[...new Set(result.rulesApplied)].join(", ")}`);

  // Verify solution
  console.log("\n" + "─".repeat(60));
  console.log("Verification:");

  // Check rows
  let valid = true;
  for (let row = 0; row < grid.size; row++) {
    const stars = solverGrid.board[row].filter((c) => c === "star").length;
    const status = stars === 1 ? "✓" : "✗";
    console.log(`  Row ${row}: ${stars} star(s) ${status}`);
    if (stars !== 1) valid = false;
  }

  // Check columns
  for (let col = 0; col < grid.size; col++) {
    let stars = 0;
    for (let row = 0; row < grid.size; row++) {
      if (solverGrid.board[row][col] === "star") stars++;
    }
    const status = stars === 1 ? "✓" : "✗";
    console.log(`  Col ${col}: ${stars} star(s) ${status}`);
    if (stars !== 1) valid = false;
  }

  // Check regions
  grid.regions.forEach((region, id) => {
    const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[id];
    const stars = region.filter(
      (cell) => solverGrid.board[cell.row][cell.col] === "star"
    ).length;
    const status = stars === 1 ? "✓" : "✗";
    console.log(`  Region ${char}: ${stars} star(s) ${status}`);
    if (stars !== 1) valid = false;
  });

  // Check no adjacent stars
  let adjacentViolations = 0;
  for (let row = 0; row < grid.size; row++) {
    for (let col = 0; col < grid.size; col++) {
      if (solverGrid.board[row][col] === "star") {
        // Check all 8 neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (
              nr >= 0 &&
              nr < grid.size &&
              nc >= 0 &&
              nc < grid.size &&
              solverGrid.board[nr][nc] === "star"
            ) {
              adjacentViolations++;
            }
          }
        }
      }
    }
  }

  if (adjacentViolations > 0) {
    console.log(`  Adjacent stars: ✗ (${adjacentViolations / 2} violations)`);
    valid = false;
  } else {
    console.log("  Adjacent stars: ✓ (none)");
  }

  console.log("\n" + (valid ? "✓ Solution is VALID!" : "✗ Solution is INVALID!"));
} else {
  console.log("✗ Could not solve this grid with current production rules\n");
  console.log("Partial progress:");
  console.log(visualizeSolverBoard(solverGrid));
  console.log(`\nIterations before stuck: ${result.iterations}`);
  console.log(`Rules applied: ${[...new Set(result.rulesApplied)].join(", ")}`);

  console.log("\n" + "─".repeat(60));
  console.log(
    "This grid requires more advanced production rules to solve."
  );
  console.log(
    "See solver.ts - rules marked with 'Placeholder' need implementation."
  );
}

console.log("\n" + "=".repeat(60) + "\n");
