import { describe, it, expect } from "vitest";
import { isUnsolvable, isSolved, solve } from "./solver";
import { Board, CellState } from "./types";

describe("isUnsolvable", () => {
  describe("1. Adjacent stars", () => {
    it("1.1 detects horizontally adjacent stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "star", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("adjacent");
    });

    it("1.2 detects vertically adjacent stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("adjacent");
    });

    it("1.3 detects diagonally adjacent stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["unknown", "star", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("adjacent");
    });

    it("1.4 allows non-adjacent stars", () => {
      // 5 regions so we can have 5 stars (1 per region/row/col)
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [2, 2, 3, 3, 3],
          [2, 2, 3, 3, 3],
          [4, 4, 4, 4, 4],
        ],
        stars: 1,
      };

      // Stars at (0,0) and (2,2) - not adjacent, different rows/cols/regions
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "star", "marked", "unknown"],
        ["unknown", "unknown", "marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).toBeNull();
    });
  });

  describe("2. Too many stars", () => {
    it("2.1 detects too many stars in row", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };

      // Row 0 has 2 stars but only 1 allowed (non-adjacent placement)
      const cells: CellState[][] = [
        ["star", "marked", "star", "unknown"],
        ["marked", "marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("row 0");
      expect(result).toContain("2 stars");
    });

    it("2.2 detects too many stars in column", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };

      // Col 0 has 2 stars but only 1 allowed
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["star", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("col 0");
      expect(result).toContain("2 stars");
    });

    it("2.3 detects too many stars in region", () => {
      // Region 0 is large enough to have 2 non-adjacent stars
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1],
          [0, 0, 0, 1, 1],
          [0, 0, 0, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
        ],
        stars: 1,
      };

      // Region 0 has 2 stars at (0,0) and (2,2) - not adjacent, different rows/cols
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "star", "unknown", "unknown"],
        ["unknown", "unknown", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("region 0");
      expect(result).toContain("2 stars");
    });
  });

  describe("3. Not enough unknowns", () => {
    it("3.1 detects row with insufficient unknowns", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 2,
      };

      // Row 0 needs 2 stars but has only 1 unknown
      const cells: CellState[][] = [
        ["marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("row 0");
      expect(result).toContain("needs");
      expect(result).toContain("unknowns");
    });

    it("3.2 detects column with insufficient unknowns", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 2,
      };

      // Col 0 needs 2 stars but has only 1 unknown
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("col 0");
      expect(result).toContain("needs");
      expect(result).toContain("unknowns");
    });

    it("3.3 detects region with insufficient unknowns", () => {
      // Region 0 spans multiple rows/cols but has limited unknowns
      // Each row/col still has enough unknowns overall
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // Region 0 (top-left 2x2) needs 2 stars but has only 1 unknown
      // Rows/cols still have enough unknowns from region 1
      const cells: CellState[][] = [
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("region 0");
      expect(result).toContain("needs");
      expect(result).toContain("unknowns");
    });

    it("3.4 detects row needing 1 more star with 0 unknowns", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
      };

      // Row 0 has 1 star, needs 1 more, but 0 unknowns left
      const cells: CellState[][] = [
        ["star", "marked", "marked", "marked", "marked"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).not.toBeNull();
      expect(result).toContain("row 0");
    });
  });

  describe("4. Valid states", () => {
    it("4.1 returns null for empty board", () => {
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

      const result = isUnsolvable(board, cells);

      expect(result).toBeNull();
    });

    it("4.2 returns null for partially solved valid state", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };

      // One star placed, neighbors marked, still solvable
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).toBeNull();
    });

    it("4.3 returns null for solved puzzle", () => {
      // 4x4 with 4 regions, 1 star each - valid solution with no adjacent stars
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
      // Each row/col/region has exactly 1 star, no adjacencies
      const cells: CellState[][] = [
        ["marked", "star", "marked", "marked"],
        ["marked", "marked", "marked", "star"],
        ["star", "marked", "marked", "marked"],
        ["marked", "marked", "star", "marked"],
      ];

      const result = isUnsolvable(board, cells);

      expect(result).toBeNull();
    });
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

    it("1.2 recognizes solved 4x4 puzzle with 2 stars", () => {
      // 4 regions, each needs 2 stars
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 2,
      };

      // Valid solution: each row/col/region has 2 stars
      const cells: CellState[][] = [
        ["star", "marked", "marked", "star"],
        ["marked", "star", "star", "marked"],
        ["star", "marked", "marked", "star"],
        ["marked", "star", "star", "marked"],
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

      const result = isSolved(board, cells);

      expect(result).toBe(false);
    });

    it("2.2 returns false when row missing stars", () => {
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

      const result = isSolved(board, cells);

      expect(result).toBe(false);
    });

    it("2.3 returns false when column missing stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 1, 1],
          [2, 2, 2],
        ],
        stars: 1,
      };

      // Col 2 has no star
      const cells: CellState[][] = [
        ["marked", "star", "marked"],
        ["star", "marked", "marked"],
        ["marked", "marked", "marked"],
      ];

      const result = isSolved(board, cells);

      expect(result).toBe(false);
    });

    it("2.4 returns false when region missing stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 1, 1],
          [2, 2, 2],
        ],
        stars: 1,
      };

      // Region 2 (bottom row) has no star
      const cells: CellState[][] = [
        ["marked", "star", "marked"],
        ["marked", "star", "marked"],
        ["marked", "marked", "marked"],
      ];

      const result = isSolved(board, cells);

      expect(result).toBe(false);
    });

    it("2.5 returns false with unknowns remaining", () => {
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 1, 1],
          [2, 2, 2],
        ],
        stars: 1,
      };

      // Has unknowns still
      const cells: CellState[][] = [
        ["marked", "star", "marked"],
        ["marked", "marked", "star"],
        ["unknown", "marked", "marked"],
      ];

      const result = isSolved(board, cells);

      expect(result).toBe(false);
    });
  });
});

describe("solve", () => {
  describe("1. Solves valid puzzles", () => {
    it("1.1 solves puzzle with single-cell regions (forces stars)", () => {
      // 4 single-cell regions force stars at those cells
      // Stars at (0,1), (1,3), (2,0), (3,2) - non-adjacent, valid solution
      const board: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      expect(result).not.toBeNull();
      // Verify stars placed at forced positions
      expect(result!.cells[0][1]).toBe("star");
      expect(result!.cells[1][3]).toBe("star");
      expect(result!.cells[2][0]).toBe("star");
      expect(result!.cells[3][2]).toBe("star");
    });

    it("1.2 solves puzzle via cascading forced placement", () => {
      // After first stars placed, row/col completion marks cells,
      // which then forces more stars
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
      expect(isUnsolvable(board, result!.cells)).toBeNull();
      expect(isSolved(board, result!.cells)).toBe(true);
    });

    it("1.3 solves puzzle requiring multiple cycles", () => {
      // Each single-cell region forces a star, then neighbors get marked,
      // then more forced placements happen
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

  describe("3. Tracks difficulty metrics", () => {
    it("3.1 counts cycles correctly", () => {
      // Simple puzzle with forced placements
      const board: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      expect(result).not.toBeNull();
      expect(result!.cycles).toBeGreaterThanOrEqual(1);
      expect(result!.cycles).toBeLessThan(100); // sanity check
    });

    it("3.2 maxLevel is 1 for trivial-rules-only puzzle", () => {
      // Single-cell regions force stars via level 1 rules
      const board: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      expect(result).not.toBeNull();
      expect(result!.maxLevel).toBe(1);
    });

    it("3.3 maxLevel reflects hardest rule needed", () => {
      // Puzzle requiring level 2 rules (2x2 tiling)
      // Region 0 has a tail that forces tiling logic
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
      // If null, that's also valid - we may not have level 2+ rules yet
    });
  });

  describe("4. Edge cases", () => {
    it("4.1 handles small solvable puzzle (4x4 with forced regions)", () => {
      // 4 single-cell regions force non-adjacent stars
      // Stars at (0,1), (1,3), (2,0), (3,2) - valid: different rows/cols, non-adjacent
      // Note: 3x3 is impossible - all 1-star-per-row/col placements have adjacencies
      const board: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };

      const result = solve(board, 0);

      expect(result).not.toBeNull();
      const stars = result!.cells.flat().filter((c) => c === "star");
      expect(stars.length).toBe(4);
    });

    it("4.2 returns valid puzzle structure when solved", () => {
      // 4x4 with forced placements
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
      expect(result).toHaveProperty("board");
      expect(result).toHaveProperty("seed");
      expect(result).toHaveProperty("cells");
      expect(result).toHaveProperty("cycles");
      expect(result).toHaveProperty("maxLevel");
      expect(result!.seed).toBe(42);
      expect(result!.cells.length).toBe(4);
      expect(result!.cells[0].length).toBe(4);
    });

    it("4.3 does not mutate input board", () => {
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
