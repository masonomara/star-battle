import { describe, it, expect } from "vitest";
import trivialNeighbors from "./trivialNeighbors";
import { Board, CellState } from "../../helpers/types";

describe("1. Star Neighbors", () => {
  it("1.1 marks all 8 neighbors", () => {
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

    const result = trivialNeighbors(board, cells);
    expect(result).toBe(true);
    expect(cells).toEqual([
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ]);
  });

  it("1.2 returns false if no changes", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ];

    const result = trivialNeighbors(board, cells);
    expect(result).toBe(false);
  });
});
