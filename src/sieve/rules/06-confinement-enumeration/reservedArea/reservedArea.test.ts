import { Board, CellState } from "../../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardStructure, buildBoardAnalysis } from "../../../helpers/boardAnalysis";
import { boardFromSBF } from "../../../helpers/sbf";
import reservedAreaColumn from "./reservedAreaColumn";
import reservedAreaRow from "./reservedAreaRow";

describe("Reserved Area Column", () => {
  function run(board: Board, cells: CellState[][]): boolean {
    const structure = buildBoardStructure(board);
    const analysis = buildBoardAnalysis(structure, cells);
    return reservedAreaColumn(board, cells, analysis);
  }

  it("marks via cols {4,7} on krazydad puzzle at cycle 33 (first deduction)", () => {
    const board = boardFromSBF(
      "10x2.0000111112003011111203304444220330455555000044455506067777778666777977866677797786777799778888877999",
    );

    // Cycle 33 state: X=marked, .=unknown, ★=star
    const m: CellState = "marked";
    const u: CellState = "unknown";
    const s: CellState = "star";

    const cells: CellState[][] = [
      [m, m, m, m, u, u, u, u, m, s],
      [m, m, s, m, u, m, m, u, m, m],
      [m, m, m, m, u, m, u, m, u, u],
      [m, s, m, m, u, m, u, m, m, m],
      [m, m, m, m, u, m, m, u, u, u],
      [s, m, s, m, m, m, m, m, m, m],
      [m, m, m, m, m, s, m, s, m, m],
      [m, s, m, s, m, m, m, m, m, m],
      [m, m, m, m, m, u, u, u, u, u],
      [s, m, m, s, m, m, m, m, m, m],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    // cols={4,7} exclude region 9 → marks (8,7)
    expect(cells[8][7]).toBe("marked");
  });

  it("marks G3 via cols {6,7} after earlier deduction applied", () => {
    const board = boardFromSBF(
      "10x2.0000111112003011111203304444220330455555000044455506067777778666777977866677797786777799778888877999",
    );

    const m: CellState = "marked";
    const u: CellState = "unknown";
    const s: CellState = "star";

    // Cycle 33 state with (8,7) already marked from first deduction
    const cells: CellState[][] = [
      [m, m, m, m, u, u, u, u, m, s],
      [m, m, s, m, u, m, m, u, m, m],
      [m, m, m, m, u, m, u, m, u, u],
      [m, s, m, m, u, m, u, m, m, m],
      [m, m, m, m, u, m, m, u, u, u],
      [s, m, s, m, m, m, m, m, m, m],
      [m, m, m, m, m, s, m, s, m, m],
      [m, s, m, s, m, m, m, m, m, m],
      [m, m, m, m, m, u, u, m, u, u],
      [s, m, m, s, m, m, m, m, m, m],
    ];

    const result = run(board, cells);

    expect(result).toBe(true);
    // cols={6,7} exclude region 4 → marks (2,6)
    expect(cells[2][6]).toBe("marked");
  });

  it("returns false when outside capacity gives enough slack", () => {
    // 5x1 board where cages have plenty of outside room
    const board: Board = {
      grid: [
        [0, 0, 1, 1, 1],
        [0, 0, 1, 2, 2],
        [3, 3, 3, 2, 2],
        [3, 4, 4, 4, 4],
        [3, 4, 4, 4, 4],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const result = run(board, cells);
    expect(result).toBe(false);
  });
});

describe("Reserved Area Row", () => {
  function run(board: Board, cells: CellState[][]): boolean {
    const structure = buildBoardStructure(board);
    const analysis = buildBoardAnalysis(structure, cells);
    return reservedAreaRow(board, cells, analysis);
  }

  it("marks excluded cage cells when rows are saturated", () => {
    // 6x1 board: rows {0,1} have supply=2. Cages 0,1,2 overlap those rows.
    // Cage 2 cells outside rows {0,1} are far apart → high outside capacity.
    // Cages 0,1 are fully inside rows {0,1} → demand=2 → saturated.
    // Cage 2's cells in rows {0,1} should be marked.
    const board: Board = {
      grid: [
        [0, 0, 2, 1, 1, 1],
        [0, 0, 2, 1, 1, 1],
        [2, 2, 2, 3, 3, 3],
        [4, 4, 4, 3, 3, 3],
        [4, 4, 5, 5, 5, 5],
        [4, 4, 5, 5, 5, 5],
      ],
      stars: 1,
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
    // Cage 2 cells in rows {0,1}: (0,2) and (1,2) should be marked
    expect(cells[0][2]).toBe("marked");
    expect(cells[1][2]).toBe("marked");
  });

  it("returns false when no row saturation exists", () => {
    // Vertical stripe regions — no row set is saturated
    const board: Board = {
      grid: [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
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
});
