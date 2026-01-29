import { describe, it, expect } from "vitest";
import regionComplete from "./regionComplete";
import { Board, CellState } from "../../helpers/types";

describe("04. regionComplete", () => {
  describe("04.1 Marks remaining cells correctly", () => {
    it("04.1.1 marks remaining cells when region has required stars", () => {
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = regionComplete(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });
  });

  describe("04.2 No-op cases", () => {
    it("04.2.1 returns false when no region has required stars", () => {
      // TODO: Add test case
    });
  });

  describe("04.3 Edge cases", () => {
    it("04.3.1 handles minimum grid size", () => {
      // TODO: Add test case
    });
  });
});
