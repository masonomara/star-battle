// Cell state during solving
export type CellState = "unknown" | "star" | "marked";

// Board layout - output of generator, input to solver
export type Board = {
  grid: number[][]; // grid[row][col] = regionId
  stars: number; // stars per row/col/region
};

// Result from solve attempt
export type SolveResult = {
  solved: boolean;
  cells: CellState[][]; // final state
  cycles: number; // deduction rounds
  maxLevel: number; // highest rule level used (1-5)
};

// Validated puzzle - output of generator pipeline
export type Puzzle = {
  board: Board;
  seed: number;
  difficulty: number;
  solution: CellState[][];
};
