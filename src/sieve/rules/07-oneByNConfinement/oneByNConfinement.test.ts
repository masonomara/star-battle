import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import oneByNConfinement from "./oneByNConfinement";
import { computeAllStrips } from "../../helpers/strips";

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

function run(board: Board, cells: CellState[][]): boolean {
  return oneByNConfinement(board, cells, undefined, computeAllStrips(board, cells));
}

describe("7. The 1×n Confinement", () => {
  describe("Row confinement", () => {
    it("marks row remainder when region confined to single row", () => {
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

      expect(run(board, cells)).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });

    it("marks row remainder with 2★ confinement", () => {
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

      expect(run(board, cells)).toBe(true);
      expect(cells[2][3]).toBe("marked");
      expect(cells[2][4]).toBe("marked");
      expect(cells[2][5]).toBe("marked");
    });

    it("marks when two 1×n regions together fill row quota", () => {
      // Regions 1 and 2 each confined to row 1, together account for 2★
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

      expect(run(board, cells)).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });
  });

  describe("Column confinement", () => {
    it("marks column remainder when region confined to single column", () => {
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

      expect(run(board, cells)).toBe(true);
      expect(cells[2][1]).toBe("marked");
      expect(cells[3][1]).toBe("marked");
    });

    it("marks when two 1×n regions together fill column quota", () => {
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

      expect(run(board, cells)).toBe(true);
      expect(cells[2][1]).toBe("marked");
    });

    it("marks column remainder with 2★ confinement", () => {
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

      expect(run(board, cells)).toBe(true);
      expect(cells[3][0]).toBe("marked");
      expect(cells[4][0]).toBe("marked");
    });
  });

  describe("No confinement", () => {
    it("returns false when regions span multiple rows and columns", () => {
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

      expect(run(board, cells)).toBe(false);
    });

    it("returns false when region already has all stars", () => {
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

      expect(run(board, cells)).toBe(false);
    });

    it("returns false when 1×n spans entire row (nothing to mark)", () => {
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

      expect(run(board, cells)).toBe(false);
    });

    it("returns false when regions span multiple rows despite existing star", () => {
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

      expect(run(board, cells)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("handles single-cell region (trivially confined)", () => {
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

      expect(run(board, cells)).toBe(true);
      expect(cells[0][1]).toBe("marked");
      expect(cells[0][2]).toBe("marked");
      expect(cells[0][3]).toBe("marked");
    });

    it("returns false when stripCache is undefined", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        stars: 1,
      };
      const cells = makeCells(["....", "...."]);

      const result = oneByNConfinement(board, cells, undefined, undefined);

      expect(result).toBe(false);
      expect(cells.flat().every((c) => c === "unknown")).toBe(true);
    });

    it("handles 3★ puzzle with row confinement", () => {
      // Region 0 unknowns all in row 0, needs 3★
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0, 1, 1],
          [0, 0, 0, 0, 0, 0, 1, 1],
          [0, 0, 0, 0, 0, 0, 1, 1],
          [2, 2, 2, 2, 2, 2, 2, 2],
        ],
        stars: 3,
      };
      const cells = makeCells([
        "........",
        "xxxxxx..",
        "xxxxxx..",
        "........",
      ]);

      expect(run(board, cells)).toBe(true);
      expect(cells[0][6]).toBe("marked");
      expect(cells[0][7]).toBe("marked");
    });
  });
});
