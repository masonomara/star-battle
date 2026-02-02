import { Board, CellState } from "../../helpers/types";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import { describe, it, expect } from "vitest";
import pressuredCounting from "./pressuredCounting";

function runPressuredCounting(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return pressuredCounting(board, cells, analysis);
}

describe("Rule 16: Pressured Counting", () => {
  // Pressured Counting: When analyzing a row/column pair,
  // each region's contribution is bounded by its capacity outside that pair.
  // If sum of minimum contributions equals required stars, we know
  // exactly how many stars each region contributes, enabling deductions.

  describe("16.1 Basic functionality", () => {
    it("16.1.1 should return boolean", () => {
      // Create a simple 3x3 board
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 1, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      // Call runPressuredCounting(board, cells)
      const result = runPressuredCounting(board, cells);

      // Assert typeof result === "boolean"
      expect(typeof result).toBe("boolean");
    });
  });

  describe("16.2 No-op cases", () => {
    it("16.2.1 should return false when no deductions possible", () => {
      // Create board with no tight constraints
      // Regions span multiple rows/columns evenly - no pressure
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = runPressuredCounting(board, cells);

      // Assert returns false - no tight constraints exist
      expect(result).toBe(false);
    });
  });
});
