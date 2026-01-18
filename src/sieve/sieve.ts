import { layout } from "./generator";
import { solve } from "./solver";
import { Puzzle } from "./types";

export function sieve(size: number, stars: number, count: number): Puzzle[] {
  const puzzles: Puzzle[] = [];
  while (puzzles.length < count) {
    const { board, seed } = layout(size, stars);
    const puzzle = solve(board, seed);
    if (puzzle) puzzles.push(puzzle);
  }
  return puzzles;
}
