import type {
  Grid,
  CellState,
  Difficulty,
  SolveResult,
  SolverGrid,
  ShapeMeta,
} from "./types";
import { DIFFICULTY_ORDER } from "./types";
import { allRules } from "./rules";

/** Maps rule names to their difficulty for scoring solved puzzles */
export function getHighestDifficulty(rulesApplied: string[]): Difficulty {
  let highest: Difficulty = "easy";
  for (const name of rulesApplied) {
    const rule = allRules.find((r) => r.name === name);
    if (rule && DIFFICULTY_ORDER[rule.difficulty] > DIFFICULTY_ORDER[highest]) {
      highest = rule.difficulty;
    }
  }
  return highest;
}

export function initializeSolver(
  grid: Grid,
  starsPerContainer: number
): SolverGrid {
  const { size, shapes } = grid;
  const board: CellState[][] = Array.from({ length: size }, () =>
    Array(size).fill("empty")
  );
  const shapeMap: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(-1)
  );
  shapes.forEach((shape, id) =>
    shape.forEach((c) => (shapeMap[c.row][c.col] = id))
  );

  // Precompute shape metadata for O(1) row/col span lookups
  const shapeMeta: ShapeMeta[] = shapes.map((shape) => {
    const rows = new Set<number>();
    const cols = new Set<number>();
    for (const c of shape) {
      rows.add(c.row);
      cols.add(c.col);
    }
    return { rows, cols, rowCount: rows.size, colCount: cols.size };
  });

  return {
    grid,
    starsPerContainer,
    board,
    shapeMap,
    shapeMeta,
    tilingCache: new Map(),
  };
}

export function solve(
  g: SolverGrid,
  maxDifficulty: Difficulty = "expert"
): SolveResult {
  const rulesApplied: string[] = [];
  const allowed = allRules
    .filter(
      (r) => DIFFICULTY_ORDER[r.difficulty] <= DIFFICULTY_ORDER[maxDifficulty]
    )
    .sort(
      (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
    );

  const maxIterations = g.grid.size * g.grid.size * 2;
  for (let i = 1; i <= maxIterations; i++) {
    let changed = false;
    for (const rule of allowed)
      if (rule.apply(g)) {
        rulesApplied.push(rule.name);
        changed = true;
        break;
      }
    if (isSolved(g))
      return { solved: true, board: g.board, iterations: i, rulesApplied };
    if (isInvalid(g))
      return { solved: false, board: g.board, iterations: i, rulesApplied };
    if (!changed)
      return { solved: false, board: g.board, iterations: i, rulesApplied };
  }
  return {
    solved: false,
    board: g.board,
    iterations: maxIterations,
    rulesApplied,
  };
}

export function isSolved({
  board,
  grid,
  starsPerContainer: S,
  shapeMap,
}: SolverGrid): boolean {
  const { size, shapes } = grid;
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);
  const shapeStars = new Array(shapes.length).fill(0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === "empty") return false;
      if (board[r][c] === "star") {
        rowStars[r]++;
        colStars[c]++;
        shapeStars[shapeMap[r][c]]++;
      }
    }
  }

  return (
    rowStars.every((n) => n === S) &&
    colStars.every((n) => n === S) &&
    shapeStars.every((n) => n === S)
  );
}

/** Detects impossible states where a container can't reach required stars */
export function isInvalid({
  board,
  grid,
  starsPerContainer: S,
  shapeMap,
}: SolverGrid): boolean {
  const { size, shapes } = grid;
  const rowStars = new Array(size).fill(0);
  const rowEmpty = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);
  const colEmpty = new Array(size).fill(0);
  const shapeStars = new Array(shapes.length).fill(0);
  const shapeEmpty = new Array(shapes.length).fill(0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      const shapeId = shapeMap[r][c];
      if (cell === "star") {
        rowStars[r]++;
        colStars[c]++;
        shapeStars[shapeId]++;
      } else if (cell === "empty") {
        rowEmpty[r]++;
        colEmpty[c]++;
        shapeEmpty[shapeId]++;
      }
    }
  }

  // Check rows: too many stars, or not enough cells to place remaining stars
  for (let r = 0; r < size; r++) {
    if (rowStars[r] > S) return true;
    if (rowStars[r] + rowEmpty[r] < S) return true;
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    if (colStars[c] > S) return true;
    if (colStars[c] + colEmpty[c] < S) return true;
  }

  // Check shapes
  for (let i = 0; i < shapes.length; i++) {
    if (shapeStars[i] > S) return true;
    if (shapeStars[i] + shapeEmpty[i] < S) return true;
  }

  return false;
}

export const canSolveWith = (
  grid: Grid,
  maxDifficulty: Difficulty,
  starsPerContainer = 1
): boolean =>
  solve(initializeSolver(grid, starsPerContainer), maxDifficulty).solved;
