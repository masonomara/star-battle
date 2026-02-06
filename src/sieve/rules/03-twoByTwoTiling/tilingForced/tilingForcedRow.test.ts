import { Board, CellState } from "../../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "../../../helpers/boardAnalysis";
import tilingForcedRow from "./tilingForcedRow";

function run(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return tilingForcedRow(board, cells, analysis);
}

describe("08a. Tiling Forced Stars (Row)", () => {
  it("places star when row tiling has forced cell", () => {
    // Row 0: cells [0,0], [0,2], [0,3] are unknown
    // [0,1] is marked, creating isolation
    // Tiling: [0,0] alone, [0,2]-[0,3] together = 2 tiles
    // 2 stars needed, 2 tiles = forced. [0,0] must be star
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    expect(cells[0][0]).toBe("star");
  });

  it("returns false when row has slack (capacity > needed)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
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

  it("skips row when stars already placed", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(false);
  });
});
