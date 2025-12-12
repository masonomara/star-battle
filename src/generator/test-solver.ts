import { layout, visualizeGrid } from "./layout";
import {
  initializeSolver,
  solve,
  visualizeSolverBoard,
  type SolverGrid,
} from "./solver";
import type { Grid } from "./types";

/**
 * Test the solver with generated grids
 * This will help us understand which grids are solvable with current rules
 */

function testSolver(size: number, starsPerContainer: number, attempts = 100) {
  console.log(
    `\n${"=".repeat(60)}\nTesting ${size}x${size} grid with ${starsPerContainer} stars per container\n${"=".repeat(60)}`
  );

  let solvedCount = 0;
  let totalIterations = 0;
  const ruleUsage = new Map<string, number>();

  for (let i = 0; i < attempts; i++) {
    const grid = layout({ size });
    const solverGrid = initializeSolver(grid, starsPerContainer);
    const result = solve(solverGrid);

    totalIterations += result.iterations;

    if (result.solved) {
      solvedCount++;

      // Track rule usage
      for (const rule of result.rulesApplied) {
        ruleUsage.set(rule, (ruleUsage.get(rule) || 0) + 1);
      }

      // Show first successful solve
      if (solvedCount === 1) {
        console.log("\n✓ First successful solve:");
        console.log("\nGenerated layout:");
        console.log(visualizeGrid(grid));
        console.log("Solved board:");
        console.log(visualizeSolverBoard(solverGrid));
        console.log(`Iterations: ${result.iterations}`);
        console.log(
          `Rules applied: ${result.rulesApplied.length} (${[...new Set(result.rulesApplied)].join(", ")})`
        );
      }
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Results: ${solvedCount}/${attempts} grids solved (${((solvedCount / attempts) * 100).toFixed(1)}%)`);
  console.log(`Average iterations: ${(totalIterations / attempts).toFixed(1)}`);

  if (ruleUsage.size > 0) {
    console.log("\nRule usage frequency:");
    const sortedRules = [...ruleUsage.entries()].sort((a, b) => b[1] - a[1]);
    for (const [rule, count] of sortedRules) {
      console.log(`  ${rule}: ${count} times`);
    }
  }
}

// Test different configurations
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║              STAR BATTLE SOLVER TESTS                      ║");
console.log("╚════════════════════════════════════════════════════════════╝");

// Library puzzles
testSolver(5, 1, 50); // 5x5 with 1 star per container
testSolver(6, 1, 50); // 6x6 with 1 star per container
testSolver(8, 1, 50); // 8x8 with 1 star per container
testSolver(10, 2, 50); // 10x10 with 2 stars per container

// Daily/Weekly/Monthly (fewer attempts - these are harder)
testSolver(14, 3, 20); // 14x14 with 3 stars per container
testSolver(17, 4, 10); // 17x17 with 4 stars per container (DAILY)

console.log("\n" + "=".repeat(60));
console.log("Tests complete!");
console.log("=".repeat(60) + "\n");
