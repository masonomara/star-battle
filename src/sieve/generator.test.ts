import { describe, it, expect } from "vitest";
import { generate, layout } from "./generator";
import { GeneratorError } from "./helpers/types";

describe("generate", () => {
  it("returns a valid board", () => {
    const result = generate(8, 2);
    expect(result.board.grid.length).toBe(8);
    expect(result.board.stars).toBe(2);
  });

  it("returns seed and attempt count", () => {
    const result = generate(8, 2);
    expect(typeof result.seed).toBe("number");
    expect(result.attempts).toBeGreaterThanOrEqual(1);
  });

  it("returned seed reproduces the same board", () => {
    const result = generate(8, 2);
    const reproduced = layout(8, 2, result.seed);
    expect(reproduced.grid).toEqual(result.board.grid);
  });

  it("works with various puzzle sizes", () => {
    expect(() => generate(6, 1)).not.toThrow();
    expect(() => generate(8, 2)).not.toThrow();
    expect(() => generate(10, 2)).not.toThrow();
    expect(() => generate(10, 3)).not.toThrow();
  });

  it("throws on non-positive size", () => {
    expect(() => generate(0, 2)).toThrow("size must be positive");
    expect(() => generate(-1, 2)).toThrow("size must be positive");
  });

  it("throws on non-positive stars", () => {
    expect(() => generate(8, 0)).toThrow("stars must be positive");
    expect(() => generate(8, -1)).toThrow("stars must be positive");
  });

  it("throws when stars exceed size/2", () => {
    expect(() => generate(8, 5)).toThrow("cannot exceed size/2");
    expect(() => generate(10, 6)).toThrow("cannot exceed size/2");
  });

  it("throws GeneratorError when maxAttempts exhausted", () => {
    // maxAttempts: 0 guarantees no attempts, so it always throws
    expect(() => generate(10, 2, { maxAttempts: 0 })).toThrow(GeneratorError);
  });
});

describe("layout", () => {
  // Use 1-star puzzles for structure tests (100% success rate)
  // Use known-good seeds for 2-star tests

  describe("determinism", () => {
    it("same seed produces identical layout", () => {
      const a = layout(6, 1, 42);
      const b = layout(6, 1, 42);
      expect(a.grid).toEqual(b.grid);
    });

    it("different seeds produce different layouts", () => {
      const a = layout(6, 1, 1);
      const b = layout(6, 1, 2);
      expect(a.grid).not.toEqual(b.grid);
    });
  });

  describe("structure", () => {
    it("returns correct grid dimensions", () => {
      const board = layout(8, 1, 0);
      expect(board.grid.length).toBe(8);
      expect(board.grid.every((row) => row.length === 8)).toBe(true);
    });

    it("stores star count", () => {
      const board = layout(6, 1, 0);
      expect(board.stars).toBe(1);
    });

    it("creates exactly N regions", () => {
      const board = layout(5, 1, 0);
      const regionIds = new Set(board.grid.flat());
      expect(regionIds.size).toBe(5);
    });

    it("region IDs are 0 to N-1", () => {
      const board = layout(6, 1, 0);
      const regionIds = new Set(board.grid.flat());
      for (let i = 0; i < 6; i++) {
        expect(regionIds.has(i)).toBe(true);
      }
    });

    it("all cells assigned to a region", () => {
      const board = layout(8, 1, 0);
      for (const row of board.grid) {
        for (const cell of row) {
          expect(cell).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("region constraints", () => {
    it("regions are contiguous", () => {
      const board = layout(8, 1, 0);
      const size = board.grid.length;

      for (let regionId = 0; regionId < size; regionId++) {
        const cells: [number, number][] = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (board.grid[r][c] === regionId) cells.push([r, c]);
          }
        }

        // BFS from first cell should reach all cells
        const visited = new Set<string>();
        const queue = [cells[0]];
        visited.add(`${cells[0][0]},${cells[0][1]}`);

        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            const key = `${nr},${nc}`;
            if (
              nr >= 0 && nr < size &&
              nc >= 0 && nc < size &&
              board.grid[nr][nc] === regionId &&
              !visited.has(key)
            ) {
              visited.add(key);
              queue.push([nr, nc]);
            }
          }
        }

        expect(visited.size).toBe(cells.length);
      }
    });

    it("1-star regions have at least 1 cell", () => {
      const board = layout(5, 1, 0);
      const sizes = getRegionSizes(board.grid);
      expect(sizes.every((s) => s >= 1)).toBe(true);
    });

    it("2-star regions have at least 3 cells", () => {
      const board = layout(8, 2, 2); // seed 2 works for 8x8 2-star
      const sizes = getRegionSizes(board.grid);
      expect(sizes.every((s) => s >= 3)).toBe(true);
    });
  });

  describe("tiling validation", () => {
    it("rejects layouts where regions cannot fit stars", () => {
      // Seed 0 fails tiling for 8x8 2-star
      expect(() => layout(8, 2, 0)).toThrow(GeneratorError);
    });

    it("accepts layouts where regions can fit stars", () => {
      // Seed 2 passes tiling for 8x8 2-star
      expect(() => layout(8, 2, 2)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("throws on non-positive size", () => {
      expect(() => layout(0, 1, 0)).toThrow("size must be positive");
      expect(() => layout(-1, 1, 0)).toThrow("size must be positive");
    });

    it("throws on non-positive stars", () => {
      expect(() => layout(8, 0, 0)).toThrow("stars must be positive");
      expect(() => layout(8, -1, 0)).toThrow("stars must be positive");
    });

    it("throws when stars exceed size/2", () => {
      expect(() => layout(1, 1, 0)).toThrow("cannot exceed size/2");
      expect(() => layout(8, 5, 0)).toThrow("cannot exceed size/2");
    });

    it("handles size=2 stars=1", () => {
      const board = layout(2, 1, 0);
      expect(board.grid.length).toBe(2);
    });

    it("handles seed=0", () => {
      expect(() => layout(5, 1, 0)).not.toThrow();
    });

    it("handles negative seed", () => {
      const board = layout(5, 1, -42);
      expect(board.grid.length).toBe(5);
    });

    it("handles large seed", () => {
      const board = layout(5, 1, 2147483647);
      expect(board.grid.length).toBe(5);
    });
  });

  // Yield expectations by star count:
  // - 1-star: ~100% (no tiling constraints)
  // - 2-star: ~20-40% (tiling often fails, sieve retries compensate)
  // This is acceptable—sieve() handles retries transparently.
  describe("reliability", () => {
    it("1-star: 100% success over 100 seeds", () => {
      for (let seed = 0; seed < 100; seed++) {
        expect(() => layout(6, 1, seed)).not.toThrow();
      }
    });

    it("2-star: >20% success over 100 seeds", () => {
      let successes = 0;
      for (let seed = 0; seed < 100; seed++) {
        try {
          layout(8, 2, seed);
          successes++;
        } catch {
          // Expected - tiling validation rejects many random layouts
        }
      }
      expect(successes).toBeGreaterThan(20);
    });
  });
});

function getRegionSizes(grid: number[][]): number[] {
  const counts = new Map<number, number>();
  for (const row of grid) {
    for (const cell of row) {
      counts.set(cell, (counts.get(cell) || 0) + 1);
    }
  }
  return [...counts.values()];
}
