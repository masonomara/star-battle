import { Board, CellState, Solution } from "./types";
import {
  trivialStarMarks,
  trivialRowComplete,
  trivialColComplete,
  trivialRegionComplete,
  forcedPlacement,
} from "./rules";

type Rule = (board: Board, cells: CellState[][]) => boolean;

const allRules: { rule: Rule; level: number }[] = [
  { rule: trivialStarMarks, level: 1 },
  { rule: trivialRowComplete, level: 1 },
  { rule: trivialColComplete, level: 1 },
  { rule: trivialRegionComplete, level: 1 },
  { rule: forcedPlacement, level: 1 },
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

/**
 * Attempt to solve a Star Battle puzzle using production rules.
 * Returns Solution if solved, null if unsolvable or stuck.
 */
export function solve(board: Board, seed: number): Solution | null {
  const size = board.grid.length;
  let cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );
  let cycles = 0;
  let maxLevel = 0;

  while (cycles < MAX_CYCLES) {
    cycles++;

    if (isSolved(board, cells)) {
      return { board, seed, cells, cycles, maxLevel };
    }

    // Try each rule in order
    let progress = false;
    for (const { rule, level } of allRules) {
      if (rule(board, cells)) {
        maxLevel = Math.max(maxLevel, level);
        progress = true;
        break;
      }
    }

    // No rule made progress - puzzle is stuck
    if (!progress) {
      return null;
    }
  }

  // Exceeded max cycles
  return null;
}
