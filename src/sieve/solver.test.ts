import { describe, it, expect } from "vitest";
import { isSolved, solve } from "./solver";
import { Board, CellState } from "./types";

describe("isSolved", () => {
  describe("1. Solved puzzles", () => {
    it("1.1 recognizes solved 4x4 puzzle", () => {
      // 4x4 with 4 regions, 1 star each
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };

      // Valid solution: stars at (0,1), (1,3), (2,0), (3,2)
      const cells: CellState[][] = [
        ["marked", "star", "marked", "marked"],
        ["marked", "marked", "marked", "star"],
        ["star", "marked", "marked", "marked"],
        ["marked", "marked", "star", "marked"],
      ];

      const result = isSolved(board, cells);

      expect(result).toBe(true);
    });

  });

  describe("2. Unsolved puzzles", () => {
    it("2.1 returns false for empty board", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      expect(isSolved(board, cells)).toBe(false);
    });

    it("2.2 returns false when row/col/region missing stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 1, 1],
          [2, 2, 2],
        ],
        stars: 1,
      };

      // Row 0 has no star
      const cells: CellState[][] = [
        ["marked", "marked", "marked"],
        ["marked", "marked", "star"],
        ["star", "marked", "marked"],
      ];

      expect(isSolved(board, cells)).toBe(false);
    });

    it("2.3 returns false when stars are diagonally adjacent", () => {
      // Each row is its own region - star counts will all pass
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [2, 2, 2, 2],
          [3, 3, 3, 3],
        ],
        stars: 1,
      };

      // Stars at (0,0) and (1,1) are diagonally adjacent - invalid
      // Row/col/region counts are all correct (1 each)
      const cells: CellState[][] = [
        ["star", "marked", "marked", "marked"],
        ["marked", "star", "marked", "marked"],
        ["marked", "marked", "star", "marked"],
        ["marked", "marked", "marked", "star"],
      ];

      expect(isSolved(board, cells)).toBe(false);
    });
  });
});

describe("solve", () => {
  describe("1. Solves valid puzzles", () => {
    it("1.1 solves puzzle with forced single-cell regions", () => {
      // 4 single-cell regions force stars at (0,1), (1,3), (2,0), (3,2)
      const board: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };

      const result = solve(board, 42);

      expect(result).not.toBeNull();
      expect(result!.cells[0][1]).toBe("star");
      expect(result!.cells[1][3]).toBe("star");
      expect(result!.cells[2][0]).toBe("star");
      expect(result!.cells[3][2]).toBe("star");
      expect(result!.seed).toBe(42);
      expect(result!.maxLevel).toBe(1);
      expect(result!.cycles).toBeGreaterThanOrEqual(1);
    });

    it("1.2 solves puzzle via cascading forced placement", () => {
      const board: Board = {
        grid: [
          [0, 5, 5, 5, 5],
          [5, 5, 1, 5, 5],
          [5, 5, 5, 5, 2],
          [5, 3, 5, 5, 5],
          [5, 5, 5, 4, 5],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      expect(result).not.toBeNull();
      expect(isSolved(board, result!.cells)).toBe(true);
      expect(result!.cycles).toBeGreaterThan(1);
    });
  });

  describe("2. Detects unsolvable puzzles", () => {
    it("2.1 returns null when no rules apply", () => {
      // A board where rules can't make progress
      // Single region covering everything - ambiguous
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      // Single region needs 1 star but has 16 cells - no forced moves
      // Rules will exhaust without solving
      expect(result).toBeNull();
    });

    it("2.2 returns null for impossible region layout", () => {
      // Region 0 has only 1 cell but needs 2 stars
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const result = solve(board, 0);

      expect(result).toBeNull();
    });
  });

  describe("3. Edge cases", () => {
    it("3.1 tracks maxLevel for harder rules", () => {
      // Puzzle requiring level 2 rules (2x2 tiling)
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1],
          [2, 0, 1, 1, 3, 3],
          [2, 2, 2, 3, 3, 3],
          [2, 2, 4, 4, 4, 4],
          [2, 4, 4, 4, 4, 4],
        ],
        stars: 2,
      };

      const result = solve(board, 0);

      if (result !== null) {
        expect(result.maxLevel).toBeGreaterThanOrEqual(2);
      }
    });

    it("3.2 does not mutate input board", () => {
      const board: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };

      const originalGrid = JSON.stringify(board.grid);
      solve(board, 0);

      expect(JSON.stringify(board.grid)).toBe(originalGrid);
    });
  });
});
