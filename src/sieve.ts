import { generate } from "./generator";
import { solve } from "./solver";
import { Puzzle, SieveStats, Solution } from "./helpers/types";
import { computeDifficulty } from "./helpers/difficulty";

type SieveOptions = {
  size?: number;
  stars?: number;
  count?: number;
  maxAttempts?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  onProgress?: (stats: SieveStats) => void;
};

export function sieve(options: SieveOptions = {}): Puzzle[] {
  const size = options.size ?? 10;
  const stars = options.stars ?? 2;
  const count = options.count ?? 1;
  const maxAttempts = options.maxAttempts ?? 100000000;
  if (!Number.isInteger(count) || count < 1 || count > 300)
    throw new Error(`count must be an integer between 1 and 300, got ${count}`);

  const stats: SieveStats = { attempts: 0, solved: 0, solverFailed: 0 };

  const puzzles: Puzzle[] = [];

  while (puzzles.length < count && stats.attempts < maxAttempts) {
    stats.attempts++;
    const { board, seed } = generate(size, stars);
    const result = solve(board);

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };
      const minDiff = options.minDifficulty ?? 0;
      const maxDiff = options.maxDifficulty ?? Infinity;
      if (puzzle.difficulty >= minDiff && puzzle.difficulty <= maxDiff) {
        puzzles.push(puzzle);
      }
    } else {
      stats.solverFailed++;
    }

    stats.solved = puzzles.length;
    options.onProgress?.(stats);
  }

  return puzzles;
}
