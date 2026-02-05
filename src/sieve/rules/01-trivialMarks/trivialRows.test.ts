import { describe, it, expect } from "vitest";
import rowComplete from "./trivialRows";
import { Board, CellState } from "../../helpers/types";

describe("02. rowComplete", () => {
  describe("02.1 Marks remaining cells correctly", () => {
    it("02.1.1 marks remaining cells when row has required stars", () => {
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

      const result = rowComplete(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("02.1.2 marks remaining cells with 2-star requirement", () => {
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

      const result = rowComplete(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "star", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("02.1.3 marks cells in multiple complete rows", () => {
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

      const result = rowComplete(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["marked", "star", "marked"],
      ]);
    });
  });

  describe("02.2 No-op cases", () => {
    it("02.2.1 returns false when no rows are complete", () => {
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

      const result = rowComplete(board, cells);

      expect(result).toBe(false);
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("02.2.2 returns false when row already fully marked", () => {
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

      const result = rowComplete(board, cells);

      expect(result).toBe(false);
    });

    it("02.2.3 returns false when row has fewer stars than required", () => {
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

      const result = rowComplete(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("02.3 Does not mark incorrectly", () => {
    it("02.3.1 does not mark cells in incomplete rows", () => {
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

      rowComplete(board, cells);

      expect(cells[0]).toEqual(["star", "unknown", "unknown", "unknown"]);
    });

    it("02.3.2 does not overwrite stars", () => {
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

      rowComplete(board, cells);

      expect(cells[0][0]).toBe("star");
      expect(cells[0][1]).toBe("star");
    });
  });

  describe("02.4 Edge cases", () => {
    it("02.4.1 marks all rows that are complete in one pass", () => {
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

      rowComplete(board, cells);

      expect(cells).toEqual([
        ["star", "marked", "marked"],
        ["star", "marked", "marked"],
        ["star", "marked", "marked"],
      ]);
    });
  });
});
