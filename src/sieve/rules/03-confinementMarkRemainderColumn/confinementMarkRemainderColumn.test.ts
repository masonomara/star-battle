import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import confinementMarkRemainderColumn from "./confinementMarkRemainderColumn";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";

function run(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return confinementMarkRemainderColumn(board, cells, analysis);
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

describe("09b. confinementMarkRemainderColumn", () => {
  it("marks column remainder when region confined to single column", () => {
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
  });

  it("marks when two confined regions together fill column quota", () => {
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

  it("marks column remainder with 2-star confinement", () => {
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
  });

  it("returns false when regions span multiple columns", () => {
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

  it("returns false for empty grid", () => {
    const board: Board = { grid: [], stars: 1 };
    const cells: CellState[][] = [];

    expect(run(board, cells)).toBe(false);
  });
});
