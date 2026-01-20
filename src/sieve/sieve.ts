import { layout } from "./generator";
import { solve } from "./solver";
import { Board, Puzzle, Solution } from "./types";

// Generate random seed
function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

// Assign difficulty based on solve metrics
function assignDifficulty(solution: Solution): Puzzle {
  // Base difficulty from max rule level (1-5 scale per level)
  // Level 1 rules = easy (1-2), Level 2+ = harder
  const levelBase = solution.maxLevel * 2;

  // Add cycles contribution (more cycles = harder)
  // Normalize cycles: ~5 cycles = +1 difficulty
  const cycleBonus = Math.floor(solution.cycles / 5);

  const difficulty = Math.min(10, levelBase + cycleBonus);

  return { ...solution, difficulty };
}

type SieveOptions = {
  size?: number;
  stars?: number;
  count?: number;
  seed?: number;
  mode?: "puzzle" | "board";
  onProgress?: (solved: number, generated: number) => void;
};

type BoardResult = { board: Board; seed: number };

type SieveResult =
  | { puzzles: Puzzle[]; attempts: number }
  | { boards: BoardResult[] }
  | { seed: number; board: Board; puzzle: Puzzle | null };

export function sieve(options: SieveOptions = {}): SieveResult {
  const size = options.size ?? 10;
  const stars = options.stars ?? 2;
  const mode = options.mode ?? "puzzle";

  // If seed provided, generate one with that seed
  if (options.seed !== undefined) {
    const board = layout(size, stars, options.seed);
    const output = mode === "puzzle" ? solve(board, options.seed) : null;
    const puzzle = output ? assignDifficulty(output) : null;
    return { seed: options.seed, board, puzzle };
  }

  const count = options.count ?? 1;

  // Board-only mode: just generate boards, no solving
  if (mode === "board") {
    const boards: BoardResult[] = [];
    for (let i = 0; i < count; i++) {
      const seed = randomSeed();
      const board = layout(size, stars, seed);
      boards.push({ board, seed });
    }
    return { boards };
  }

  // Puzzle mode: generate and solve until we have enough valid puzzles
  const maxAttempts = 100000;
  const puzzles: Puzzle[] = [];
  let generated = 0;
  while (puzzles.length < count && generated < maxAttempts) {
    generated++;
    const seed = randomSeed();
    const board = layout(size, stars, seed);
    const solution = solve(board, seed);
    if (solution) {
      puzzles.push(assignDifficulty(solution));
    }
    options.onProgress?.(puzzles.length, generated);
  }
  return { puzzles, attempts: generated };
}
