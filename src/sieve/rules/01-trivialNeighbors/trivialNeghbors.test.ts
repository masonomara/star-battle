import { describe, it } from "node:test";
import { trivialNeighbors } from "./trivialNeighbors";
import { Board, CellState } from "../../helpers/types";
import { expect } from "vitest";

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

  it("1.2 handles corner star (3 neighbors)", () => {
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

    const result = trivialNeighbors(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("1.3 handles edge star (5 neighbors)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialNeighbors(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("1.4 returns false if no changes", () => {
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

  it("1.5 marks neighbors of multiple stars (2 stars)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "star"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialNeighbors(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "unknown", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "marked", "marked"],
      ["unknown", "unknown", "unknown", "marked", "star"],
      ["unknown", "unknown", "unknown", "marked", "marked"],
    ]);
  });

  it("1.6 handles overlapping exclusion zones (shared neighbors)", () => {
    // Two stars at (1,1) and (1,3) share neighbors at (0,2), (1,2), (2,2)
    // Function should mark the intersection correctly without issues
    const board: Board = {
      grid: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialNeighbors(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["marked", "marked", "marked", "marked", "marked"],
      ["marked", "star", "marked", "star", "marked"],
      ["marked", "marked", "marked", "marked", "marked"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("1.7 handles star adjacent to already-marked cells (idempotence)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["marked", "marked", "unknown"],
      ["marked", "star", "unknown"],
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
});
