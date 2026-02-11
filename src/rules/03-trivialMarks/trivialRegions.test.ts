import { describe, it, expect } from "vitest";
import { Board, CellState } from "../../helpers/types";
import { buildBoardStructure, buildBoardAnalysis } from "../../helpers/boardAnalysis";
import trivialRegion from "./trivialRegion";

function buildAnalysis(board: Board, cells: CellState[][]) {
  return buildBoardAnalysis(buildBoardStructure(board), cells);
}

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

      const result = trivialRegion(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });
  });
});
