// Position on the board
export type Position = {
  row: number;
  col: number;
};

// Cell state during solving
export type CellState = "unknown" | "star" | "marked";

// Board layout - output of generator, input to solver
export type Board = {
  grid: number[][]; // grid[row][col] = regionId
  stars: number; // stars per row/col/region
  seed: number;
};
