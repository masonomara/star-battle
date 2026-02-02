import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "./boardAnalysis";
import { Board, CellState } from "./types";

describe("buildBoardAnalysis", () => {
  it("computes starsPlaced correctly", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [0, 1],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["star", "unknown"],
      ["unknown", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);
    expect(analysis.regions.get(0)!.starsPlaced).toBe(1);
    expect(analysis.regions.get(1)!.starsPlaced).toBe(0);
  });

  it("computes rowStars and colStars correctly", () => {
    const board: Board = {
      grid: [
        [0, 0, 1],
        [0, 1, 1],
        [2, 2, 2],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "star"],
    ];
    const analysis = buildBoardAnalysis(board, cells);
    expect(analysis.rowStars).toEqual([1, 1, 1]);
    expect(analysis.colStars).toEqual([1, 1, 1]);
  });

  it("computes starsNeeded correctly", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [1, 1],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["star", "unknown"],
      ["unknown", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    // Region 0 has 1 star, needs 0 more
    expect(analysis.regions.get(0)!.starsNeeded).toBe(0);
    // Region 1 has 0 stars, needs 1 more
    expect(analysis.regions.get(1)!.starsNeeded).toBe(1);
  });

  it("builds rows and cols from all cells", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [0, 1],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["marked", "unknown"],
      ["star", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    // Region 0 spans rows 0,1 and cols 0,1 (all cells, not just unknowns)
    expect(analysis.regions.get(0)!.rows).toEqual(new Set([0, 1]));
    expect(analysis.regions.get(0)!.cols).toEqual(new Set([0, 1]));
  });

  it("builds unknownRows and unknownCols from unknowns only", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [0, 1],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["marked", "unknown"],
      ["star", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    // Region 0: only (0,1) is unknown
    expect(analysis.regions.get(0)!.unknownRows).toEqual(new Set([0]));
    expect(analysis.regions.get(0)!.unknownCols).toEqual(new Set([1]));

    // Region 1: only (1,1) is unknown
    expect(analysis.regions.get(1)!.unknownRows).toEqual(new Set([1]));
    expect(analysis.regions.get(1)!.unknownCols).toEqual(new Set([1]));
  });

  it("computes unknownCoords correctly", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [0, 1],
      ],
      stars: 2,
    };
    const cells: CellState[][] = [
      ["star", "unknown"],
      ["unknown", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    expect(analysis.regions.get(0)!.unknownCoords).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(analysis.regions.get(1)!.unknownCoords).toEqual([[1, 1]]);
  });

  it("handles empty board", () => {
    const board: Board = { grid: [], stars: 1 };
    const cells: CellState[][] = [];
    const analysis = buildBoardAnalysis(board, cells);

    expect(analysis.size).toBe(0);
    expect(analysis.regions.size).toBe(0);
  });
});
