import type { Puzzle, CellState, Cell, PuzzleCategory, Grid, Rule } from "../types";
import { PUZZLE_SPECS, DIFFICULTY_ORDER } from "../types";
import { layout, visualizeGrid } from "../layout";
import {
  initializeSolver,
  isSolved,
  isInvalid,
  getHighestDifficulty,
} from "../solver";
import { allRules } from "../rules";

function extractStars(board: CellState[][]): Cell[] {
  const stars: Cell[] = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === "star") {
        stars.push({ row, col });
      }
    }
  }
  return stars;
}

function visualizeSolution(grid: Grid, board: CellState[][]): string {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const shapeMap: number[][] = Array.from({ length: grid.size }, () =>
    Array(grid.size).fill(-1)
  );
  grid.shapes.forEach((shape, id) =>
    shape.forEach((c) => (shapeMap[c.row][c.col] = id))
  );
  return board
    .map((row, r) =>
      row
        .map((cell, c) => {
          if (cell === "star") return "*";
          return labels[shapeMap[r][c]] || "?";
        })
        .join(" ")
    )
    .join("\n");
}

const MAX_ATTEMPTS = 10000;

export function generateVerbose(
  category: PuzzleCategory,
  seed?: number
): Puzzle {
  const { size, stars } = PUZZLE_SPECS[category];
  const baseSeed = seed ?? Date.now();

  console.log(`\n========================================`);
  console.log(`Generating: ${category} (${size}x${size}, ${stars}-star)`);
  console.log(`========================================\n`);

  const allowed: Rule[] = [...allRules].sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
  );
  console.log(`Solver has ${allowed.length} rules available:`);
  allowed.forEach((r: Rule, i: number) =>
    console.log(`  ${i + 1}. [${r.difficulty}] ${r.name}`)
  );
  console.log();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const grid = layout({ size, seed: baseSeed + attempt });

    console.log(`--- Attempt ${attempt} ---`);
    console.log(visualizeGrid(grid));

    const solverGrid = initializeSolver(grid, stars);
    const maxIterations = size * size * 2;
    const rulesApplied: string[] = [];
    let iterations = 0;
    let solved = false;
    let invalid = false;
    let stalled = false;

    for (let i = 1; i <= maxIterations; i++) {
      let changed = false;
      for (const rule of allowed) {
        if (rule.apply(solverGrid)) {
          rulesApplied.push(rule.name);
          changed = true;
          break;
        }
      }
      iterations = i;
      if (isSolved(solverGrid)) {
        solved = true;
        break;
      }
      if (isInvalid(solverGrid)) {
        invalid = true;
        break;
      }
      if (!changed) {
        stalled = true;
        break;
      }
    }

    const starsPlaced = extractStars(solverGrid.board).length;
    const cellsEliminated = solverGrid.board
      .flat()
      .filter((c) => c === "eliminated").length;
    const cellsRemaining = solverGrid.board
      .flat()
      .filter((c) => c === "empty").length;

    console.log(
      `  Result: ${
        solved
          ? "SOLVED"
          : invalid
          ? "INVALID"
          : stalled
          ? "STALLED"
          : "MAX_ITER"
      }`
    );
    console.log(
      `  Iterations: ${iterations}, Rules applied: ${rulesApplied.length}`
    );
    console.log(
      `  Stars: ${starsPlaced}/${
        size * stars
      }, Eliminated: ${cellsEliminated}, Empty: ${cellsRemaining}`
    );
    if (rulesApplied.length > 0) {
      const ruleCounts: Record<string, number> = {};
      rulesApplied.forEach((r) => (ruleCounts[r] = (ruleCounts[r] || 0) + 1));
      console.log(`  Rule usage:`, ruleCounts);
    }
    console.log();

    if (solved) {
      console.log(`SUCCESS on attempt ${attempt}!`);
      console.log(`Difficulty: ${getHighestDifficulty(rulesApplied)}\n`);
      console.log(`Layout:`);
      console.log(visualizeGrid(grid));
      console.log(`\nSolution (stars marked with *):`);
      console.log(visualizeSolution(grid, solverGrid.board));
      return {
        grid,
        solution: extractStars(solverGrid.board),
        difficulty: getHighestDifficulty(rulesApplied),
      };
    }
  }

  throw new Error(
    `Failed to generate ${category} puzzle after ${MAX_ATTEMPTS} attempts`
  );
}

// CLI entry point
const args = (globalThis as any).process?.argv || [];
const category = (args[2] || "library-5x5-1star") as PuzzleCategory;
generateVerbose(category);
