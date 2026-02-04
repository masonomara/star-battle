import { Board, CellState } from "../../helpers/types";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import { describe, it, expect } from "vitest";
import forcedLoneCellPlacement from "./forcedLoneCellPlacement";

describe("06. Forced Lone Cell Placement", () => {
  describe("06.1 Places star in forced lone cell", () => {
    it("06.1.1 places star in lone cell (column)", () => {
      // Column 0 has unknowns at rows 0,1 (adjacent) and row 4 (lone)
      // Needs 2 stars, 2 islands, so row 4 must have a star
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

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const analysis = buildBoardAnalysis(board, cells);
      const result = forcedLoneCellPlacement(board, cells, analysis);

      expect(result).toBe(true);
      expect(cells[4][0]).toBe("star");
    });

    it("06.1.2 places star in lone cell (row)", () => {
      // Row 0 has unknowns at cols 0,1 (adjacent) and col 4 (lone)
      // Needs 2 stars, 2 islands, so col 4 must have a star
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

      const cells: CellState[][] = [
        ["unknown", "unknown", "marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const analysis = buildBoardAnalysis(board, cells);
      const result = forcedLoneCellPlacement(board, cells, analysis);

      expect(result).toBe(true);
      expect(cells[0][4]).toBe("star");
    });

    it("06.1.3 places star in lone cell (region)", () => {
      // Region 0 has unknowns at (0,0),(0,1) (adjacent) and (2,0) (lone)
      // Needs 2 stars, 2 islands, so (2,0) must have a star
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const analysis = buildBoardAnalysis(board, cells);
      const result = forcedLoneCellPlacement(board, cells, analysis);

      expect(result).toBe(true);
      expect(cells[2][0]).toBe("star");
    });

    it("06.1.4 does not place when islands > needed (slack)", () => {
      // Column 0 has unknowns at rows 0,1 and rows 3,4 (2 islands)
      // But needs only 1 star - slack exists
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
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const analysis = buildBoardAnalysis(board, cells);
      const result = forcedLoneCellPlacement(board, cells, analysis);

      expect(result).toBe(false);
    });

    it("06.1.5 does not place when no lone cell", () => {
      // Column 0 has unknowns at rows 0,1 and rows 3,4 (2 islands, 2 cells each)
      // Needs 2 stars, 2 islands, but no lone cell
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

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const analysis = buildBoardAnalysis(board, cells);
      const result = forcedLoneCellPlacement(board, cells, analysis);

      expect(result).toBe(false);
    });
  });
});
