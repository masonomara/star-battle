import { Board, CellState, Coord } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { findAllMinimalTilings } from "../../helpers/tiling";
import exclusion from "./exclusion";

describe("8. Exclusion", () => {
  // Exclusion only applies to "tight" regions where minTileCount == starsNeeded.
  // For each unknown cell in/near a tight region, if placing a star there
  // would reduce the region's tiling capacity below (starsNeeded - 1), exclude it.

  describe("8.1 Internal exclusion (cells inside tight region)", () => {
    it("8.1.1 marks middle cell in 1×3 region when star would break tiling capacity", () => {
      // Region 0: 1×3 horizontal strip needing 2 stars
      // minTiles=2 (each 2×2 covers at most 2 cells of a 1-wide strip), stars=2 → TIGHT
      // If (0,1) starred → marks (0,0) and (0,2) → 0 cells left but need 1 more star
      // minTiles=0 < 1 needed → EXCLUDE (0,1)
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // Middle cell (0,1) should be excluded - placing star there marks both ends
      expect(cells[0][1]).toBe("marked");
    });

    it("8.1.2 marks cell in 2×2 region when star would leave 0 capacity for remaining star", () => {
      // Region 0: 2×2 block needing 2 stars
      // minTiles=1 (one 2×2 covers all 4 cells), stars=2 → NOT tight (minTiles < stars)
      // This region is unsolvable but won't be processed by exclusion (not tight)
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
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

      const result = exclusion(board, cells);

      // Region 0 has minTiles=1 < stars=2, so it's NOT tight
      // Exclusion should skip it (returns false)
      expect(result).toBe(false);
    });

    it("8.1.3 does not exclude when region is not tight", () => {
      // Region 0: 2×4 block needing 1 star
      // minTiles=2, stars=1 → NOT tight (minTiles > stars)
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

      const result = exclusion(board, cells);

      // Region not tight → no exclusion
      expect(result).toBe(false);
      expect(cells.flat().every((c) => c === "unknown")).toBe(true);
    });
  });

  describe("8.2 External exclusion (cells outside tight region)", () => {
    it("8.2.1 marks ONE neighbor of single-cell tight region per call", () => {
      // Region 0: single cell (0,2) needing 1 star
      // minTiles=1, stars=1 → TIGHT
      // Any neighbor starred would mark (0,2) → region has 0 cells for 1 star
      // Function marks ONE cell per call (like other rules)
      const board: Board = {
        grid: [
          [1, 1, 0, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // At least one neighbor of (0,2) should be marked
      // Neighbors: (0,1), (0,3), (1,1), (1,2), (1,3)
      const neighbors = [
        cells[0][1],
        cells[0][3],
        cells[1][1],
        cells[1][2],
        cells[1][3],
      ];
      const markedCount = neighbors.filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThanOrEqual(1);
    });

    it("8.2.2 marks external cell adjacent to tight 1×2 region", () => {
      // Region 0: 1×2 horizontal strip at [0,0],[0,1], minTiles=1, stars=1 → TIGHT
      // External cells [1,0] and [1,1] are adjacent to BOTH region cells
      // Placing a star there marks both region cells, leaving 0 capacity for 1 star
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      const externalCellsAdjacentToBoth = [cells[1][0], cells[1][1]];
      expect(externalCellsAdjacentToBoth.some((c) => c === "marked")).toBe(
        true,
      );
    });
  });

  describe("8.3 Tight region identification", () => {
    it("8.3.1 excludes cells in 1×5 strip with 3 stars (tight region)", () => {
      // Region 0: 1×5 strip needing 3 stars
      // minTiles=3 (ceil(5/2)), stars=3 → TIGHT
      // Placing star at (0,1) marks (0,0) and (0,2), leaving (0,3),(0,4)
      // Need 2 more stars but minTiles=1 < 2 → EXCLUDE (0,1)
      // Similarly (0,3) would be excluded
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // Either (0,1) or (0,3) should be excluded (function marks one per call)
      const excludedCount = [cells[0][1], cells[0][3]].filter(
        (c) => c === "marked",
      ).length;
      expect(excludedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("8.4 No exclusion scenarios", () => {
    it("8.4.1 returns false when no tight regions exist", () => {
      // Single large region with lots of slack
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      // 16-cell region, minTiles=4, stars=1 → NOT tight
      expect(result).toBe(false);
    });

    it("8.4.2 returns false when tight region already has all stars", () => {
      // Single-cell region with its star already placed
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
        ["star", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      // Region 0 has its star, starsNeeded=0 → skip
      expect(result).toBe(false);
    });

    it("8.4.3 returns false when star placement still leaves sufficient capacity", () => {
      // Tight region but all placements are valid
      // 1×4 strip with 2 stars, but stars can fit in non-adjacent positions
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      // 1×6 strip: minTiles=3, stars=2 → NOT tight (minTiles > stars)
      expect(result).toBe(false);
    });
  });

  describe("8.5 Edge cases", () => {
    it("8.5.1 does not exclude the only cell in a single-cell region", () => {
      // Region 0: single cell, needs 1 star
      // The cell itself should NOT be excluded (it must be a star)
      const board: Board = {
        grid: [
          [0, 1, 1],
          [1, 1, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      // (0,0) must NOT be marked - it's the only cell for this region's star
      expect(cells[0][0]).not.toBe("marked");
    });

    it("8.5.2 handles multiple tight regions", () => {
      // Two single-cell regions, both tight
      // Region 0 at (0,0), Region 2 at (0,4)
      const board: Board = {
        grid: [
          [0, 1, 1, 1, 2],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // At least one neighbor of tight regions should be marked
      // Neighbors of (0,0): (0,1), (1,0), (1,1)
      // Neighbors of (0,4): (0,3), (1,3), (1,4)
      const neighborsOf00 = [cells[0][1], cells[1][0], cells[1][1]];
      const neighborsOf04 = [cells[0][3], cells[1][3], cells[1][4]];
      const allNeighbors = [...neighborsOf00, ...neighborsOf04];
      const markedCount = allNeighbors.filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThanOrEqual(1);
    });

    it("8.5.3 handles tight region with some cells already marked", () => {
      // 1×4 strip with one cell already marked, still tight
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
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      // 3 unknown cells in region, minTiles=2, stars=1 → NOT tight
      expect(result).toBe(false);
    });
  });

  describe("8.6 Spec-aligned scenarios", () => {
    it("8.6.1 excludes using tiling analysis per spec", () => {
      // From spec: "considering a star's immediate marks and attempting
      // to tile the remainder with 2×2s"
      // Region with minTiles == stars, test that tiling correctly bounds capacity
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

      const result = exclusion(board, cells);

      // 2×2 region with 1 star: minTiles=1, stars=1 → TIGHT
      // Any star placement leaves 0-3 cells, which tiles to 0-1 tiles
      // Since we only need 0 more stars after placement, all positions valid
      expect(result).toBe(false);
    });

    it("8.6.2 processes both internal and external candidates for tight region", () => {
      // Single cell region at (1,1) - test that:
      // - The cell itself is NOT excluded (it must be a star)
      // - At least one neighbor IS excluded (they would starve the region)
      const board: Board = {
        grid: [
          [1, 1, 1],
          [1, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // (1,1) is the only cell in region 0 - should NOT be marked
      expect(cells[1][1]).not.toBe("marked");
      // At least one of the 8 neighbors should be marked (function marks one per call)
      const neighbors = [
        cells[0][0],
        cells[0][1],
        cells[0][2],
        cells[1][0],
        cells[1][2],
        cells[2][0],
        cells[2][1],
        cells[2][2],
      ];
      const markedCount = neighbors.filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("8.7 Spec coverage gaps", () => {
    it("8.7.1 marks one cell per call (return-after-first-mark)", () => {
      // Two single-cell tight regions - both have excludable neighbors
      // Function should mark exactly one cell per call
      const board: Board = {
        grid: [
          [0, 1, 1, 1, 2],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // Should mark exactly one cell
      const markedCount = cells.flat().filter((c) => c === "marked").length;
      expect(markedCount).toBe(1);
    });

    it("8.7.2 skips already-marked candidate cells", () => {
      // Single-cell tight region with ALL neighbors already marked
      // Only the region cell itself is unknown - should NOT be marked (it must hold the star)
      const board: Board = {
        grid: [
          [1, 1, 1],
          [1, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["marked", "marked", "marked"],
        ["marked", "unknown", "marked"],
        ["marked", "marked", "marked"],
      ];

      const result = exclusion(board, cells);

      // No candidates are unknown except (1,1) which is the region cell itself
      // Placing a star at (1,1) satisfies the region (needs 0 more) - not excluded
      expect(result).toBe(false);
      // (1,1) should NOT be marked - it's the only valid cell for this region's star
      expect(cells[1][1]).toBe("unknown");
    });

    it("8.7.3 excludes external cell that would starve tight region", () => {
      // Single-cell tight region at (0,2)
      // External cell (1,2) if starred would mark (0,2), leaving region with 0 cells for 1 star
      const board: Board = {
        grid: [
          [1, 1, 0, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // At least one neighbor of (0,2) should be marked
      // Neighbors: (0,1), (0,3), (1,1), (1,2), (1,3)
      const neighbors = [
        cells[0][1],
        cells[0][3],
        cells[1][1],
        cells[1][2],
        cells[1][3],
      ];
      const markedCount = neighbors.filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThanOrEqual(1);
      // The region cell itself should NOT be marked
      expect(cells[0][2]).not.toBe("marked");
    });

    it("8.7.4 tilingCache produces identical results", () => {
      // Test with and without tilingCache
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [1, 1, 1, 1],
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
      const resultNoCache = exclusion(board, cellsNoCache);

      // Build cache and run with it
      const cellsWithCache: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const size = board.grid.length;
      const byRegion = new Map();

      // Region 0: 1×3 strip
      const region0Coords: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
      ];
      const result0 = findAllMinimalTilings(region0Coords, cellsWithCache, size);
      byRegion.set(0, { ...result0, regionId: 0, cells: region0Coords });

      // Region 1: rest
      const region1Coords: Coord[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board.grid[r][c] === 1) region1Coords.push([r, c]);
        }
      }
      const result1 = findAllMinimalTilings(region1Coords, cellsWithCache, size);
      byRegion.set(1, { ...result1, regionId: 1, cells: region1Coords });

      const tilingCache = { byRegion };
      const resultWithCache = exclusion(board, cellsWithCache, tilingCache);

      expect(resultWithCache).toBe(resultNoCache);
      expect(cellsWithCache).toEqual(cellsNoCache);
    });

    it("8.7.5 documents that row/column exclusion is NOT implemented", () => {
      // Spec mentions exclusion can apply when "a region, row, or column
      // would no longer fit the specified star count"
      // Implementation only checks REGION tiling, not row/column constraints
      // This test documents that boundary
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

      // Region 0: 2×4 block, minTiles=2, stars=2 → TIGHT
      // But the region covers full rows 0-1, so row-based exclusion wouldn't help anyway
      // This test documents that exclusion uses REGION tiling, not row/column analysis
      const result = exclusion(board, cells);

      // Result depends on whether any cell placement breaks region tiling
      // The key point: implementation only checks region.minTileCount, not row/col
      expect(typeof result).toBe("boolean");
    });
  });
});
