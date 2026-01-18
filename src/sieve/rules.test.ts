import { describe, it, expect } from "vitest";
import { trivialMarks, twoByTwo } from "./rules";
import { Board, CellState } from "./types";

describe("Trivial Marks", () => {
  it("Marks all 8 neighbors of a star", () => {
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

    const result = trivialMarks(board, cells);

    // All 8 neighbors should be marked
    expect(result).toEqual([
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ]);
  });

  it("Handles star in corner", () => {
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

    const result = trivialMarks(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("Returns null if no changes made", () => {
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

    const result = trivialMarks(board, cells);

    expect(result).toBeNull();
  });
});

describe("The 2x2", () => {
  it("Marks the 4th cell when 3 cells of a 2x2 are marked", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Top-left 2x2 has 3 marked cells, one unknown
    const cells: CellState[][] = [
      ["marked", "marked", "unknown"],
      ["marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = twoByTwo(board, cells);

    // The 4th cell of that 2x2 (row 1, col 1) should now be marked
    expect(result).toEqual([
      ["marked", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("Marks the 4th cell when 2x2 has a star and 2 marked", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // 2x2 with a star counts as "full" - star uses the one allowed spot
    const cells: CellState[][] = [
      ["star", "marked", "unknown"],
      ["marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = twoByTwo(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("Marks 2 cells when 2x2 has a star and 1 marked", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Star means no other stars allowed in this 2x2
    const cells: CellState[][] = [
      ["star", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = twoByTwo(board, cells);

    // Both unknowns in the 2x2 should be marked
    expect(result).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("Marks 3 cells when 2x2 has only a star", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Star with all unknowns around it in the 2x2
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = twoByTwo(board, cells);

    // All 3 unknowns in the 2x2 should be marked
    expect(result).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("Returns null if no changes made", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // All 2x2s have 2+ unknowns, nothing to mark
    const cells: CellState[][] = [
      ["marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = twoByTwo(board, cells);

    expect(result).toBeNull();
  });
});
