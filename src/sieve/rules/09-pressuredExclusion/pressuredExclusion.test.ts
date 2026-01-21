import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { computeAllStrips } from "../../helpers/strips";
import pressuredExclusion from "./pressuredExclusion";

describe("9. Pressured Exclusion", () => {
  // Pressured exclusion places faux stars on strip cells and checks if ANY
  // row, column, or tight region becomes unsolvable. A single faux star's
  // 8-neighbor marks can span multiple regions/rows/cols simultaneously.

  it("9.1 marks strip cell when faux star would break a tight region", () => {
    // Region 0: single cell at (0,0) → TIGHT (minTiles=1, stars=1)
    // Region 1: fills the rest - has strips throughout
    // Faux star at any neighbor of (0,0) marks (0,0) → region 0 unsolvable
    const board: Board = {
      grid: [
        [0, 1, 1, 1],
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

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    expect(result).toBe(true);
    // At least one neighbor of (0,0) should be marked
    const neighbors = [cells[0][1], cells[1][0], cells[1][1]];
    const markedCount = neighbors.filter((c) => c === "marked").length;
    expect(markedCount).toBeGreaterThanOrEqual(1);
  });

  it("9.2 returns false when no stripCache provided", () => {
    const board: Board = {
      grid: [
        [0, 0],
        [0, 0],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["unknown", "unknown"],
      ["unknown", "unknown"],
    ];

    const result = pressuredExclusion(board, cells, undefined, undefined);
    expect(result).toBe(false);
  });

  it("9.3 returns false when no tight regions exist", () => {
    // Region 0: 2×4 block, minTiles > stars → NOT tight
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
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

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    expect(result).toBe(false);
  });

  it("9.4 marks square that would make grid unsolvable", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 0],
        [1, 1, 1, 0],
        [1, 1, 1, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 2, 0],
        [2, 2, 2, 0],
        [2, 2, 2, 0],
        [0, 0, 2, 0],
      ],
      stars: 2,
    };
    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    // Region 0 spans rows 0-3, col 3 plus scattered cells
    // Region 1 is the cross-shaped area in rows 1-2
    // Region 2 mirrors region 0's shape in rows 6-9
    // Cell (4,2) if starred would block column 2, making region 2 unsolvable
    // because region 2's only column-2 access is through tight cells
    expect(cells[4][2]).toBe("marked");
  });

  it("9.5 marks cell when existing star creates pressure", () => {
    // Pre-placed star at (0,0) already marks its neighbors
    // This creates pressure: region 1 (single cell at 0,2) is now tighter
    // A faux star at (1,2) would mark (0,2), leaving region 1 unsolvable
    const board: Board = {
      grid: [
        [0, 0, 1, 2],
        [0, 0, 2, 2],
        [2, 2, 2, 2],
        [2, 2, 2, 2],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["star", "marked", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    // SPEC EXPECTATION: (1,2) neighbors (0,2) which is region 1's only cell
    // Starring (1,2) would mark (0,2), making region 1 unsolvable
    expect(result).toBe(true);
    // Verify a cell was marked that protects the tight region
    const newMarks: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        // Skip cells that were already marked in initial state
        const wasInitiallyMarked =
          (r === 0 && c === 1) || (r === 1 && c === 0) || (r === 1 && c === 1);
        if (cells[r][c] === "marked" && !wasInitiallyMarked) {
          newMarks.push([r, c]);
        }
      }
    }
    expect(newMarks.length).toBe(1);
  });

  it("9.6 marks cell when 1×n confinement creates row pressure", () => {
    // Region 0: confined to row 0 (cols 0-1) - forms a 1×2 strip
    // Region 1: L-shape needing stars, has strip in row 0
    // Region 2: fills rest
    // The 1×n in region 0 accounts for 1 star in row 0
    // If cell (1,0) were starred, it would mark (0,0) and (0,1),
    // leaving region 0 with 0 cells for 1 star
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [1, 1, 1, 1],
        [2, 2, 2, 2],
        [2, 2, 2, 2],
      ],
      stars: 1,
    };
    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    expect(result).toBe(true);
    // (1,0) or (1,1) should be marked - they neighbor region 0's only cells
    const neighborsMarked =
      cells[1][0] === "marked" || cells[1][1] === "marked";
    expect(neighborsMarked).toBe(true);
  });

  it("9.7 marks cell when L-shaped marks in 2×2 create diagonal pressure", () => {
    // Setup: A tight 2×2 region with L-shaped marks (2 cells marked, 2 unknown)
    // The L-shape means stars must go in specific diagonal pattern
    // Pressure from row/col constraints should trigger exclusion
    const board: Board = {
      grid: [
        [0, 0, 1, 1, 1],
        [0, 0, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
      stars: 2,
    };
    // Region 0 is 2×2, needs 2 stars, can fit exactly 2 (one per 2×2 tile)
    // Mark (0,1) and (1,0) to create L-shape, leaving diagonal (0,0)-(1,1)
    const cells: CellState[][] = [
      ["unknown", "marked", "unknown", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    // With L-shaped marks, region 0 has only diagonal cells (0,0) and (1,1)
    // Stars can't touch diagonally, so region 0 can only fit 1 star, not 2
    // Function detects this and marks (0,0)
    expect(result).toBe(true);
    expect(cells[0][0]).toBe("marked");
    expect(cells.flat().filter((c) => c === "marked").length).toBe(3);
  });

  it("9.8 marks strip cell via column-blocking cascade", () => {
    // Tests the column-blocking logic (lines 527-546 in implementation)
    // Faux star forces all tilings to use a column, blocking that column
    // makes another region unsolvable
    const board: Board = {
      grid: [
        [0, 1, 1, 2],
        [0, 1, 1, 2],
        [0, 1, 1, 2],
        [3, 3, 3, 3],
      ],
      stars: 1,
    };
    // Region 0: column 0 (3 cells)
    // Region 1: columns 1-2 (6 cells)
    // Region 2: column 3 (3 cells)
    // Region 3: row 3 (4 cells)
    // If we mark most of region 2, a faux star that blocks col 3 entirely
    // would make region 2 unsolvable
    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "marked"],
      ["unknown", "unknown", "unknown", "marked"],
      ["unknown", "unknown", "unknown", "unknown"], // (2,3) is region 2's only unknown
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    // Function detects the column-blocking cascade and marks (1,1)
    expect(result).toBe(true);
    expect(cells[1][1]).toBe("marked");
    expect(cells.flat().filter((c) => c === "marked").length).toBe(3);
  });

  it("9.9 handles row-based pressure symmetrically to columns", () => {
    // Mirror of column logic but for rows
    // Region layout where row-blocking would trigger exclusion
    const board: Board = {
      grid: [
        [0, 0, 0, 3],
        [1, 1, 1, 3],
        [1, 1, 1, 3],
        [2, 2, 2, 3],
      ],
      stars: 1,
    };
    // Region 0: row 0, cols 0-2
    // Region 1: rows 1-2, cols 0-2
    // Region 2: row 3, cols 0-2
    // Region 3: column 3
    // Mark most of region 0 to make it tight
    const cells: CellState[][] = [
      ["marked", "marked", "unknown", "unknown"], // (0,2) is region 0's only unknown
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const stripCache = computeAllStrips(board, cells);
    const result = pressuredExclusion(board, cells, undefined, stripCache);

    // SPEC EXPECTATION: Faux star at (1,2) would mark (0,2), leaving region 0 unsolvable
    expect(result).toBe(true);
    // Verify the mark protects the tight region (0,2) by marking a neighbor
    // Neighbors of (0,2): (0,1) already marked, (0,3), (1,1), (1,2), (1,3)
    const newMarks: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const wasInitiallyMarked = r === 0 && c <= 1;
        if (cells[r][c] === "marked" && !wasInitiallyMarked) {
          newMarks.push([r, c]);
        }
      }
    }
    expect(newMarks.length).toBe(1);
  });
});
