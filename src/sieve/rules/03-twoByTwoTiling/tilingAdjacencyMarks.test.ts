import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import tilingAdjacencyMarks from "./04-tilingAdjacencyMarks/tilingAdjacencyMarks";

describe("08c. Tiling Adjacency Marks", () => {
  describe("Basic adjacency marking", () => {
    it("marks cells that cause adjacency in L-shaped regions", () => {
      // L-shaped region: minTiles=2, starsNeeded=2
      // Some cells may cause adjacency violations in all tilings
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [0, 0, 1, 1],
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

      const result = tilingAdjacencyMarks(board, cells, buildBoardAnalysis(board, cells));

      // The rule detects some adjacency violations
      expect(result).toBe(true);
      // At least one cell should be marked
      const markedCount = cells.flat().filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThan(0);
    });

    it("returns false when no adjacency violations exist", () => {
      // Well-spaced isolated cells that don't cause adjacency issues
      const board: Board = {
        grid: [
          [0, 1, 1, 0, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
        ],
        stars: 3,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingAdjacencyMarks(board, cells, buildBoardAnalysis(board, cells));

      // These cells are well-separated, no adjacency violations
      expect(result).toBe(false);
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

      const result = tilingAdjacencyMarks(board, cells, buildBoardAnalysis(board, cells));

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

      const result = tilingAdjacencyMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(false);
    });

    it("returns false when no unknown cells in region", () => {
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
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingAdjacencyMarks(board, cells, buildBoardAnalysis(board, cells));

      expect(result).toBe(false);
    });
  });
});
