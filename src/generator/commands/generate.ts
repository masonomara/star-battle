import type { Puzzle, CellState, Cell, PuzzleCategory } from "../types";
import { PUZZLE_SPECS } from "../types";
import { layout } from "../layout";
import { solve, initializeSolver, getHighestDifficulty } from "../solver";

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

const MAX_ATTEMPTS = 10000;

export function generate(category: PuzzleCategory, seed?: number): Puzzle {
  const { size, stars } = PUZZLE_SPECS[category];
  const baseSeed = seed ?? Date.now();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const grid = layout({ size, seed: baseSeed + attempt });
    const solverGrid = initializeSolver(grid, stars);
    const result = solve(solverGrid);

    if (result.solved) {
      return {
        grid,
        solution: extractStars(result.board),
        difficulty: getHighestDifficulty(result.rulesApplied),
      };
    }
  }

  throw new Error(
    `Failed to generate ${category} puzzle after ${MAX_ATTEMPTS} attempts`
  );
}
