import { layout } from "./generator";
import { solve } from "./solver";
import { Puzzle, Solution } from "./helpers/types";

// Generate random seed
function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

// Assign difficulty based on solve metrics
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
  onProgress?: (solved: number, generated: number) => void;
};

export function sieve(options: SieveOptions = {}): Puzzle[] {
  const size = options.size ?? 10;
  const stars = options.stars ?? 2;
  const count = options.count ?? 1;
  const maxAttempts = 100000;

  const puzzles: Puzzle[] = [];
  let attempts = 0;

  while (puzzles.length < count && attempts < maxAttempts) {
    attempts++;
    const seed = options.seed ?? randomSeed();
    try {
      const board = layout(size, stars, seed);
      const solution = solve(board, seed);
      if (solution) {
        puzzles.push(assignDifficulty(solution));
      }
    } catch {
      // Bad seed (layout stuck or other error), try another
    }
    options.onProgress?.(puzzles.length, attempts);
    if (options.seed !== undefined) break;
  }

  return puzzles;
}
