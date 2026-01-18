// Cell state during solving
export type CellState = "unknown" | "star" | "marked";

// Board layout - output of generator, input to solver
export type Board = {
  grid: number[][]; // grid[row][col] = regionId
  stars: number; // stars per row/col/region
};

// Validated puzzle - output of solver
export type Puzzle = {
  board: Board;
  seed: number;
  difficulty: number;
  solution: CellState[][];
};
