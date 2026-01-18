import { describe, it, expect } from "vitest";
import { trivialStarMarks } from "./rules";
import { Board, CellState } from "./types";

describe("trivialStarMarks", () => {
  it("marks all 8 neighbors of a star", () => {
    // 3x3 board, star in center
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

    const result = trivialStarMarks(board, cells);

    // All 8 neighbors should be marked
    expect(result).toEqual([
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ]);
  });

  it("handles star in corner", () => {
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

    const result = trivialStarMarks(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("returns null if no changes made", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Star already has all neighbors marked
    const cells: CellState[][] = [
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toBeNull();
  });
});
