export type CellState = "unknown" | "star" | "marked";

export type Progress = "solved" | "valid" | "invalid";

export type Board = {
  grid: number[][];
  stars: number;
};

export type SolverResult = {
  cells: CellState[][];
  cycles: number;
  maxLevel: number;
};

export type Solution = SolverResult & {
  board: Board;
  seed: number;
};

export type Puzzle = Solution & {
  difficulty: number;
};

export type Coord = [number, number];

export type Tile = {
  cells: Coord[];
  coveredCells: Coord[];
};

export type TilingResult = {
  capacity: number;
  tilings: Tile[][];
  forcedCells: Coord[];
};

export type SieveStats = {
  attempts: number;
  solved: number;
  solverFailed: number;
};

export class GeneratorError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    this.name = "GeneratorError";
  }
}
