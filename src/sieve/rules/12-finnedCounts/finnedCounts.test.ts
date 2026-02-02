import { describe, it, expect } from "vitest";
import finnedCounts from "./finnedCounts";
import { Board, CellState } from "../../helpers/types";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";

function runFinnedCounts(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return finnedCounts(board, cells, analysis);
}

describe("12. finnedCounts", () => {
  // Per spec: marks cells where a hypothetical star would create
  // an undercounting or overcounting violation.

  describe("12.1 Undercounting violations", () => {
    it("12.1.1 marks cell that would leave row-based region with insufficient unknowns", () => {
      // Region 0: row 0, cols 0-1 (2 cells)
      // Region 1: row 0, cols 2-3 (2 cells)
      // Both regions span only row 0 → need 2 stars in 1 row (violation if only 1 star per row)
      // A star at (1,0) would mark (0,0) and (0,1), leaving region 0 with 0 unknown cells
      // but region 0 still needs 1 star → violation
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [2, 2, 2, 2],
          [3, 3, 3, 3],
          [3, 3, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = runFinnedCounts(board, cells);

      expect(result).toBe(true);
      // (1,0) and (1,1) neighbor both region 0 cells - marking would leave region 0 empty
      const someMarked = cells[1][0] === "marked" || cells[1][1] === "marked";
      expect(someMarked).toBe(true);
    });
  });

  describe("12.2 Overcounting detection", () => {
    it("12.2.1 should mark cell that would create overcounting violation", () => {
      // Rows 0-2 span regions 0, 1, 2 (3 regions for 3 rows: balanced)
      // Region 0: cols 0-1 in rows 0-2
      // Region 2: col 2 in rows 0-2
      // Region 1: col 3 in rows 0-2
      // Region 3: row 3
      //
      // A star in region 2 (col 2) marks neighbors in col 2, leaving rows
      // with unknowns only in region 0. Two rows needing stars from one
      // region that can only provide one star = overcounting violation.
      const board: Board = {
        grid: [
          [0, 0, 2, 1],
          [0, 0, 2, 1],
          [0, 0, 2, 1],
          [3, 3, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = runFinnedCounts(board, cells);

      expect(result).toBe(true);
      // Stars in region 2 (column 2) would create overcounting violations
      const colTwoMarked =
        cells[0][2] === "marked" ||
        cells[1][2] === "marked" ||
        cells[2][2] === "marked";
      expect(colTwoMarked).toBe(true);
    });
  });

  describe("12.3 No-op cases", () => {
    it("12.3.1 returns false when large open grid has no violations", () => {
      // Large open grid - plenty of room
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = runFinnedCounts(board, cells);
      expect(result).toBe(false);
    });

    it("12.3.2 skips cells that would not create violations in well-separated grid", () => {
      // Spacious grid where hypothetical stars don't cause problems
      const board: Board = {
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

      runFinnedCounts(board, cells);

      // Count marked cells - should be minimal or none for this layout
      let markedCount = 0;
      for (const row of cells) {
        for (const cell of row) {
          if (cell === "marked") markedCount++;
        }
      }
      // This grid has good separation, shouldn't trigger many violations
      expect(markedCount).toBeLessThanOrEqual(4);
    });
  });

  describe("12.4 Edge cases", () => {
    it("12.4.1 marks cells adjacent to single-cell region that still needs a star", () => {
      // Region 0: single cell at (0,0) - needs 1 star
      // Region 1: rest of top two rows - needs 1 star
      // Region 2: bottom two rows - already has a star at (2,0)
      // Placing a star at (0,1) or (1,0) or (1,1) would mark (0,0), leaving region 0 with 0 unknowns
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [1, 1, 1, 1],
          [2, 2, 2, 2],
          [2, 2, 2, 2],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
      ];

      const result = runFinnedCounts(board, cells);

      expect(result).toBe(true);
      // Cells adjacent to (0,0) that would mark it if starred: (0,1), (1,0), (1,1)
      expect(cells[0][1]).toBe("marked");
      expect(cells[1][0]).toBe("marked");
      expect(cells[1][1]).toBe("marked");
    });
  });
});
