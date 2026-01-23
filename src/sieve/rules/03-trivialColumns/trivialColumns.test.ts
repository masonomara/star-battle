import { describe, it, expect } from "vitest";
import trivialColumns from "./trivialColumns";
import { Board, CellState } from "../../helpers/types";

describe("trivialColumns", () => {
  describe("True Positives - correctly marks remaining cells", () => {
    it("marks remaining cells when column has required stars", () => {
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

      const result = trivialColumns(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
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
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = trivialColumns(board, cells);

      expect(result).toBe(true);
      expect(cells[0][0]).toBe("star");
      expect(cells[1][0]).toBe("marked");
      expect(cells[2][0]).toBe("star");
      expect(cells[3][0]).toBe("marked");
    });

    it("marks cells in multiple complete columns", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "star"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = trivialColumns(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "star"],
        ["marked", "unknown", "marked"],
        ["marked", "unknown", "marked"],
      ]);
    });

    it("marks only unknown cells, preserves marked cells", () => {
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
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = trivialColumns(board, cells);

      expect(result).toBe(true);
      expect(cells[0][0]).toBe("star");
      expect(cells[1][0]).toBe("marked");
      expect(cells[2][0]).toBe("marked");
    });
  });

  describe("True Negatives - correctly returns false", () => {
    it("returns false when no columns are complete", () => {
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

      const result = trivialColumns(board, cells);

      expect(result).toBe(false);
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("returns false when column already fully marked", () => {
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
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = trivialColumns(board, cells);

      expect(result).toBe(false);
    });

    it("returns false when column has fewer stars than required", () => {
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

      const result = trivialColumns(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("False Positives - should not mark incorrectly", () => {
    it("does not mark cells in incomplete columns", () => {
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

      trivialColumns(board, cells);

      expect(cells[1][0]).toBe("unknown");
      expect(cells[2][0]).toBe("unknown");
      expect(cells[3][0]).toBe("unknown");
    });

    it("does not affect other columns when one column is complete", () => {
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

      trivialColumns(board, cells);

      expect(cells[0][1]).toBe("unknown");
      expect(cells[0][2]).toBe("unknown");
      expect(cells[1][1]).toBe("unknown");
      expect(cells[1][2]).toBe("unknown");
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
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      trivialColumns(board, cells);

      expect(cells[0][0]).toBe("star");
      expect(cells[2][0]).toBe("star");
    });
  });

  describe("False Negatives - should not miss markings", () => {
    it("marks all columns that are complete in one pass", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "star", "star"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      trivialColumns(board, cells);

      expect(cells).toEqual([
        ["star", "star", "star"],
        ["marked", "marked", "marked"],
        ["marked", "marked", "marked"],
      ]);
    });

    it("handles last column correctly", () => {
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
        ["unknown", "unknown", "star"],
      ];

      trivialColumns(board, cells);

      expect(cells[0][2]).toBe("marked");
      expect(cells[1][2]).toBe("marked");
      expect(cells[2][2]).toBe("star");
    });

    it("handles middle column correctly", () => {
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

      trivialColumns(board, cells);

      expect(cells[0][1]).toBe("marked");
      expect(cells[1][1]).toBe("star");
      expect(cells[2][1]).toBe("marked");
    });
  });
});
