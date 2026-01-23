import { describe, it, expect } from "vitest";
import trivialNeighbors from "./trivialNeighbors";
import { Board, CellState } from "../../helpers/types";

describe("trivialNeighbors", () => {
  describe("True Positives - correctly marks neighbors", () => {
    it("marks all 8 neighbors of center star", () => {
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

    it("marks 3 neighbors of corner star", () => {
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

    it("marks 5 neighbors of edge star", () => {
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

    it("marks neighbors of multiple stars", () => {
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

  describe("True Negatives - correctly returns false", () => {
    it("returns false when no stars exist", () => {
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

    it("returns false when all neighbors already marked", () => {
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

    it("returns false when star neighbors are all stars", () => {
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

  describe("False Positives - should not mark incorrectly", () => {
    it("does not mark cells beyond neighbors", () => {
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

    it("does not overwrite existing stars", () => {
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
