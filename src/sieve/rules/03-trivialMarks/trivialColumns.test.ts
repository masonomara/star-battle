import { describe, it, expect } from "vitest";
import columnComplete from "./trivialColumn";
import { Board, CellState } from "../../helpers/types";
import { buildBoardStructure, buildBoardState, BoardAnalysis } from "../../helpers/boardAnalysis";
import { makeTilingLens } from "../../helpers/tiling";
import { makeCountingFlowLens } from "../../helpers/countingFlow";

function buildAnalysis(board: Board, cells: CellState[][]): BoardAnalysis {
  const state = buildBoardState(buildBoardStructure(board), cells);
  return {
    ...state,
    getTiling: makeTilingLens(new Map(), state.size),
    getCountingFlow: makeCountingFlowLens(state, board.stars),
  };
}

describe("03. columnComplete", () => {
  describe("03.1 Marks remaining cells correctly", () => {
    it("03.1.1 marks remaining cells when column has required stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("03.1.2 marks remaining cells with 2-star requirement", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells[0][0]).toBe("star");
      expect(cells[1][0]).toBe("marked");
      expect(cells[2][0]).toBe("star");
      expect(cells[3][0]).toBe("marked");
    });

    it("03.1.3 marks cells in multiple complete columns", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "star"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "star"],
        ["marked", "unknown", "marked"],
        ["marked", "unknown", "marked"],
      ]);
    });

    it("03.1.4 marks only unknown cells and preserves marked cells", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(true);
      expect(cells[0][0]).toBe("star");
      expect(cells[1][0]).toBe("marked");
      expect(cells[2][0]).toBe("marked");
    });
  });

  describe("03.2 No-op cases", () => {
    it("03.2.1 returns false when no columns are complete", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(false);
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("03.2.2 returns false when column already fully marked", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(false);
    });

    it("03.2.3 returns false when column has fewer stars than required", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = columnComplete(board, cells, buildAnalysis(board, cells));

      expect(result).toBe(false);
    });
  });

  describe("03.3 Does not mark incorrectly", () => {
    it("03.3.1 does not mark cells in incomplete columns", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      columnComplete(board, cells, buildAnalysis(board, cells));

      expect(cells[1][0]).toBe("unknown");
      expect(cells[2][0]).toBe("unknown");
      expect(cells[3][0]).toBe("unknown");
    });

    it("03.3.2 does not affect other columns when one column is complete", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      columnComplete(board, cells, buildAnalysis(board, cells));

      expect(cells[0][1]).toBe("unknown");
      expect(cells[0][2]).toBe("unknown");
      expect(cells[1][1]).toBe("unknown");
      expect(cells[1][2]).toBe("unknown");
    });

    it("03.3.3 does not overwrite stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      columnComplete(board, cells, buildAnalysis(board, cells));

      expect(cells[0][0]).toBe("star");
      expect(cells[2][0]).toBe("star");
    });
  });

  describe("03.4 Edge cases", () => {
    it("03.4.1 marks all columns that are complete in one pass", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "star", "star"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      columnComplete(board, cells, buildAnalysis(board, cells));

      expect(cells).toEqual([
        ["star", "star", "star"],
        ["marked", "marked", "marked"],
        ["marked", "marked", "marked"],
      ]);
    });

    it("03.4.2 handles last column correctly", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "star"],
      ];

      columnComplete(board, cells, buildAnalysis(board, cells));

      expect(cells[0][2]).toBe("marked");
      expect(cells[1][2]).toBe("marked");
      expect(cells[2][2]).toBe("star");
    });

    it("03.4.3 handles middle column correctly", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "star", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      columnComplete(board, cells, buildAnalysis(board, cells));

      expect(cells[0][1]).toBe("marked");
      expect(cells[1][1]).toBe("star");
      expect(cells[2][1]).toBe("marked");
    });
  });
});
