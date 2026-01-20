import { Board, CellState, Solution, TilingCache } from "./types";
import {
  trivialStarMarks,
  trivialRowComplete,
  trivialColComplete,
  trivialRegionComplete,
  forcedPlacement,
  twoByTwoTiling,
  oneByNConfinement,
  exclusion,
} from "./rules";
import { computeAllTilings } from "./tiling";

/**
 * Check if a board layout is valid before attempting to solve.
 * For multi-star puzzles (stars > 1), each region must have at least
 * (stars * 2) - 1 cells to fit the required stars without touching.
 */
export function isValidLayout(board: Board): boolean {
  if (board.stars <= 1) return true;

  const minRegionSize = board.stars * 2 - 1;
  const regionSizes = new Map<number, number>();

  for (const row of board.grid) {
    for (const regionId of row) {
      regionSizes.set(regionId, (regionSizes.get(regionId) ?? 0) + 1);
    }
  }

  for (const size of regionSizes.values()) {
    if (size < minRegionSize) return false;
  }

  return true;
}

type Rule = (
  board: Board,
  cells: CellState[][],
  cache?: TilingCache,
) => boolean;

const allRules: { rule: Rule; level: number; name: string }[] = [
  { rule: trivialStarMarks, level: 1, name: "starNeighbors" },
  { rule: trivialRowComplete, level: 1, name: "rowComplete" },
  { rule: trivialColComplete, level: 1, name: "colComplete" },
  { rule: trivialRegionComplete, level: 1, name: "regionComplete" },
  { rule: forcedPlacement, level: 1, name: "forcedPlacement" },
  { rule: twoByTwoTiling, level: 2, name: "twoByTwoTiling" },
  { rule: oneByNConfinement, level: 2, name: "oneByNConfinement" },
  { rule: exclusion, level: 2, name: "exclusion" },
];

/** Reason why a solve attempt failed */
export type StuckReason = "invalid_layout" | "invalid_state" | "no_progress" | "max_cycles";

/** Info about a stuck solve attempt */
export interface StuckState {
  board: Board;
  cells: CellState[][];
  cycles: number;
  maxLevel: number;
  lastRule: string | null;
  reason: StuckReason;
}

const MAX_CYCLES = 1000;

/**
 * Check if the puzzle has reached an invalid state.
 * Returns true if any row, column, or region has all cells marked
 * without having placed enough stars.
 */
export function isInvalid(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  // Check rows
  for (let row = 0; row < size; row++) {
    let stars = 0;
    let unknown = 0;
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknown++;
    }
    if (unknown === 0 && stars < board.stars) return true;
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    let stars = 0;
    let unknown = 0;
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknown++;
    }
    if (unknown === 0 && stars < board.stars) return true;
  }

  // Check regions
  const regionStats = new Map<number, { stars: number; unknown: number }>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (!regionStats.has(regionId)) {
        regionStats.set(regionId, { stars: 0, unknown: 0 });
      }
      const stats = regionStats.get(regionId)!;
      if (cells[row][col] === "star") stats.stars++;
      else if (cells[row][col] === "unknown") stats.unknown++;
    }
  }
  for (const stats of regionStats.values()) {
    if (stats.unknown === 0 && stats.stars < board.stars) return true;
  }

  return false;
}

/**
 * Check if the puzzle is completely solved.
 */
export function isSolved(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  const starsByRow = new Array(size).fill(0);
  const starsByCol = new Array(size).fill(0);
  const starsByRegion = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        starsByRow[row]++;
        starsByCol[col]++;

        const regionId = board.grid[row][col];
        starsByRegion.set(regionId, (starsByRegion.get(regionId) ?? 0) + 1);

        // Check for adjacent stars (orthogonal and diagonal)
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (cells[nr][nc] === "star") return false;
            }
          }
        }
      }
    }
  }

  // All rows and cols must have exactly board.stars
  for (let i = 0; i < size; i++) {
    if (starsByRow[i] !== board.stars) return false;
    if (starsByCol[i] !== board.stars) return false;
  }

  // All regions must have exactly board.stars
  for (const count of starsByRegion.values()) {
    if (count !== board.stars) return false;
  }

  return true;
}

/** Result of a solve attempt */
export type SolveResult =
  | { solved: true; solution: Solution }
  | { solved: false; stuck: StuckState };

/** Step info passed to trace callback */
export interface StepInfo {
  cycle: number;
  rule: string;
  level: number;
  cells: CellState[][];
}

export interface SolveOptions {
  onStep?: (step: StepInfo) => void;
}

/**
 * Attempt to solve a Star Battle puzzle using production rules.
 * Returns detailed result including stuck state if unsolved.
 */
export function solveWithDetails(
  board: Board,
  seed: number,
  options: SolveOptions = {},
): SolveResult {
  const size = board.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );

  // Early rejection for invalid layouts
  if (!isValidLayout(board)) {
    return {
      solved: false,
      stuck: { board, cells, cycles: 0, maxLevel: 0, lastRule: null, reason: "invalid_layout" },
    };
  }

  let cycles = 0;
  let maxLevel = 0;
  let lastRule: string | null = null;

  while (cycles < MAX_CYCLES) {
    cycles++;

    // Check for invalid state (dead row/col/region)
    if (isInvalid(board, cells)) {
      return {
        solved: false,
        stuck: { board, cells, cycles, maxLevel, lastRule, reason: "invalid_state" },
      };
    }

    if (isSolved(board, cells)) {
      return {
        solved: true,
        solution: { board, seed, cells, cycles, maxLevel },
      };
    }

    // Try each rule in order
    let progress = false;
    let cache: TilingCache | undefined;

    for (const { rule, level, name } of allRules) {
      // Compute cache lazily when first level 2+ rule is tried
      if (level >= 2 && !cache) {
        cache = computeAllTilings(board, cells);
      }

      if (rule(board, cells, cache)) {
        maxLevel = Math.max(maxLevel, level);
        lastRule = name;
        progress = true;

        // Call trace callback if provided
        if (options.onStep) {
          const cellsCopy = cells.map((row) => [...row]);
          options.onStep({
            cycle: cycles,
            rule: name,
            level,
            cells: cellsCopy,
          });
        }

        break;
      }
    }

    // No rule made progress - puzzle is stuck
    if (!progress) {
      return {
        solved: false,
        stuck: { board, cells, cycles, maxLevel, lastRule, reason: "no_progress" },
      };
    }
  }

  // Exceeded max cycles
  return {
    solved: false,
    stuck: { board, cells, cycles, maxLevel, lastRule, reason: "max_cycles" },
  };
}

/**
 * Attempt to solve a Star Battle puzzle using production rules.
 * Returns Solution if solved, null if unsolvable or stuck.
 */
export function solve(board: Board, seed: number): Solution | null {
  const result = solveWithDetails(board, seed);
  return result.solved ? result.solution : null;
}
