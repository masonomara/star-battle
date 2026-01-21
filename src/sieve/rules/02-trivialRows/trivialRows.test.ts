import { describe, it, expect } from "vitest";
import trivialRows from "./trivialRows";
import { Board, CellState } from "../../helpers/types";

describe("2. Row Complete", () => {
  it("2.1 marks remaining cells when row complete (1 star)", () => {
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

    const result = trivialRows(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("2.2 marks remaining cells when row complete (2 stars)", () => {
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
      ["unknown", "unknown", "unknown", "unknown"],
      ["star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRows(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["unknown", "unknown", "unknown", "unknown"],
      ["star", "marked", "star", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("2.3 returns false when no row complete", () => {
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

    const result = trivialRows(board, cells);

    expect(result).toBe(false);
  });

  it("2.4 returns false when no unknowns left", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRows(board, cells);

    expect(result).toBe(false);
  });

  it("2.5 marks multiple rows simultaneously", () => {
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

    const result = trivialRows(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["marked", "marked", "star"],
    ]);
  });
});
