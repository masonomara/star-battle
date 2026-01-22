import { generate, layout } from "./generator";
import { solve } from "./solver";
import { GeneratorError, Puzzle, SieveStats, Solution } from "./helpers/types";

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
  seed?: number; // deterministic mode: use layout() with incrementing seeds
  maxAttempts?: number;
  onProgress?: (solved: number, attempts: number, stats: SieveStats) => void;
};

/**
 * Generate puzzles by filtering random layouts through the solver.
 *
 * Stats note: In non-deterministic mode (no seed), generator failures are
 * handled internally by generate()—only solver_failed is tracked.
 * Use deterministic mode (with seed) for full failure visibility.
 */
export function sieve(options: SieveOptions = {}): Puzzle[] {
  const size = options.size ?? 10;
  const stars = options.stars ?? 2;
  const count = options.count ?? 1;
  const maxAttempts = options.maxAttempts ?? 100000;
  const deterministic = options.seed !== undefined;

  const stats: SieveStats = {
    attempts: 0,
    failures: { generator_stuck: 0, solver_failed: 0, invalid_tiling: 0 },
  };

  const puzzles: Puzzle[] = [];

  while (puzzles.length < count && stats.attempts < maxAttempts) {
    stats.attempts++;

    let board, seed: number;

    if (deterministic) {
      seed = options.seed! + stats.attempts - 1;
      try {
        board = layout(size, stars, seed);
      } catch (e) {
        if (e instanceof GeneratorError) {
          stats.failures[e.reason]++;
          options.onProgress?.(puzzles.length, stats.attempts, stats);
          continue;
        }
        throw e;
      }
    } else {
      ({ board, seed } = generate(size, stars));
    }

    const result = solve(board);

    if (result) {
      const solution: Solution = { ...result, board, seed };
      puzzles.push(assignDifficulty(solution));
    } else {
      stats.failures.solver_failed++;
    }

    options.onProgress?.(puzzles.length, stats.attempts, stats);
  }

  return puzzles;
}
