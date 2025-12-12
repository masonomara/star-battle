import type { Grid } from "./types";

export type CellState = "empty" | "star" | "eliminated";

export type Difficulty = "easy" | "medium" | "hard";

export type Rule = {
  name: string;
  difficulty: Difficulty;
  apply: (grid: SolverGrid) => boolean;
};

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export const rules: Rule[] = [];

export type SolverGrid = {
  grid: Grid;
  starsPerContainer: number;
  board: CellState[][];
  shapeMap: number[][];
};

export type SolveResult = {
  solved: boolean;
  board: CellState[][];
  iterations: number;
  rulesApplied: string[];
};

export function initializeSolver(
  grid: Grid,
  starsPerContainer: number
): SolverGrid {
  const { size, shapes } = grid;
  const board: CellState[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill("empty"));
  const shapeMap: number[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(-1));

  shapes.forEach((shape, shapeId) => {
    shape.forEach((cell) => {
      shapeMap[cell.row][cell.col] = shapeId;
    });
  });

  return { grid, starsPerContainer, board, shapeMap };
}

export function solve(
  solverGrid: SolverGrid,
  maxDifficulty: Difficulty = "hard"
): SolveResult {
  const rulesApplied: string[] = [];
  let iterations = 0;
  const MAX_ITERATIONS = 10000;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const changed = applyAllRules(solverGrid, rulesApplied, maxDifficulty);

    if (isSolved(solverGrid)) {
      return {
        solved: true,
        board: solverGrid.board,
        iterations,
        rulesApplied,
      };
    }

    if (!changed) {
      return {
        solved: false,
        board: solverGrid.board,
        iterations,
        rulesApplied,
      };
    }
  }

  return { solved: false, board: solverGrid.board, iterations, rulesApplied };
}

function applyAllRules(
  solverGrid: SolverGrid,
  rulesApplied: string[],
  maxDifficulty: Difficulty = "hard"
): boolean {
  const maxLevel = DIFFICULTY_ORDER[maxDifficulty];
  const allowedRules = rules.filter(
    (rule) => DIFFICULTY_ORDER[rule.difficulty] <= maxLevel
  );

  for (const rule of allowedRules) {
    if (rule.apply(solverGrid)) {
      rulesApplied.push(rule.name);
      return true;
    }
  }

  return false;
}

function isSolved(solverGrid: SolverGrid): boolean {
  const { board, grid, starsPerContainer } = solverGrid;
  const { size } = grid;

  for (let row = 0; row < size; row++) {
    if (
      board[row].filter((cell) => cell === "star").length !== starsPerContainer
    )
      return false;
  }

  for (let col = 0; col < size; col++) {
    let stars = 0;
    for (let row = 0; row < size; row++) {
      if (board[row][col] === "star") stars++;
    }
    if (stars !== starsPerContainer) return false;
  }

  for (const shape of grid.shapes) {
    const stars = shape.filter(
      (cell) => board[cell.row][cell.col] === "star"
    ).length;
    if (stars !== starsPerContainer) return false;
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === "empty") return false;
    }
  }

  return true;
}

export function visualizeSolverBoard(solverGrid: SolverGrid): string {
  return solverGrid.board
    .map((row) =>
      row
        .map((cell) => {
          if (cell === "star") return "★";
          if (cell === "eliminated") return "·";
          return " ";
        })
        .join(" ")
    )
    .join("\n");
}

export function canSolveWith(
  grid: Grid,
  maxDifficulty: Difficulty,
  starsPerContainer: number = 1
): boolean {
  const solverGrid = initializeSolver(grid, starsPerContainer);
  const result = solve(solverGrid, maxDifficulty);
  return result.solved;
}
