import { layout, visualizeGrid } from "./layout";
import { initializeSolver, solve, visualizeSolverBoard } from "./solver";

function verify(
  solverGrid: ReturnType<typeof initializeSolver>,
  starsPerContainer: number
) {
  const { board, grid } = solverGrid;
  const { size } = grid;
  let valid = true;

  for (let row = 0; row < size; row++) {
    const stars = board[row].filter((c) => c === "star").length;
    console.log(`  Row ${row}: ${stars === starsPerContainer ? "✓" : "✗"}`);
    if (stars !== starsPerContainer) valid = false;
  }

  for (let col = 0; col < size; col++) {
    const stars = board.filter((row) => row[col] === "star").length;
    console.log(`  Col ${col}: ${stars === starsPerContainer ? "✓" : "✗"}`);
    if (stars !== starsPerContainer) valid = false;
  }

  grid.shapes.forEach((shape, id) => {
    const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[id];
    const stars = shape.filter(
      (cell) => board[cell.row][cell.col] === "star"
    ).length;
    console.log(`  Shape ${char}: ${stars === starsPerContainer ? "✓" : "✗"}`);
    if (stars !== starsPerContainer) valid = false;
  });

  let adjacentViolations = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === "star") {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr,
              nc = col + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              board[nr][nc] === "star"
            ) {
              adjacentViolations++;
            }
          }
        }
      }
    }
  }

  console.log(
    `  Adjacent: ${
      adjacentViolations > 0 ? `✗ (${adjacentViolations / 2} violations)` : "✓"
    }`
  );
  if (adjacentViolations > 0) valid = false;

  return valid;
}

function testSolver(size: number, starsPerContainer: number, attempts = 100) {
  console.log(
    `\n${"=".repeat(
      60
    )}\nTesting ${size}x${size}, ${starsPerContainer} stars\n${"=".repeat(60)}`
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
      result.rulesApplied.forEach((r) =>
        ruleUsage.set(r, (ruleUsage.get(r) || 0) + 1)
      );

      if (solvedCount === 1) {
        console.log("\n✓ First solve:\n\nLayout:");
        console.log(visualizeGrid(grid));
        console.log(`\nShapes:`);
        grid.shapes.forEach((shape, id) => {
          const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[id];
          console.log(`  ${char}: ${shape.length} cells`);
        });
        console.log("\nSolution:");
        console.log(visualizeSolverBoard(solverGrid));
        console.log(`\nIterations: ${result.iterations}`);
        console.log(`Rules: ${[...new Set(result.rulesApplied)].join(", ")}`);
        console.log(`\nVerification:`);
        const valid = verify(solverGrid, starsPerContainer);
        console.log(valid ? "✓ VALID" : "✗ INVALID");
      }
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(
    `${solvedCount}/${attempts} solved (${(
      (solvedCount / attempts) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`Avg iterations: ${(totalIterations / attempts).toFixed(1)}`);

  if (ruleUsage.size > 0) {
    console.log("\nRule usage:");
    [...ruleUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([r, c]) => console.log(`  ${r}: ${c}`));
  }
}

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║              STAR BATTLE SOLVER TESTS                      ║");
console.log("╚════════════════════════════════════════════════════════════╝");

testSolver(5, 1, 50);
testSolver(6, 1, 50);
testSolver(8, 1, 50);
testSolver(10, 2, 50);
testSolver(14, 3, 20);
testSolver(17, 4, 10);

console.log("\n" + "=".repeat(60));
console.log("Tests complete!");
console.log("=".repeat(60) + "\n");
