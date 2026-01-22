import { Board, CellState, Solution } from "./helpers/types";
import trivialNeighbors from "./rules/01-trivialNeighbors/trivialNeighbors";
import trivialRows from "./rules/02-trivialRows/trivialRows";
import trivialColumns from "./rules/03-trivialColumns/trivialColumns";
import trivialRegions from "./rules/04-trivialRegions/trivialRegions";
import forcedPlacement from "./rules/05-forcedPlacement/forcedPlacement";
import twoByTwoTiling from "./rules/06-twoByTwoTiling/twoByTwoTiling";

/**
 * Check if a board layout is valid before attempting to solve.
 * Validates:
 * - Exactly `size` distinct regions exist
 * - For multi-star puzzles (stars > 1), each region has at least
 *   (stars * 2) - 1 cells to fit the required stars without touching.
 */
export function isValidLayout(board: Board): boolean {
  const size = board.grid.length;
  const minRegionSize = board.stars > 1 ? board.stars * 2 - 1 : 1;
  const regionSizes = new Map<number, number>();

  for (const row of board.grid) {
    for (const regionId of row) {
      regionSizes.set(regionId, (regionSizes.get(regionId) ?? 0) + 1);
    }
  }

  // Must have exactly `size` regions
  if (regionSizes.size !== size) return false;

  // Each region must meet minimum size requirement
  for (const regionSize of regionSizes.values()) {
    if (regionSize < minRegionSize) return false;
  }

  return true;
}

type Rule = (board: Board, cells: CellState[][]) => boolean;

const allRules: { rule: Rule; level: number; name: string }[] = [
  { rule: trivialNeighbors, level: 1, name: "starNeighbors" },
  { rule: trivialRows, level: 1, name: "rowComplete" },
  { rule: trivialColumns, level: 1, name: "colComplete" },
  { rule: trivialRegions, level: 1, name: "regionComplete" },
  { rule: forcedPlacement, level: 1, name: "forcedPlacement" },
  { rule: twoByTwoTiling, level: 2, name: "twoByTwoTiling" },
];

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
 * Accepts optional onStep callback for tracing.
 */
export function solve(
  board: Board,
  seed: number,
  options: SolveOptions = {},
): Solution | null {
  const size = board.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );

  // Early rejection for invalid layouts
  if (!isValidLayout(board)) {
    return null;
  }

  let cycles = 0;
  let maxLevel = 0;

  while (cycles < MAX_CYCLES) {
    cycles++;

    if (isSolved(board, cells)) {
      return { board, seed, cells, cycles, maxLevel };
    }

    let progress = false;

    for (const { rule, level, name } of allRules) {
      if (rule(board, cells)) {
        maxLevel = Math.max(maxLevel, level);
        progress = true;

        if (options.onStep) {
          options.onStep({
            cycle: cycles,
            rule: name,
            level,
            cells: cells.map((row) => [...row]),
          });
        }

        break;
      }
    }

    // No rule made progress - stuck
    if (!progress) {
      return null;
    }
  }

  // Exceeded max cycles
  return null;
}
