import { Board, CellState, Coord } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { findAllMinimalTilings } from "../../helpers/tiling";
import twoByTwoTiling from "./twoByTwoTiling";

describe("6. The 2×2 Tiling", () => {
  describe("6.1 Single-cell tile forces star", () => {
    it("6.1.1 places star when tile covers only one region cell (spec example_tiling_1b)", () => {
      // L-shaped region from spec example_tiling_1a/1b:
      // Region 0:  R R R    (row 0: cols 0,1,2)
      //            R R .    (row 1: cols 0,1)
      // In a 2★ puzzle, minTiles=2, so each tile has exactly 1 star.
      // One tile covers only cell (0,2) from the region → must be a star.
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

      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star"); // single-cell tile forces this
    });

    it("6.1.2 does not place star if minTiles > stars needed", () => {
      // Region needs 1 star but minTiles=2 → no forced placement
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

      const result = twoByTwoTiling(board, cells);

      // Should not place any stars (minTiles=2 > stars=1 for region 0)
      expect(cells.flat().filter((c) => c === "star").length).toBe(0);
    });

    it("6.1.3 places star with existing star reducing quota", () => {
      // Region 0: L-shape needing 2 stars, but 1 already placed
      // After existing star, needed=1, minTiles=1 → single-cell forced
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

      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star");
    });
  });

  describe("6.2 All tilings must agree", () => {
    it("6.2.1 does not place star if cell is single-coverage in only some tilings", () => {
      // Shape where different tilings have different single-cell tiles
      // Only place star if ALL tilings agree that cell has single coverage
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // 2x4 region - can be tiled multiple ways
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      twoByTwoTiling(board, cells);

      // 2x4 can be tiled with 2 tiles, matching stars=2
      // But tilings vary, so no single cell is forced
      // (This test verifies no false positives)
      const stars = cells.flat().filter((c) => c === "star").length;
      expect(stars).toBe(0);
    });
  });

  describe("6.3 Marked cells affect tiling", () => {
    it("6.3.1 marked cells excluded from tiling computation", () => {
      // 1x4 horizontal strip: (0,0), (0,1), (0,2), (0,3)
      // stars = 2, normally minTiles = 2 with no single-cell tiles
      //
      // Mark (0,1) → remaining unknowns: (0,0), (0,2), (0,3)
      // Now (0,0) is isolated (no 2x2 can cover both (0,0) and (0,2))
      // minTiles still = 2, but (0,0) is a forced single-cell tile
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

      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(true);
      expect(cells[0][0]).toBe("star");
    });
  });

  describe("6.4 Edge cases", () => {
    it("6.4.1 returns false when minTiles < starsNeeded", () => {
      // Region 0: 2 adjacent cells can only fit 1 star (minTiles=1)
      // But puzzle requires 2 stars per region → unsolvable
      // Rule should return false (no forced placement possible)
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [1, 1, 1, 1],
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

      const result = twoByTwoTiling(board, cells);

      // minTiles=1 != starsNeeded=2, so rule skips this region
      expect(result).toBe(false);
      // No cells should be modified
      expect(cells[0][0]).toBe("unknown");
      expect(cells[0][1]).toBe("unknown");
    });

    it("6.4.2 skips region when all stars already placed", () => {
      // Region 0 already has 2 stars (quota met)
      // Rule should skip it entirely
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

      const result = twoByTwoTiling(board, cells);

      // Region 0 complete (needed=0), region 1 is large rectangle (no single-cell tiles)
      expect(result).toBe(false);
    });

    it("6.4.4 handles 2-cell region (minimum non-trivial)", () => {
      // 2 adjacent cells: (0,0), (0,1)
      // minTiles=1 (one 2x2 covers both), starsNeeded=1
      // Neither cell is a single-cell tile → no forced placement
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
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

      const result = twoByTwoTiling(board, cells);

      // minTiles=1, starsNeeded=1, but no single-cell tile exists
      expect(result).toBe(false);
    });

    it("6.4.5 handles region entirely within one 2×2", () => {
      // 2x2 region block: all 4 cells fit in one tile
      // minTiles=1, starsNeeded=1 → no single-cell tile
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

      const result = twoByTwoTiling(board, cells);

      // minTiles=1, starsNeeded=1, but all cells share the same tile
      expect(result).toBe(false);
    });

    it("6.4.6 handles region spanning full row", () => {
      // Full row region: 4 cells horizontally
      // minTiles=2 (each 2x2 covers at most 2 cells), starsNeeded=2
      // Multiple tilings exist, no single-cell forced
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
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      // Multiple tilings: {(0,0),(0,1)} + {(0,2),(0,3)} or overlapping variants
      // No cell is single-coverage in ALL tilings
      expect(result).toBe(false);
    });

    it("6.4.7 handles region spanning full column", () => {
      // Full column region: 4 cells vertically
      // minTiles=2 (each 2x2 covers at most 2 cells), starsNeeded=2
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
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      // Symmetric to row case - no forced single-cell
      expect(result).toBe(false);
    });
  });

  describe("6.5 Spec coverage gaps", () => {
    it("6.5.1 gracefully handles minTiles > starsNeeded (region bounds capacity)", () => {
      // Region 0: 3 cells in an L that requires 2 tiles minimum
      // But puzzle is 3★, meaning region needs 3 stars
      // minTiles=2 < starsNeeded=3 → impossible, but function should not crash
      // This tests the bounding behavior from spec example_tiling_2
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [0, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
        ],
        stars: 3,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      // Should return false (no progress) without crashing
      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(false);
      // No cells should be modified
      expect(cells.flat().every((c) => c === "unknown")).toBe(true);
    });

    it("6.5.2 handles 3★ puzzle with region requiring 3+ tiles", () => {
      // Region 0: 3 cells that are truly isolated (no 2×2 can cover more than one)
      // Cells at (0,0), (0,3), (3,0) - each at least 2 apart in row OR column
      // minTiles=3, starsNeeded=3 → each tile has exactly one star
      // Each tile covers only 1 region cell → all three are forced
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

      const result = twoByTwoTiling(board, cells);

      // Each cell is isolated → each forms its own single-cell tile
      // minTiles=3, starsNeeded=3 → each must have a star
      // Function places one at a time, so should place at least one
      expect(result).toBe(true);
      const starCount = cells.flat().filter((c) => c === "star").length;
      expect(starCount).toBe(1);
    });

    it("6.5.3 places only one star per invocation even with multiple single-cell tiles", () => {
      // Region with multiple isolated cells (each is single-cell tile)
      // Verifies function returns after placing first star
      const board: Board = {
        grid: [
          [0, 1, 0, 1],
          [1, 1, 1, 1],
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

      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(true);
      // Should place exactly one star (function returns after first placement)
      const starCount = cells.flat().filter((c) => c === "star").length;
      expect(starCount).toBe(1);
      // One of the two isolated cells should be starred
      expect(cells[0][0] === "star" || cells[0][2] === "star").toBe(true);
    });

    it("6.5.4 does not mark cells (only places stars)", () => {
      // This documents the boundary: the function places stars but does NOT mark cells
      // Even when a cell could theoretically be excluded by tiling logic
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

      twoByTwoTiling(board, cells);

      // Count marked cells - should be zero (function doesn't mark)
      const markedCount = cells.flat().filter((c) => c === "marked").length;
      expect(markedCount).toBe(0);
    });

    it("6.5.5 processes multiple regions in single call", () => {
      // Two regions, each with a single-cell forcing opportunity
      // Verifies function iterates regions (places star in first eligible)
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [0, 0, 2, 2],
          [2, 2, 2, 2],
          [2, 2, 2, 2],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(true);
      // Region 0 (L-shape) should have star placed at (0,2)
      expect(cells[0][2]).toBe("star");
    });
  });

  describe("6.6 Cache parity", () => {
    it("6.6.1 produces identical results with and without tilingCache", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // Run without cache
      const cellsNoCache: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];
      const resultNoCache = twoByTwoTiling(board, cellsNoCache);

      // Build cache manually and run with it
      const cellsWithCache: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const size = board.grid.length;
      const byRegion = new Map();

      // Region 0: L-shape at (0,0), (0,1), (0,2), (1,0), (1,1)
      const region0Coords: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
      ];
      const result0 = findAllMinimalTilings(region0Coords, cellsWithCache, size);
      byRegion.set(0, { ...result0, regionId: 0, cells: region0Coords });

      // Region 1: rest of the board
      const region1Coords: Coord[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board.grid[r][c] === 1) region1Coords.push([r, c]);
        }
      }
      const result1 = findAllMinimalTilings(region1Coords, cellsWithCache, size);
      byRegion.set(1, { ...result1, regionId: 1, cells: region1Coords });

      const tilingCache = { byRegion };
      const resultWithCache = twoByTwoTiling(
        board,
        cellsWithCache,
        tilingCache,
      );

      // Results should match
      expect(resultWithCache).toBe(resultNoCache);
      expect(cellsWithCache).toEqual(cellsNoCache);
    });
  });

});
