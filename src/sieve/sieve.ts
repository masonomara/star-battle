import { layout } from "./generator";
import { solve } from "./solver";
import { GeneratorError, Puzzle, SieveStats, Solution } from "./helpers/types";

// Generate random seed
function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

// Assign difficulty based on solve metrics
// Formula: min(10, maxLevel * 2 + floor(cycles / 5))
function assignDifficulty(solution: Solution): Puzzle {
  const levelBase = solution.maxLevel * 2;
  const cycleBonus = Math.floor(solution.cycles / 5);
  const difficulty = Math.min(10, levelBase + cycleBonus);
  return { ...solution, difficulty };
}

type SieveOptions = {
  size?: number;
  stars?: number;
  count?: number;
  seed?: number;
  maxAttempts?: number;
  onProgress?: (solved: number, attempts: number, stats: SieveStats) => void;
};

export function sieve(options: SieveOptions = {}): Puzzle[] {
  const size = options.size ?? 10;
  const stars = options.stars ?? 2;
  const count = options.count ?? 1;
  const maxAttempts = options.maxAttempts ?? 100000;

  const stats: SieveStats = {
    attempts: 0,
    failures: { generator_stuck: 0, solver_failed: 0 },
  };

  const puzzles: Puzzle[] = [];

  while (puzzles.length < count && stats.attempts < maxAttempts) {
    const seed =
      options.seed !== undefined ? options.seed + stats.attempts : randomSeed();
    stats.attempts++;

    try {
      const board = layout(size, stars, seed);
      const result = solve(board);
      if (result) {
        const solution: Solution = { ...result, board, seed };
        puzzles.push(assignDifficulty(solution));
      } else {
        stats.failures.solver_failed++;
      }
    } catch (e) {
      if (e instanceof GeneratorError) {
        stats.failures[e.reason]++;
      } else {
        throw e;
      }
    }

    options.onProgress?.(puzzles.length, stats.attempts, stats);
  }

  return puzzles;
}
