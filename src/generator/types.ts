export type Cell = { row: number; col: number };
export type Shape = Cell[];
export type Grid = { size: number; shapes: Shape[] };

export type LayoutConfig = { size: number; seed?: number };

export type CellState = "empty" | "star" | "eliminated";
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  expert: 3,
};

export type Rule = {
  name: string;
  difficulty: Difficulty;
  apply: (grid: SolverGrid) => boolean;
};

export type SolveResult = {
  solved: boolean;
  board: CellState[][];
  iterations: number;
  rulesApplied: string[];
};

export type PuzzleCategory =
  | "library-5x5-1star"
  | "library-6x6-1star"
  | "library-8x8-1star"
  | "library-10x10-2star"
  | "library-14x14-3star"
  | "daily"
  | "weekly"
  | "monthly";

export type PuzzleSpec = {
  size: number;
  stars: number;
};

export const PUZZLE_SPECS: Record<PuzzleCategory, PuzzleSpec> = {
  "library-5x5-1star": { size: 5, stars: 1 },
  "library-6x6-1star": { size: 6, stars: 1 },
  "library-8x8-1star": { size: 8, stars: 1 },
  "library-10x10-2star": { size: 10, stars: 2 },
  "library-14x14-3star": { size: 14, stars: 3 },
  daily: { size: 17, stars: 4 },
  weekly: { size: 21, stars: 5 },
  monthly: { size: 25, stars: 6 },
};

export type Puzzle = {
  grid: Grid;
  solution: Cell[];
  difficulty: Difficulty;
};

export type OneByNMarker = {
  cells: Cell[];
  row: number | null;
  col: number | null;
  min: number;
  max: number;
};

export type ShapeMeta = {
  rows: Set<number>;
  cols: Set<number>;
  rowCount: number;
  colCount: number;
};

export type TilingResult = {
  maxStars: number;
  tiles: Cell[][];
  uncoveredCells: Cell[];
};

export type SolverGrid = {
  grid: Grid;
  starsPerContainer: number;
  board: CellState[][];
  shapeMap: number[][];
  shapeMeta: ShapeMeta[];
  oneByNs?: OneByNMarker[];
  starContaining2x2s?: Cell[][];
  tilingCache: Map<string, TilingResult>;
  shapeCellSets?: Map<number, Set<number>>;
};
