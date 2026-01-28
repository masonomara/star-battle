import { describe, it, expect } from "vitest";
import trivialNeighbors from "./trivialNeighbors";
import { Board, CellState } from "../../helpers/types";

describe("01. trivialNeighbors", () => {
  describe("01.1 Marks neighbors correctly", () => {
    it("01.1.1 marks all 8 neighbors of center star", () => {
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
        ["unknown", "star", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "marked", "marked"],
        ["marked", "star", "marked"],
        ["marked", "marked", "marked"],
      ]);
    });

    it("01.1.2 marks 3 neighbors of corner star", () => {
      const board: Board = {
        grid: [
          [0, 0],
          [0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown"],
        ["unknown", "unknown"],
      ];

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked"],
        ["marked", "marked"],
      ]);
    });

    it("01.1.3 marks 5 neighbors of edge star", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "star", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "star", "marked"],
        ["marked", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("01.1.4 marks neighbors of multiple stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "star"],
      ];

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "marked", "marked"],
        ["unknown", "unknown", "marked", "star"],
      ]);
    });
  });

  describe("01.2 No-op cases", () => {
    it("01.2.1 returns false when no stars exist", () => {
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

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(false);
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("01.2.2 returns false when all neighbors already marked", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["marked", "marked", "marked"],
        ["marked", "star", "marked"],
        ["marked", "marked", "marked"],
      ];

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(false);
    });

    it("01.2.3 returns false when star neighbors are all stars", () => {
      const board: Board = {
        grid: [
          [0, 0],
          [0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "star"],
        ["star", "star"],
      ];

      const result = trivialNeighbors(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("01.3 Edge cases", () => {
    it("01.3.1 preserves cells beyond immediate neighbors", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      trivialNeighbors(board, cells);

      // Corners should remain unknown (2 cells away)
      expect(cells[0][0]).toBe("unknown");
      expect(cells[0][4]).toBe("unknown");
      expect(cells[4][0]).toBe("unknown");
      expect(cells[4][4]).toBe("unknown");
    });

    it("01.3.2 preserves existing stars in neighbor positions", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "star", "unknown"],
        ["unknown", "unknown", "star"],
      ];

      trivialNeighbors(board, cells);

      expect(cells[2][2]).toBe("star");
    });
  });
});
