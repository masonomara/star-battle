import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import tilingOverhangMarks from "./tilingOverhangMarks";

describe("08b. Tiling Overhang Marks", () => {
  describe("Basic overhang marking", () => {
    it("marks overhang cells for 2-cell region", () => {
      // 2 adjacent cells: (0,0), (0,1)
      // minTiles=1, starsNeeded=1
      // Tile overhang cells (1,0) and (1,1) get marked
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells[1][0]).toBe("marked");
      expect(cells[1][1]).toBe("marked");
    });

    it("marks all overhang cells when region spans full row", () => {
      // Full row region: 4 cells horizontally
      // Row 1 cells are overhang in ALL tilings → get marked
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(true);
      const markedCount = cells[1].filter((c) => c === "marked").length;
      expect(markedCount).toBe(4);
    });

    it("marks all overhang cells when region spans full column", () => {
      // Full column region: 4 cells vertically
      // Column 1 cells are overhang in ALL tilings → get marked
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(true);
      const col1Marked = cells.filter((row) => row[1] === "marked").length;
      expect(col1Marked).toBe(4);
    });

    it("marks non-region overhang cells when minTiles === starsNeeded", () => {
      // Region 0 is a 1×2 horizontal strip at top-left
      // minTiles=1, starsNeeded=1 → the tile overhang (row 1) gets marked
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells[1][0]).toBe("marked");
      expect(cells[1][1]).toBe("marked");
    });
  });

  describe("Edge cases", () => {
    it("returns false when minTiles !== starsNeeded", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(false);
    });

    it("returns false when no overhang cells exist", () => {
      // 2x2 region block: all 4 cells fit in one tile, no overhang
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(false);
    });

    it("skips region when all stars already placed", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingOverhangMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(false);
    });
  });
});
