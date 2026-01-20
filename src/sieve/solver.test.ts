import { describe, it, expect } from "vitest";
import { isSolved, isValidLayout, solve } from "./solver";
import { layout } from "./generator";
import { Board, CellState } from "./types";

describe("isValidLayout", () => {
  it("accepts regions meeting minimum size", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 1, 1],
        [0, 0, 1, 1, 1],
        [2, 2, 2, 3, 3],
        [2, 2, 3, 3, 3],
        [4, 4, 4, 4, 4],
      ],
      stars: 2,
    };
    expect(isValidLayout(board)).toBe(true);
  });

  it("rejects region smaller than minimum", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
      stars: 2,
    };
    expect(isValidLayout(board)).toBe(false);
  });
});

describe("isSolved", () => {
  it("recognizes valid solution", () => {
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
      ["marked", "star", "marked", "marked"],
      ["marked", "marked", "marked", "star"],
      ["star", "marked", "marked", "marked"],
      ["marked", "marked", "star", "marked"],
    ];
    expect(isSolved(board, cells)).toBe(true);
  });

  it("rejects adjacent stars", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [2, 2, 2, 2],
        [3, 3, 3, 3],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["star", "marked", "marked", "marked"],
      ["marked", "star", "marked", "marked"],
      ["marked", "marked", "star", "marked"],
      ["marked", "marked", "marked", "star"],
    ];
    expect(isSolved(board, cells)).toBe(false);
  });
});

describe("solve", () => {
  it("does not mutate input board", () => {
    const board: Board = {
      grid: [
        [4, 0, 4, 4],
        [4, 4, 4, 1],
        [2, 4, 4, 4],
        [4, 4, 3, 4],
      ],
      stars: 1,
    };
    const originalGrid = JSON.stringify(board.grid);
    solve(board, 0);
    expect(JSON.stringify(board.grid)).toBe(originalGrid);
  });

  it("returns null on unsolvable layout", () => {
    const board: Board = {
      grid: [
        [0, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };
    expect(solve(board, 0)).toBeNull();
  });

  it("every solution is valid", () => {
    for (let seed = 0; seed < 100; seed++) {
      const board = layout(6, 1, seed);
      const result = solve(board, seed);
      if (result) {
        expect(isSolved(board, result.cells)).toBe(true);
      }
    }
  });

  it("terminates on impossible board", () => {
    const board: Board = { grid: [[0]], stars: 5 };
    expect(solve(board, 0)).toBeNull();
  });
});
