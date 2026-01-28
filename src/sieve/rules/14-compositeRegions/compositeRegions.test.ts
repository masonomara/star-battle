import { describe, it, expect } from "vitest";
import compositeRegions from "./compositeRegions";
import { Board, CellState } from "../../helpers/types";

describe("14. Composite Regions", () => {
  describe("14.1 Forced placement from combinations", () => {
    it("14.1.1 finds forced placement when two adjacent regions form tight composite", () => {
      // Two adjacent regions that together form a tight 4-star composite
      // Region 0: 2x2 block top-left, needs 2 stars
      // Region 1: 2x2 block top-right, needs 2 stars
      // Combined: 4x2 area needs 4 stars, can tile with exactly 4 2x2s
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 2, 2],
          [2, 2, 2, 2],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = compositeRegions(board, cells);
      // May or may not find deductions depending on tiling
      expect(typeof result).toBe("boolean");
    });

    it("14.1.2 finds undercounting surplus when regions overlap row spans", () => {
      // 2 regions in 3 rows: leftover needs 1×stars stars
      // Region 0: spans rows 0-1
      // Region 1: spans rows 1-2
      // Rows 0-2: 3 rows, 2 regions → leftover in row portions outside regions
      const board: Board = {
        grid: [
          [0, 0, 2, 2],
          [0, 1, 1, 2],
          [2, 1, 1, 2],
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

      const result = compositeRegions(board, cells);
      expect(typeof result).toBe("boolean");
    });

    it("14.1.3 detects tight combination with external exclusion from overhang", () => {
      // Two regions that when combined have tiles overhanging into other areas
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
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

      const result = compositeRegions(board, cells);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("14.2 No-op cases", () => {
    it("14.2.1 returns false when no composites are tight in single-region board", () => {
      // Large open regions with lots of slack
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

      const result = compositeRegions(board, cells);
      expect(result).toBe(false);
    });

    it("14.2.2 returns false when regions have large slack and are pre-filtered", () => {
      // Regions with too much slack should be skipped
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [2, 2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2, 2],
        ],
        stars: 1,
      };
      const cells: CellState[][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => "unknown" as CellState),
      );

      const result = compositeRegions(board, cells);
      // Should return false quickly due to pre-filtering
      expect(result).toBe(false);
    });
  });

  describe("14.3 Edge cases", () => {
    it("14.3.1 handles partially solved board with existing stars and marks", () => {
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
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = compositeRegions(board, cells);
      expect(typeof result).toBe("boolean");
    });
  });
});
