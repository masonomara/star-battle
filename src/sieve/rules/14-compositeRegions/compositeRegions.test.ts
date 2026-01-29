import { describe, it, expect } from "vitest";
import compositeRegions from "./compositeRegions";
import { Board, CellState } from "../../helpers/types";

describe("14. Composite Regions", () => {
  describe("14.1 No-op cases", () => {
    it("14.1.1 returns false when no composites are tight in single-region board", () => {
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

    it("14.1.2 returns false when regions have large slack and are pre-filtered", () => {
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
});
