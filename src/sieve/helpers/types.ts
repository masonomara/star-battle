// Cell state during solving
export type CellState = "unknown" | "star" | "marked";

// Solving progress status
export type Progress = "solved" | "valid" | "invalid";

// Board layout - output of generator, input to solver
export type Board = {
  grid: number[][]; // grid[row][col] = regionId
  stars: number; // stars per row/col/region
};

// Solver output - what the solver actually computes
export type SolverResult = {
  cells: CellState[][];
  cycles: number;
  maxLevel: number;
};

// Complete solution with generation metadata
export type Solution = SolverResult & {
  board: Board;
  seed: number;
};

// Final puzzle with difficulty - output of sieve
export type Puzzle = Solution & {
  difficulty: number;
};

// Coordinate tuple [row, col]
export type Coord = [number, number];

// A 2×2 tile anchored at top-left corner
export type Tile = {
  anchor: Coord; // top-left corner (row, col)
  cells: Coord[]; // all 4 cells of the 2×2 (may extend outside region)
  coveredCells: Coord[]; // cells within the target region/area
};

// Pure algorithm output from tiling computation
export type TilingResult = {
  capacity: number; // max stars that fit (= min tiles needed)
  tilings: Tile[][]; // all minimal tilings
  forcedCells: Coord[]; // cells that are single-coverage in ALL tilings
};

// A 1×n (horizontal) or n×1 (vertical) strip of unknown cells within a single region
export type Strip = {
  regionId: number;
  orientation: "horizontal" | "vertical";
  anchor: Coord; // starting cell (top-left)
  cells: Coord[]; // all cells in the strip
  starsNeeded: number; // stars this region still needs
};

// Cache of all strips for the current board state
export type StripCache = {
  byRegion: Map<number, Strip[]>; // regionId → all strips from that region
};

// Failure reasons during puzzle generation
export type FailureReason =
  | "generator_stuck"
  | "solver_failed"
  | "invalid_tiling";

// Statistics from sieve operation
export type SieveStats = {
  attempts: number;
  failures: Record<FailureReason, number>;
};

// Typed error for generator failures
export class GeneratorError extends Error {
  constructor(
    message: string,
    public readonly reason: FailureReason,
  ) {
    super(message);
    this.name = "GeneratorError";
  }
}
