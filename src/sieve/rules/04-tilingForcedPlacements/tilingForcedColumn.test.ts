import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import tilingForcedColumn from "./tilingForcedColumn";

function run(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return tilingForcedColumn(board, cells, analysis);
}

describe("08b. Tiling Forced Stars (Column)", () => {
  it("places star when column tiling has forced cell", () => {
    // Column 0: cells [0,0], [2,0], [3,0] are unknown
    // [1,0] is marked, creating isolation
    // Tiling: [0,0] alone, [2,0]-[3,0] together = 2 tiles
    // 2 stars needed, 2 tiles = forced. [0,0] must be star
    const board: Board = {
      grid: [
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    expect(cells[0][0]).toBe("star");
  });

  it("returns false when column has slack (capacity > needed)", () => {
    const board: Board = {
      grid: [
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
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

  it("skips column when stars already placed", () => {
    const board: Board = {
      grid: [
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);

    expect(result).toBe(false);
  });
});
