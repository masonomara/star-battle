import { describe, it, expect } from "vitest";
import { isSolved, isValidLayout, solve } from "./solver";
import { layout } from "./generator";
import { Board, CellState } from "./types";

describe("isValidLayout", () => {
  it("accepts any region size for 1-star puzzles", () => {
    const board: Board = {
      grid: [[0]], // single cell region
      stars: 1,
    };
    expect(isValidLayout(board)).toBe(true);
  });

  it("rejects region smaller than (stars * 2) - 1 for 2-star", () => {
    // 2 stars needs min 3 cells per region
    const board: Board = {
      grid: [
        [0, 0, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
      stars: 2,
    };
    // Region 0 has only 2 cells, needs 3
    expect(isValidLayout(board)).toBe(false);
  });

  it("accepts regions meeting minimum size for 2-star", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 1, 1],
        [0, 0, 1, 1, 1],
        [2, 2, 2, 3, 3],
        [2, 2, 3, 3, 3],
        [4, 4, 4, 4, 4],
      ],
      stars: 2,
    };
    // All regions have at least 3 cells
    expect(isValidLayout(board)).toBe(true);
  });

  it("rejects region smaller than 5 cells for 3-star", () => {
    // 3 stars needs min 5 cells per region
    const board: Board = {
      grid: [
        [0, 0, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
      ],
      stars: 3,
    };
    // Region 0 has only 4 cells, needs 5
    expect(isValidLayout(board)).toBe(false);
  });
});

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

    it("2.4 returns false when stars are orthogonally adjacent", () => {
      // Stars touching horizontally or vertically is also invalid
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 2,
      };

      // Stars at (0,0) and (0,1) are horizontally adjacent - invalid
      const cells: CellState[][] = [
        ["star", "star", "marked", "marked"],
        ["marked", "marked", "star", "star"],
        ["star", "star", "marked", "marked"],
        ["marked", "marked", "star", "star"],
      ];

      expect(isSolved(board, cells)).toBe(false);
    });

    it("2.5 returns false when row has excess stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };

      // Row 0 has 2 stars but should only have 1
      const cells: CellState[][] = [
        ["star", "marked", "star", "marked"],
        ["marked", "marked", "marked", "marked"],
        ["marked", "star", "marked", "star"],
        ["marked", "marked", "marked", "marked"],
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
          [3, 0, 3, 3],
          [3, 3, 3, 1],
          [2, 3, 3, 3],
          [3, 3, 3, 3],
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
          [0, 4, 4, 4, 4],
          [4, 4, 1, 4, 4],
          [4, 4, 4, 4, 2],
          [4, 3, 4, 4, 4],
          [4, 4, 4, 4, 4],
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

    it("2.3 returns null after partial progress (stall)", () => {
      // Puzzle where some progress is made but then rules exhaust
      // 4 regions of 4 cells each, but layout is ambiguous after initial marks
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      // Each 2x2 region needs 1 star but has 4 cells - no forced moves
      // Rules make no progress, solver stalls
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

  describe("4. Integration", () => {
    it("4.1 every solution is valid", () => {
      for (let seed = 0; seed < 100; seed++) {
        const board = layout(6, 1, seed);
        const result = solve(board, seed);
        if (result) {
          expect(isSolved(board, result.cells)).toBe(true);
        }
      }
    });

    it("4.2 handles 10x10", () => {
      const board = layout(10, 2, 0);
      const result = solve(board, 0);
      if (result) {
        expect(isSolved(board, result.cells)).toBe(true);
      }
    });

    it("4.3 terminates on impossible board", () => {
      const board: Board = { grid: [[0]], stars: 5 };
      const result = solve(board, 0);
      expect(result).toBeNull();
    });
  });
});
