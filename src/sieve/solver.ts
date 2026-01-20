import { Board, CellState, Solution } from "./types";
import {
  trivialStarMarks,
  trivialRowComplete,
  trivialColComplete,
  trivialRegionComplete,
  forcedPlacement,
  twoByTwoTiling,
} from "./rules";

type Rule = (board: Board, cells: CellState[][]) => boolean;

const allRules: { rule: Rule; level: number; name: string }[] = [
  { rule: trivialStarMarks, level: 1, name: "starNeighbors" },
  { rule: trivialRowComplete, level: 1, name: "rowComplete" },
  { rule: trivialColComplete, level: 1, name: "colComplete" },
  { rule: trivialRegionComplete, level: 1, name: "regionComplete" },
  { rule: forcedPlacement, level: 1, name: "forcedPlacement" },
  { rule: twoByTwoTiling, level: 2, name: "twoByTwoTiling" },
];

/** Info about a stuck solve attempt */
export interface StuckState {
  board: Board;
  cells: CellState[][];
  cycles: number;
  maxLevel: number;
  lastRule: string | null;
}

const MAX_CYCLES = 1000;

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

/**
 * Attempt to solve a Star Battle puzzle using production rules.
 * Returns detailed result including stuck state if unsolved.
 */
export function solveWithDetails(board: Board, seed: number): SolveResult {
  const size = board.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );
  let cycles = 0;
  let maxLevel = 0;
  let lastRule: string | null = null;

  while (cycles < MAX_CYCLES) {
    cycles++;

    if (isSolved(board, cells)) {
      return {
        solved: true,
        solution: { board, seed, cells, cycles, maxLevel },
      };
    }

    // Try each rule in order
    let progress = false;
    for (const { rule, level, name } of allRules) {
      if (rule(board, cells)) {
        maxLevel = Math.max(maxLevel, level);
        lastRule = name;
        progress = true;
        break;
      }
    }

    // No rule made progress - puzzle is stuck
    if (!progress) {
      return {
        solved: false,
        stuck: { board, cells, cycles, maxLevel, lastRule },
      };
    }
  }

  // Exceeded max cycles
  return {
    solved: false,
    stuck: { board, cells, cycles, maxLevel, lastRule },
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
