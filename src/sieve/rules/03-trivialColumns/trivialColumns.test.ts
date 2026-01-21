import { Board, CellState } from "../../helpers/types";
import trivialColumns from "./trivialColumns";
import { describe, it, expect } from "vitest";

describe("3. Column Complete", () => {
  it("3.1 marks remaining cells when column complete (1 star)", () => {
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

    const result = trivialColumns(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ]);
  });

  it("3.2 marks remaining cells when column complete (2 stars)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialColumns(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "marked", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "marked", "unknown", "unknown"],
    ]);
  });

  it("3.3 returns false when no column complete", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialColumns(board, cells);

    expect(result).toBe(false);
  });

  it("3.4 returns false when no unknowns left", () => {
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
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ];

    const result = trivialColumns(board, cells);

    expect(result).toBe(false);
  });

  it("3.5 marks multiple columns simultaneously", () => {
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
      ["unknown", "unknown", "star"],
    ];

    const result = trivialColumns(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "marked"],
      ["marked", "unknown", "marked"],
      ["marked", "unknown", "star"],
    ]);
  });
});
