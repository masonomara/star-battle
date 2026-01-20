// Cell state during solving
export type CellState = "unknown" | "star" | "marked";

// Board layout - output of generator, input to solver
export type Board = {
  grid: number[][]; // grid[row][col] = regionId
  stars: number; // stars per row/col/region
};

// Solved puzzle - output of solver
export type Solution = {
  board: Board;
  seed: number;
  cells: CellState[][];
  cycles: number;
  maxLevel: number;
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

// Result of tiling a single region/area
export type RegionTiling = {
  regionId: number; // -1 for composite regions
  cells: Coord[]; // all cells in the region
  candidates: Tile[]; // all valid 2×2 positions
  minTileCount: number; // minimum tiles needed to cover
  allMinimalTilings: Tile[][]; // every tiling achieving minimum
};

// Cache of all region tilings for the current board state
export type TilingCache = {
  byRegion: Map<number, RegionTiling>;
  byRowPair: Map<number, RegionTiling>; // key = first row index
  byColPair: Map<number, RegionTiling>; // key = first col index
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
  byRow: Map<number, Strip[]>; // row index → horizontal strips in that row
  byCol: Map<number, Strip[]>; // col index → vertical strips in that column
  byRegion: Map<number, Strip[]>; // regionId → all strips from that region
};
