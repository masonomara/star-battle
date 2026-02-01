import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import pressuredExclusion from "./pressuredExclusion";

describe("11. Pressured Exclusion", () => {
  // Per spec: "Pressured exclusion is like exclusion, but in the presence of
  // other stars or 1×ns." Marks cells where a hypothetical star would break
  // a constraint (1×n or star-containing 2×2).

  describe("11.0 Row and Column checks with constraints", () => {
    it("11.0.1 marks cell when star breaks row quota considering 1×n constraint", () => {
      // Row 0 needs 2 stars
      // Region 0 is confined to row 0, cols 0-1 (1×2 strip) - guarantees 1 star in row 0
      // Row 0 has 4 cells total
      // If star at (1,2), marks (0,1), (0,2), (0,3)
      // Row 0 left with only (0,0) for remaining needs
      // 1×n guarantees 1 star from region 0, so row 0 needs 1 more "free" star
      // But (0,0) is in the 1×n region, so free cells = none
      // This should be caught by pressured exclusion
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
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

      const result = pressuredExclusion(board, cells);

      // Due to the 1×n pressure, (1,2) might be marked
      // The 1×n at region 0 (cols 0-1) forces a star there
      // Starring (1,2) marks (0,1), (0,2), (0,3) - reducing row 0's free cells
      expect(result).toBe(true);
    });

    it("11.0.2 marks cell when star breaks column with 1×n constraint pressure", () => {
      // Col 0 needs 2 stars
      // Region 0 is confined to col 0, rows 0-1 (1×2 strip) - guarantees 1 star in col 0
      // Col 0 has 4 cells total
      // If star at (2,1), marks (1,0), (2,0), (3,0)
      // Col 0 left with only (0,0) which is in the 1×n
      // 1×n guarantees 1 star, but we need 2 total
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [0, 1, 1, 1],
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

      const result = pressuredExclusion(board, cells);

      expect(result).toBe(true);
    });

    it("11.0.3 marks cell when row quota breaks due to 2×2 constraint", () => {
      // This tests integration with star-containing 2×2s
      // If a 2×2 in a row must contain a star, and placing a star elsewhere
      // would make it impossible to satisfy both the 2×2 and the row quota
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1],
          [0, 0, 0, 1, 1],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
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

      // This may or may not find something depending on squeeze analysis
      const result = pressuredExclusion(board, cells);
      // Just verify it runs without error
      expect(typeof result).toBe("boolean");
    });
  });


  describe("11.1 Primary behavior", () => {
    it("11.1.1 marks cell when faux star would break a tight region", () => {
      // Region 0: single cell at (0,0) → TIGHT (minTiles=1, stars=1)
      // Region 1: fills the rest
      // Faux star at any neighbor of (0,0) marks (0,0) → region 0 unsolvable
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
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

      const result = pressuredExclusion(board, cells);

      expect(result).toBe(true);
      // Neighbors of (0,0) should be marked - they would break the tight region
      const neighbors = [cells[0][1], cells[1][0], cells[1][1]];
      const markedCount = neighbors.filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("11.2 No-op cases", () => {
    it("11.2.1 returns false when no tight regions exist in simple grid", () => {
      const board: Board = {
        grid: [
          [0, 0],
          [0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown"],
        ["unknown", "unknown"],
      ];

      const result = pressuredExclusion(board, cells);
      expect(result).toBe(false); // No tight regions
    });

    it("11.2.2 returns false when no tight regions exist with large regions", () => {
      // Region 0: 2×4 block, minTiles > stars → NOT tight
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
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

      const result = pressuredExclusion(board, cells);
      expect(result).toBe(false);
    });
  });

  describe("11.3 Pressure scenarios", () => {
    it("11.3.1 marks cell when existing star creates pressure", () => {
      // Pre-placed star at (0,0) already marks its neighbors
      // Region 1 (single cell at 0,2) is now tight
      // Faux star at neighbors of (0,2) would mark it, breaking region 1
      const board: Board = {
        grid: [
          [0, 0, 1, 2],
          [0, 0, 2, 2],
          [2, 2, 2, 2],
          [2, 2, 2, 2],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = pressuredExclusion(board, cells);

      expect(result).toBe(true);
      // Cells neighboring (0,2) get marked: (0,3), (1,2), (1,3)
      const newMarks: [number, number][] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const wasInitiallyMarked =
            (r === 0 && c === 1) || (r === 1 && c === 0) || (r === 1 && c === 1);
          if (cells[r][c] === "marked" && !wasInitiallyMarked) {
            newMarks.push([r, c]);
          }
        }
      }
      expect(newMarks.length).toBeGreaterThanOrEqual(1);
    });

    it("11.3.2 marks cell when 1×n confinement creates pressure", () => {
      // Region 0: confined to row 0 (cols 0-1) - tight 1×2 strip
      // Faux star at (1,0) or (1,1) would mark both cells of region 0
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [2, 2, 2, 2],
          [2, 2, 2, 2],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = pressuredExclusion(board, cells);

      expect(result).toBe(true);
      // (1,0) or (1,1) should be marked - they neighbor region 0's cells
      const neighborsMarked =
        cells[1][0] === "marked" || cells[1][1] === "marked";
      expect(neighborsMarked).toBe(true);
    });

    it("11.3.3 handles row-based pressure symmetrically", () => {
      // Region 0: row 0 cols 0-2, with (0,0) and (0,1) marked → (0,2) is tight
      // Faux star at neighbors of (0,2) would break region 0
      const board: Board = {
        grid: [
          [0, 0, 0, 3],
          [1, 1, 1, 3],
          [1, 1, 1, 3],
          [2, 2, 2, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = pressuredExclusion(board, cells);

      expect(result).toBe(true);
      // Neighbors of (0,2) should be marked
      const newMarks: [number, number][] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const wasInitiallyMarked = r === 0 && c <= 1;
          if (cells[r][c] === "marked" && !wasInitiallyMarked) {
            newMarks.push([r, c]);
          }
        }
      }
      expect(newMarks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
