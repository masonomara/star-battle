export type CellState = "unknown" | "star" | "marked";

export type Progress = "solved" | "valid" | "invalid";

export type Board = {
  grid: number[][];
  stars: number;
};

export function computeDifficulty(maxLevel: number, cycles: number): number {
  return Math.round(maxLevel * 4 + cycles / 4);
}

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

export type Deduction = {
  coord: Coord;
  state: "star" | "marked";
};

export type Tile = {
  cells: Coord[];
  coveredCells: Coord[];
};

export type TilingResult = {
  capacity: number;
  tilings: Tile[][];
  forcedCells: Coord[];
};

export type FailureReason =
  | "generator_stuck"
  | "solver_failed"
  | "invalid_tiling";

export type SieveStats = {
  attempts: number;
  failures: Record<FailureReason, number>;
};

export class GeneratorError extends Error {
  constructor(
    message: string,
    public readonly reason: FailureReason,
  ) {
    super(message);
    this.name = "GeneratorError";
  }
}
