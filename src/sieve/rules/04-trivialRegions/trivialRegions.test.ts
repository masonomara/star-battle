import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import trivialRegions from "./trivialRegions";

describe("4. Region Complete", () => {
  it("4.1 marks remaining cells when region complete (1 star)", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ]);
  });

  it("4.2 marks remaining cells when region complete (2 stars)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "star", "marked"],
      ["marked", "marked", "marked", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("4.3 returns false when no region complete", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(false);
  });

  it("4.4 returns false when no unknowns left", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(false);
  });

  it("4.5 marks multiple regions simultaneously", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 1, 1, 1],
        [2, 2, 2, 1],
        [2, 2, 2, 2],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "unknown"],
      ["marked", "star", "marked", "unknown"],
      ["marked", "marked", "marked", "marked"],
    ]);
  });

  it("4.6 handles L-shaped region", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 0, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "marked", "unknown"],
    ]);
  });

  it("4.7 handles scattered (non-contiguous) region", () => {
    const board: Board = {
      grid: [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [0, 1, 1, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegions(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "marked"],
    ]);
  });
});
