import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import oneByNConfinement from "./oneByNConfinement";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";

function runOneByNConfinement(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return oneByNConfinement(board, cells, analysis);
}

/** Create a cells grid from compact string representation */
function makeCells(rows: string[]): CellState[][] {
  return rows.map((row) =>
    row.split("").map((c) => {
      if (c === ".") return "unknown";
      if (c === "x") return "marked";
      if (c === "*") return "star";
      throw new Error(`Unknown cell: ${c}`);
    }),
  );
}

describe("09. oneByNConfinement", () => {
  describe("09.1 Row confinement", () => {
    it("09.1.1 marks row remainder when region confined to single row", () => {
      // Region 1 unknowns all in row 1 → mark rest of row 1
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [1, 1, 0, 0],
          [1, 1, 0, 0],
        ],
        stars: 1,
      };
      const cells = makeCells(["....", "....", "xx..", "xx.."]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });

    it("09.1.2 marks row remainder with 2-star confinement", () => {
      // Region 0 unknowns all in row 2 → mark rest of row 2
      const board: Board = {
        grid: [
          [0, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1],
          [0, 0, 0, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
        ],
        stars: 2,
      };
      const cells = makeCells(["x.....", "x.....", "......", "......"]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[2][3]).toBe("marked");
      expect(cells[2][4]).toBe("marked");
      expect(cells[2][5]).toBe("marked");
    });

    it("09.1.3 marks when two confined regions together fill row quota", () => {
      // Regions 1 and 2 each confined to row 1, together account for 2 stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [1, 1, 0, 0, 2, 2],
          [1, 1, 0, 0, 2, 2],
          [1, 1, 0, 0, 2, 2],
        ],
        stars: 2,
      };
      const cells = makeCells(["......", "......", "xx..xx", "xx..xx"]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });
  });

  describe("09.2 Column confinement", () => {
    it("09.2.1 marks column remainder when region confined to single column", () => {
      // Region 1 unknowns all in col 1 → mark rest of col 1
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [0, 1, 1, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells = makeCells(["..x.", "..x.", "....", "...."]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[2][1]).toBe("marked");
      expect(cells[3][1]).toBe("marked");
    });

    it("09.2.2 marks when two confined regions together fill column quota", () => {
      // Regions 1 and 2 each confined to col 1
      const board: Board = {
        grid: [
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 0, 0],
          [0, 2, 0, 0],
          [0, 2, 0, 0],
        ],
        stars: 2,
      };
      const cells = makeCells(["x...", "x...", "....", "x...", "x..."]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[2][1]).toBe("marked");
    });

    it("09.2.3 marks column remainder with 2-star confinement", () => {
      // Region 0 unknowns all in col 0 → mark rest of col 0
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };
      const cells = makeCells(["....", "....", ".x..", "....", "...."]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[3][0]).toBe("marked");
      expect(cells[4][0]).toBe("marked");
    });
  });

  describe("09.3 No-op cases", () => {
    it("09.3.1 returns false when regions span multiple rows and columns", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells = makeCells(["....", "....", "....", "...."]);

      expect(runOneByNConfinement(board, cells)).toBe(false);
    });

    it("09.3.2 returns false when region already has all stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        stars: 1,
      };
      const cells = makeCells(["*x..", "xx..", "xx..", "xx.."]);

      expect(runOneByNConfinement(board, cells)).toBe(false);
    });

    it("09.3.3 returns false when confined region spans entire row", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells = makeCells(["....", "....", "....", "...."]);

      expect(runOneByNConfinement(board, cells)).toBe(false);
    });

    it("09.3.4 returns false when regions span multiple rows despite existing star", () => {
      const board: Board = {
        grid: [
          [0, 1, 1, 2, 2],
          [0, 1, 1, 2, 2],
          [0, 1, 1, 2, 2],
          [0, 1, 1, 2, 2],
        ],
        stars: 2,
      };
      const cells = makeCells(["*....", "x....", "x....", "x...."]);

      expect(runOneByNConfinement(board, cells)).toBe(false);
    });
  });

  describe("09.4 Edge cases", () => {
    it("09.4.1 marks row remainder for single-cell region", () => {
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };
      const cells = makeCells(["....", "....", "....", "...."]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[0][1]).toBe("marked");
      expect(cells[0][2]).toBe("marked");
      expect(cells[0][3]).toBe("marked");
    });

    it("09.4.2 returns false for empty grid", () => {
      const board: Board = { grid: [], stars: 1 };
      const cells: CellState[][] = [];

      expect(runOneByNConfinement(board, cells)).toBe(false);
    });

    it("09.4.3 marks row remainder in 3-star puzzle with row confinement", () => {
      // Region 0 unknowns all in row 0, needs 3 stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0, 1, 1],
          [0, 0, 0, 0, 0, 0, 1, 1],
          [0, 0, 0, 0, 0, 0, 1, 1],
          [2, 2, 2, 2, 2, 2, 2, 2],
        ],
        stars: 3,
      };
      const cells = makeCells(["........", "xxxxxx..", "xxxxxx..", "........"]);

      expect(runOneByNConfinement(board, cells)).toBe(true);
      expect(cells[0][6]).toBe("marked");
      expect(cells[0][7]).toBe("marked");
    });
  });
});
