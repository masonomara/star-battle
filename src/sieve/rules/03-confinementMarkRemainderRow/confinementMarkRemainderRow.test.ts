import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import confinementMarkRemainderRow from "./confinementMarkRemainderRow";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";

function run(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return confinementMarkRemainderRow(board, cells, analysis);
}

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

describe("09a. confinementMarkRemainderRow", () => {
  it("marks row remainder when region confined to single row", () => {
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
  });

  it("marks row remainder with 2-star confinement", () => {
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
  });

  it("marks when two confined regions together fill row quota", () => {
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
  });

  it("marks row remainder for single-cell region", () => {
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
  });

  it("marks row remainder in 3-star puzzle with row confinement", () => {
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

    expect(run(board, cells)).toBe(true);
    expect(cells[0][6]).toBe("marked");
  });

  it("returns false when regions span multiple rows", () => {
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

  it("returns false when confined region spans entire row", () => {
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

  it("returns false for empty grid", () => {
    const board: Board = { grid: [], stars: 1 };
    const cells: CellState[][] = [];

    expect(run(board, cells)).toBe(false);
  });
});
