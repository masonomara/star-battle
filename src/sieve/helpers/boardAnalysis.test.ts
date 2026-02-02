import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "./boardAnalysis";
import { Board, CellState } from "./types";

describe("buildBoardAnalysis", () => {
  it("computes regionStars correctly", () => {
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
    expect(analysis.regionStars.get(0)).toBe(1);
    expect(analysis.regionStars.get(1)).toBe(0);
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

  it("filters activeRegions correctly", () => {
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

    expect(analysis.activeRegionIds.has(0)).toBe(false);
    expect(analysis.activeRegionIds.has(1)).toBe(true);
    expect(analysis.activeRegions.length).toBe(1);
    expect(analysis.activeRegions[0].id).toBe(1);
  });

  it("filters activeRegionsWithUnknowns correctly", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [1, 1],
      ],
      stars: 2,
    };
    const cells: CellState[][] = [
      ["star", "marked"],
      ["unknown", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    // Region 0 needs 1 more star but has no unknowns
    // Region 1 needs 2 stars and has unknowns
    expect(analysis.activeRegions.length).toBe(2);
    expect(analysis.activeRegionsWithUnknowns.length).toBe(1);
    expect(analysis.activeRegionsWithUnknowns[0].id).toBe(1);
  });

  it("builds rowToActiveRegions correctly", () => {
    const board: Board = {
      grid: [
        [0, 0, 1],
        [0, 1, 1],
        [2, 2, 2],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    // Row 0: regions 0, 1
    expect(analysis.rowToActiveRegions.get(0)).toEqual(new Set([0, 1]));
    // Row 1: regions 0, 1
    expect(analysis.rowToActiveRegions.get(1)).toEqual(new Set([0, 1]));
    // Row 2: region 2
    expect(analysis.rowToActiveRegions.get(2)).toEqual(new Set([2]));
  });

  it("builds colToActiveRegions correctly", () => {
    const board: Board = {
      grid: [
        [0, 0, 1],
        [0, 1, 1],
        [2, 2, 2],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];
    const analysis = buildBoardAnalysis(board, cells);

    // Col 0: regions 0, 2
    expect(analysis.colToActiveRegions.get(0)).toEqual(new Set([0, 2]));
    // Col 1: regions 0, 1, 2
    expect(analysis.colToActiveRegions.get(1)).toEqual(new Set([0, 1, 2]));
    // Col 2: regions 1, 2
    expect(analysis.colToActiveRegions.get(2)).toEqual(new Set([1, 2]));
  });

  it("builds regionRows and regionCols from all cells", () => {
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
    expect(analysis.regionRows.get(0)).toEqual(new Set([0, 1]));
    expect(analysis.regionCols.get(0)).toEqual(new Set([0, 1]));
  });

  it("builds regionUnknownRows and regionUnknownCols from unknowns only", () => {
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
    expect(analysis.regionUnknownRows.get(0)).toEqual(new Set([0]));
    expect(analysis.regionUnknownCols.get(0)).toEqual(new Set([1]));

    // Region 1: only (1,1) is unknown
    expect(analysis.regionUnknownRows.get(1)).toEqual(new Set([1]));
    expect(analysis.regionUnknownCols.get(1)).toEqual(new Set([1]));
  });

  it("computes regionMeta starsNeeded correctly", () => {
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

    expect(analysis.regionMetas.get(0)!.starsPlaced).toBe(1);
    expect(analysis.regionMetas.get(0)!.starsNeeded).toBe(1);
    expect(analysis.regionMetas.get(1)!.starsPlaced).toBe(0);
    expect(analysis.regionMetas.get(1)!.starsNeeded).toBe(2);
  });

  it("handles empty board", () => {
    const board: Board = { grid: [], stars: 1 };
    const cells: CellState[][] = [];
    const analysis = buildBoardAnalysis(board, cells);

    expect(analysis.size).toBe(0);
    expect(analysis.regions.size).toBe(0);
    expect(analysis.activeRegions.length).toBe(0);
  });
});
