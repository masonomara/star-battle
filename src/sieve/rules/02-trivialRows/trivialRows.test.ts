import { describe, it, expect } from "vitest";
import trivialRows from "./trivialRows";
import { Board, CellState } from "../../helpers/types";

describe("trivialRows", () => {
  describe("True Positives - correctly marks remaining cells", () => {
    it("marks remaining cells when row has required stars", () => {
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
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = trivialRows(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("marks remaining cells with 2-star requirement", () => {
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
        ["star", "unknown", "star", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = trivialRows(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "star", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("marks cells in multiple complete rows", () => {
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
        ["unknown", "unknown", "unknown"],
        ["unknown", "star", "unknown"],
      ];

      const result = trivialRows(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["marked", "star", "marked"],
      ]);
    });
  });

  describe("True Negatives - correctly returns false", () => {
    it("returns false when no rows are complete", () => {
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

      const result = trivialRows(board, cells);

      expect(result).toBe(false);
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("returns false when row already fully marked", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = trivialRows(board, cells);

      expect(result).toBe(false);
    });

    it("returns false when row has fewer stars than required", () => {
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
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = trivialRows(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("False Positives - should not mark incorrectly", () => {
    it("does not mark cells in incomplete rows", () => {
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
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      trivialRows(board, cells);

      expect(cells[0]).toEqual(["star", "unknown", "unknown", "unknown"]);
    });

    it("does not overwrite stars", () => {
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
        ["star", "star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      trivialRows(board, cells);

      expect(cells[0][0]).toBe("star");
      expect(cells[0][1]).toBe("star");
    });
  });

  describe("False Negatives - should not miss markings", () => {
    it("marks all rows that are complete in one pass", () => {
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
        ["star", "unknown", "unknown"],
      ];

      trivialRows(board, cells);

      expect(cells).toEqual([
        ["star", "marked", "marked"],
        ["star", "marked", "marked"],
        ["star", "marked", "marked"],
      ]);
    });
  });
});
