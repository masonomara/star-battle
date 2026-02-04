import { describe, it, expect } from "vitest";
import { solve, board } from "./solver";
import { buildBoardAnalysis } from "./helpers/boardAnalysis";
import { Board, CellState } from "./helpers/types";

describe("board.isValid", () => {
  describe("returns true", () => {
    it("accepts regions meeting minimum size", () => {
      const b: Board = {
        grid: [
          [0, 0, 0, 1, 1],
          [0, 0, 1, 1, 1],
          [2, 2, 2, 3, 3],
          [2, 2, 3, 3, 3],
          [4, 4, 4, 4, 4],
        ],
        stars: 2,
      };

      expect(board.isValid(b)).toBe(true);
    });
  });

  describe("returns false", () => {
    it("rejects region smaller than minimum", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
        ],
        stars: 2,
      };

      expect(board.isValid(b)).toBe(false);
    });
  });
});

describe("buildBoardAnalysis status", () => {
  describe("returns solved", () => {
    it("when all star counts match target", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["marked", "star", "marked", "marked"],
        ["marked", "marked", "marked", "star"],
        ["star", "marked", "marked", "marked"],
        ["marked", "marked", "star", "marked"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("solved");
    });
  });

  describe("returns invalid", () => {
    it("when stars are horizontally adjacent", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "star", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("invalid");
    });

    it("when stars are vertically adjacent", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "marked", "marked", "marked"],
        ["star", "marked", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("invalid");
    });

    it("when stars are diagonally adjacent", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "marked", "marked", "marked"],
        ["marked", "star", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
        ["marked", "marked", "marked", "marked"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("invalid");
    });

    it("when row has insufficient capacity", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["marked", "marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("invalid");
    });

    it("when column has insufficient capacity", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("invalid");
    });

    it("when region has insufficient capacity", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("invalid");
    });
  });

  describe("returns valid", () => {
    it("for empty board", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("valid");
    });

    it("for partially solved board", () => {
      const b: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["marked", "star", "marked", "marked"],
        ["marked", "marked", "marked", "unknown"],
        ["unknown", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      expect(buildBoardAnalysis(b, cells).status).toBe("valid");
    });
  });
});

describe("solve", () => {
  describe("returns null", () => {
    it("on unsolvable layout", () => {
      const b: Board = {
        grid: [
          [0, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      expect(solve(b)).toBeNull();
    });

    it("on impossible board", () => {
      const b: Board = { grid: [[0]], stars: 5 };

      expect(solve(b)).toBeNull();
    });

    it("when puzzle would require adjacent stars", () => {
      const b: Board = {
        grid: [
          [3, 3, 3, 2, 2, 2, 1, 1, 1, 1],
          [3, 3, 3, 2, 2, 2, 2, 1, 1, 1],
          [3, 3, 3, 2, 0, 0, 0, 0, 1, 1],
          [3, 3, 3, 3, 0, 0, 0, 0, 0, 1],
          [3, 3, 3, 4, 4, 4, 4, 4, 4, 1],
          [9, 9, 8, 8, 6, 6, 6, 6, 4, 1],
          [9, 9, 8, 8, 6, 6, 6, 6, 6, 1],
          [7, 9, 8, 8, 6, 6, 6, 6, 5, 5],
          [7, 8, 8, 8, 8, 8, 8, 8, 5, 5],
          [7, 7, 8, 8, 8, 8, 8, 8, 5, 5],
        ],
        stars: 2,
      };

      expect(solve(b)).toBeNull();
    });
  });

  describe("behavior", () => {
    it("does not mutate input board", () => {
      const b: Board = {
        grid: [
          [4, 0, 4, 4],
          [4, 4, 4, 1],
          [2, 4, 4, 4],
          [4, 4, 3, 4],
        ],
        stars: 1,
      };
      const originalGrid = JSON.stringify(b.grid);

      solve(b);

      expect(JSON.stringify(b.grid)).toBe(originalGrid);
    });
  });
});
