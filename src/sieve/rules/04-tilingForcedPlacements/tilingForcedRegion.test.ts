import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import tilingForcedRegion from "./tilingForcedRegion";

function run(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return tilingForcedRegion(board, cells, analysis);
}

describe("08c. Tiling Forced Stars (Region)", () => {
  it("places star when tile covers only one region cell", () => {
    // L-shaped region 0: cells at [0,0], [0,1], [0,2], [1,0], [1,1]
    // Cell [0,2] is isolated from neighbors within the region
    // minTiles=2, stars=2 → forced
    const board: Board = {
      grid: [
        [0, 0, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    expect(cells[0][2]).toBe("star");
  });

  it("returns false when minTiles > starsNeeded", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 1],
        [1, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(false);
  });

  it("places star when existing star reduces quota to match tiles", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "marked", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    expect(cells[0][2]).toBe("star");
  });

  it("skips cell when only some tilings have single coverage", () => {
    // Region 0 is a 2x4 block - multiple tiling options exist
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
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(false);
  });

  it("skips region when all stars already placed", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "marked", "star", "unknown"],
      ["marked", "marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(false);
  });

  it("returns false when region fits entirely within one 2x2", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(false);
  });

  it("places one star per call for isolated cells", () => {
    const board: Board = {
      grid: [
        [0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
      ],
      stars: 3,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    const starCount = cells.flat().filter((c) => c === "star").length;
    expect(starCount).toBe(1);
  });
});
