import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardStructure, buildBoardAnalysis } from "../../helpers/boardAnalysis";
import tilingForcedRow from "./tilingForcedRow";
import tilingForcedColumn from "./tilingForcedColumn";
import tilingForcedRegion from "./tilingForcedRegion";

describe("08a. Tiling Forced Stars (Row)", () => {
  function run(board: Board, cells: CellState[][]): boolean {
    const structure = buildBoardStructure(board);
    const analysis = buildBoardAnalysis(structure, cells);
    return tilingForcedRow(board, cells, analysis);
  }

  it("places star when row tiling has forced cell", () => {
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

describe("08b. Tiling Forced Stars (Column)", () => {
  function run(board: Board, cells: CellState[][]): boolean {
    const structure = buildBoardStructure(board);
    const analysis = buildBoardAnalysis(structure, cells);
    return tilingForcedColumn(board, cells, analysis);
  }

  it("places star when column tiling has forced cell", () => {
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

describe("08c. Tiling Forced Stars (Region)", () => {
  function run(board: Board, cells: CellState[][]): boolean {
    const structure = buildBoardStructure(board);
    const analysis = buildBoardAnalysis(structure, cells);
    return tilingForcedRegion(board, cells, analysis);
  }

  it("places star when tile covers only one region cell", () => {
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
