import { describe, expect, it } from "vitest";
import { layout } from "./generator";
import { sieve } from "./sieve";

describe("layout", () => {
  it("produces identical boards for the same seed", () => {
    const seed = 12345;
    const first = layout(10, 2, seed);
    const second = layout(10, 2, seed);

    expect(first.grid).toEqual(second.grid);
    expect(first.stars).toEqual(second.stars);
  });
});

describe("sieve", () => {
  it("returns puzzles with difficulty assigned", () => {
    const puzzles = sieve({ size: 6, stars: 1, count: 3 });
    expect(puzzles.length).toBeGreaterThanOrEqual(1);
    for (const puzzle of puzzles) {
      expect(puzzle.difficulty).toBeGreaterThanOrEqual(1);
      expect(puzzle.difficulty).toBeLessThanOrEqual(10);
    }
  });
});
