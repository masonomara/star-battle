import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import exclusion from "./exclusion";

describe("10. Exclusion", () => {
  // Exclusion only applies to "tight" regions where minTileCount == starsNeeded.
  // For each unknown cell in/near a tight region, if placing a star there
  // would reduce the region's tiling capacity below (starsNeeded - 1), exclude it.

  describe("10.1 Internal exclusion (cells inside tight region)", () => {
    it("10.1.1 marks middle cell in 1x3 region when star would break tiling capacity", () => {
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

    it("10.1.2 returns false when region is not tight", () => {
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

  describe("10.2 External exclusion (cells outside tight region)", () => {
    it("10.2.1 marks external cell adjacent to tight 1x2 region", () => {
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

  describe("10.3 Tight region identification", () => {
    it("10.3.1 excludes cells in 1x5 strip with 3 stars (tight region)", () => {
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

  describe("10.4 No exclusion scenarios", () => {
    it("10.4.1 returns false when no tight regions exist", () => {
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

    it("10.4.2 returns false when tight region already has all stars", () => {
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

    it("10.4.3 returns false when star placement still leaves sufficient capacity", () => {
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

  describe("10.5 Edge cases", () => {
    it("10.5.1 does not exclude the only cell in a single-cell region", () => {
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
  });

  describe("10.6 Spec-aligned scenarios", () => {
    it("10.6.1 excludes using tiling analysis per spec", () => {
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

    it("10.6.2 processes both internal and external candidates for tight region", () => {
      // Single cell region at (2,2) in a 5x5 grid - test that:
      // - The cell itself is NOT excluded (it must be a star)
      // - All 8 neighbors ARE excluded (they would starve the region)
      const board: Board = {
        grid: [
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 0, 1, 1],
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
      // (2,2) is the only cell in region 0 - should NOT be marked
      expect(cells[2][2]).not.toBe("marked");
      // All 8 neighbors should be marked (batch behavior)
      const neighbors = [
        cells[1][1],
        cells[1][2],
        cells[1][3],
        cells[2][1],
        cells[2][3],
        cells[3][1],
        cells[3][2],
        cells[3][3],
      ];
      const markedCount = neighbors.filter((c) => c === "marked").length;
      expect(markedCount).toBe(8);
    });
  });

  describe("10.7 Row and Column exclusion", () => {
    it("10.7.1 marks cell when star would leave row unable to fit required stars", () => {
      // Row 0 has 4 cells, needs 2 stars
      // If star at (1,1), marks (0,0), (0,1), (0,2)
      // Row 0 left with only (0,3) - can't fit 2 stars
      // This should be caught by ROW exclusion, not region exclusion
      const board: Board = {
        grid: [
          [0, 0, 0, 0],  // Region 0: entire row 0
          [1, 1, 1, 1],  // Region 1: rows 1-3 (large, not tight)
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
      // (1,1) should be marked - starring it breaks row 0
      expect(cells[1][1]).toBe("marked");
    });

    it("10.7.2 marks cell when star would leave column unable to fit required stars", () => {
      // Col 0 has 4 cells, needs 2 stars
      // If star at (1,1), marks (0,0), (1,0), (2,0)
      // Col 0 left with only (3,0) - can't fit 2 stars
      // This should be caught by COLUMN exclusion
      const board: Board = {
        grid: [
          [0, 1, 1, 1],  // Region 0: entire col 0
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // (1,1) should be marked - starring it breaks col 0
      expect(cells[1][1]).toBe("marked");
    });

    it("10.7.3 marks cell when star would leave row with untileable cells", () => {
      // Row 1 has 5 cells, needs 2 stars
      // If star at (0,2), marks (1,1), (1,2), (1,3)
      // Row 1 left with (1,0) and (1,4) - 2 cells for 2 stars
      // But (1,0) and (1,4) are 4 apart, so they CAN fit 2 stars
      // Let's make it tighter...
      //
      // Actually, let's test: Row 1 has 4 cells at positions 1,2,3,4
      // Star at (0,2) marks (1,1), (1,2), (1,3)
      // Row 1 left with (1,4) only - can't fit 2 stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 1, 1, 1, 1],  // Row 1 has region 1 cells at cols 1-4
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],  // (1,0) already marked
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      // (0,2) should be marked - starring it leaves row 1 with only (1,4) for 2 stars
      expect(cells[0][2]).toBe("marked");
    });

    it("10.7.4 marks cell when star leaves row with adjacent-only cells", () => {
      // Row 0 needs 2 stars, has 5 cells
      // Star at (1,2) marks (0,1), (0,2), (0,3)
      // Row 0 left with (0,0) and (0,4) - these are NOT adjacent, CAN fit 2 stars
      // So this should NOT be marked
      //
      // But if row has 4 cells at 0,1,2,3:
      // Star at (1,1) marks (0,0), (0,1), (0,2)
      // Row 0 left with (0,3) only - can't fit 2 stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 1],  // Row 0: 4 cells in region 0
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 1],
        ],
        stars: 2,
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
      // (1,1) should be marked - starring it leaves row 0 unable to fit 2 stars
      expect(cells[1][1]).toBe("marked");
    });

    it("10.7.5 does NOT mark cell when row can still fit stars after marking", () => {
      // Row 0 needs 2 stars, has 6 cells
      // Star at (1,2) marks (0,1), (0,2), (0,3)
      // Row 0 left with (0,0), (0,4), (0,5) - 3 cells for 2 stars
      // These cells CAN fit 2 stars (0,0 and 0,4, or 0,0 and 0,5, etc.)
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

      // (1,2) should NOT be marked - row 0 can still fit 2 stars
      // Actually, we need to check if ANY exclusion happens
      // The point is (1,2) specifically should not be marked due to row 0
      expect(cells[1][2]).not.toBe("marked");
    });

    it("10.7.6 marks cell when column left with insufficient tiling capacity", () => {
      // Col 0 needs 2 stars
      // Col 0 cells: rows 0,1,2,3 (4 cells)
      // Star at (1,1) marks (0,0), (1,0), (2,0)
      // Col 0 left with only (3,0) - can't fit 2 stars
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

      const result = exclusion(board, cells);

      expect(result).toBe(true);
      expect(cells[1][1]).toBe("marked");
    });
  });

  describe("10.8 Spec coverage gaps", () => {
    it("10.7.1 marks all excludable cells in one call (batch behavior)", () => {
      // Two single-cell tight regions - both have excludable neighbors
      // Function should mark all excludable cells in one call
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
      // Should mark multiple cells in one call
      // Neighbors of (0,0): (0,1), (1,0), (1,1)
      // Neighbors of (0,4): (0,3), (1,3), (1,4)
      const markedCount = cells.flat().filter((c) => c === "marked").length;
      expect(markedCount).toBeGreaterThan(1);
    });

    it("10.7.2 excludes external cell that would starve tight region", () => {
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

    it("10.7.3 marks cell in region A when starring would break neighboring region B", () => {
      // Key scenario: Cell is in region A, but if starred, its neighbors
      // would mark cells in region B, making B unsolvable.
      //
      // Grid:  0 0 1     Region 0: top-left (3 cells)
      //        0 2 1     Region 1: right column (2 cells) - TIGHT, needs 1 star
      //        2 2 2     Region 2: bottom + center (4 cells)
      //
      // Cell (0,1) is in region 0. Its neighbors include (0,2) and (1,2) from region 1.
      // If starred, BOTH region 1 cells get marked → region 1 has 0 cells for 1 star
      // Therefore (0,1) should be marked by exclusion.
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 2, 1],
          [2, 2, 2],
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
      // (0,1) should be marked - starring it would kill region 1
      expect(cells[0][1]).toBe("marked");
    });

    it("10.7.4 marks cell when neighbors would break region with 2-star requirement", () => {
      // More complex scenario: 2-star puzzle where marking neighbors
      // leaves a region unable to fit 2 non-adjacent stars.
      //
      // Grid:  0 0 0 0 0     5x5 grid
      //        0 0 0 1 1     Region 1: L-shape, 3 cells at (1,3),(1,4),(2,4)
      //        0 0 0 0 1     Needs 2 stars - barely fits (at (1,3) and (2,4))
      //        0 0 0 0 0
      //        0 0 0 0 0
      //
      // If we star (1,2) in region 0, it marks (0,1),(0,2),(0,3),(1,1),(1,3),(2,1),(2,2),(2,3)
      // Region 1 cells marked: (1,3) - one of the 3 cells
      // Remaining: (1,4) and (2,4) - only 2 cells for 2 stars
      // Since 2 cells can fit at most 1 star (they're adjacent), region 1 BREAKS!
      // So (1,2) should be excluded.
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 1, 1],
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
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
      // (1,2) should be marked - starring it leaves region 1 with 2 adjacent cells
      expect(cells[1][2]).toBe("marked");
    });

    it("10.7.5 marks cell when region has sparse 2D pattern needing 2 stars", () => {
      // Key insight: The tiling check might incorrectly approve sparse 2D patterns.
      // Create a region with cells that LOOK like they can fit 2 stars,
      // but actually can't due to adjacency constraints.
      //
      // Grid setup: Region 1 is 2x3, but after marking, becomes 2x2
      // 0 0 0 1 1 1     Region 1: 2x3 block (6 cells)
      // 0 0 0 1 1 1
      // 0 0 0 0 0 0
      //
      // If star at (1,2), marks (0,1),(0,2),(0,3),(1,1),(1,3),(2,1),(2,2),(2,3)
      // Region 1 marked: (0,3),(1,3)
      // Remaining: (0,4),(0,5),(1,4),(1,5) - still 2x2 block
      // 2x2 can't fit 2 stars!
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1],
          [0, 0, 0, 1, 1],
          [0, 0, 0, 1, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
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
      // (1,2) should be marked - starring it leaves region 1 unable to fit 2 stars
      expect(cells[1][2]).toBe("marked");
    });

    it("10.7.7 BUG: tiling check misses adjacent star positions from multi-cell tiles", () => {
      // This test exposes a bug in canTileWithMinCount2x2.
      //
      // Scenario: A 2x2 block of cells needs 2 stars.
      // Any cell in a 2x2 is adjacent to all others, so MAX 1 star fits.
      // But the tiling check finds 2 non-overlapping tiles and says "yes".
      //
      // Region layout:
      // 0 1 1 0     Region 1 is a 2x2 block at (0,1),(0,2),(1,1),(1,2)
      // 0 1 1 0     Needs 2 stars
      // 0 0 0 0
      // 0 0 0 0
      //
      // 2x2 tiles covering region 1:
      // - Tile at (0,0): covers (0,0),(0,1),(1,0),(1,1) - region cells: (0,1),(1,1)
      // - Tile at (0,1): covers (0,1),(0,2),(1,1),(1,2) - all 4 region cells
      // - Tile at (0,2): covers (0,2),(0,3),(1,2),(1,3) - region cells: (0,2),(1,2)
      //
      // Tiles (0,0) and (0,2) don't overlap in the cell grid!
      // - Tile (0,0) region cells: (0,1), (1,1)
      // - Tile (0,2) region cells: (0,2), (1,2)
      //
      // But star positions from these tiles are ALL adjacent:
      // (0,1)-(0,2): adjacent, (0,1)-(1,2): adjacent, (1,1)-(0,2): adjacent, (1,1)-(1,2): adjacent
      //
      // So region 1 CANNOT fit 2 stars, but tiling says it can.
      //
      // Test: If we star (2,1) in region 0, it marks neighbors (1,0),(1,1),(1,2),(2,0),(2,2),(3,0),(3,1),(3,2)
      // Region 1 cells marked: (1,1), (1,2)
      // Remaining region 1: (0,1), (0,2) - 2 adjacent cells for 2 stars = impossible!
      // So (2,1) should be excluded.
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [0, 1, 1, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
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
      // (2,1) should be marked - starring it leaves region 1 with only (0,1),(0,2)
      // which are adjacent and can't fit 2 stars
      expect(cells[2][1]).toBe("marked");
    });

    it("10.7.8 marks cell when remaining region has diagonal-adjacent cells needing 2 stars", () => {
      // Key case: After marking, remaining cells are diagonally adjacent (2D, not linear).
      // Two diagonally adjacent cells can only fit 1 star, not 2.
      //
      // Grid:
      // 0 0 0 1 1     Region 1: cells at (0,3),(0,4),(1,4) - 3 cells, L-shape
      // 0 0 0 0 1     Needs 2 stars
      // 0 0 0 0 0
      //
      // If we star (0,2), neighbors: (-1,1),(-1,2),(-1,3),(0,1),(0,3),(1,1),(1,2),(1,3)
      // Region 1 cells marked: (0,3)
      // Remaining: (0,4),(1,4) - 2 cells in different rows and columns!
      // (0,4) and (1,4): same column, distance 1. ADJACENT! Can't fit 2 stars.
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1],
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
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
      // (0,2) should be marked - starring it leaves region 1 with only (0,4),(1,4)
      // These are vertically adjacent and can't fit 2 stars
      expect(cells[0][2]).toBe("marked");
    });

    it("10.7.9 marks cell when remaining cells form compact 2x3 block needing 2 stars", () => {
      // A 2x3 block can fit 2 stars (e.g., opposite corners), but
      // certain subsets cannot. Test the boundary.
      //
      // After marking neighbors, if remaining cells are a 2x2 block,
      // they can't fit 2 stars. Any cell in 2x2 is adjacent to all others.
      //
      // Grid setup: Region 1 is 2x3, but after marking, becomes 2x2
      // 0 0 0 1 1 1     Region 1: 2x3 block (6 cells)
      // 0 0 0 1 1 1
      // 0 0 0 0 0 0
      //
      // If star at (1,2), marks (0,1),(0,2),(0,3),(1,1),(1,3),(2,1),(2,2),(2,3)
      // Region 1 marked: (0,3),(1,3)
      // Remaining: (0,4),(0,5),(1,4),(1,5) - still 2x2 block
      // 2x2 can't fit 2 stars!
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1, 1],
          [0, 0, 0, 1, 1, 1],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
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

      // (1,2) should be marked because after marking, region 1 is left with
      // 4 cells in a 2x2 block which cannot fit 2 non-adjacent stars
      expect(result).toBe(true);
      expect(cells[1][2]).toBe("marked");
    });
  });
});
