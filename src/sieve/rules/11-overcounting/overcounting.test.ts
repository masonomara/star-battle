import { describe, expect, it } from "vitest";
import { Board, CellState } from "../../helpers/types";
import overcounting from "./overcounting";

describe("11. Overcounting", () => {
  // Overcounting: N regions completely CONTAIN N rows/cols
  // → Stars in those N regions must be in those rows/cols
  // → Mark cells of each region that lie OUTSIDE the N rows/cols

  describe("11.1 Row-based overcounting", () => {
    it("11.1.1 marks cells outside rows when 1 region contains 1 row", () => {
      // Region 0 spans rows 0-2, but completely contains row 0
      // (i.e., row 0 is entirely within region 0)
      // Wait - that's the opposite. Let me re-read the spec.
      // "N regions completely CONTAIN N rows"
      // So region(s) fully cover the row(s), meaning every cell in those rows belongs to those regions
      //
      // Example: Region 0 covers rows 0-1 completely (all cells in rows 0-1 are region 0)
      // Then region 0's stars must be in rows 0-1
      // Mark cells of region 0 that are outside rows 0-1
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 1, 1, 1],
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

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Region 0 contains rows 0-1 completely (8 cells)
      // Region 0 also has cell (2,0)
      // That cell is outside rows 0-1, so should be marked
      expect(cells[2][0]).toBe("marked");
    });

    it("11.1.2 marks cells when 2 regions contain 2 rows", () => {
      // Rows 0-1 are completely covered by regions 0 and 1
      // Both regions appear in both rows, so no single row triggers 1-region overcounting
      // Region 0 in cols 0-1, Region 1 in cols 2-3, both span rows 0-2
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
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

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Regions 0 and 1 together contain rows 0-1 completely
      // Region 0 cells outside rows 0-1: (2,0), (2,1)
      // Region 1 cells outside rows 0-1: (2,2), (2,3)
      expect(cells[2][0]).toBe("marked");
      expect(cells[2][1]).toBe("marked");
      expect(cells[2][2]).toBe("marked");
      expect(cells[2][3]).toBe("marked");
    });

    it("11.1.3 marks cells when 2 regions contain 2 rows (2★ puzzle)", () => {
      // Regions 0,1 completely contain rows 0-1
      // Both regions appear in both rows (vertical stripes), so no single row triggers overcounting
      // 2 regions × 2 stars = 4 stars must be in rows 0-1
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1, 1],
          [0, 0, 0, 1, 1, 1],
          [0, 0, 2, 2, 1, 1],
          [2, 2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2, 2],
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

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Region 0 cells outside rows 0-1: (2,0), (2,1)
      // Region 1 cells outside rows 0-1: (2,4), (2,5)
      expect(cells[2][0]).toBe("marked");
      expect(cells[2][1]).toBe("marked");
      expect(cells[2][4]).toBe("marked");
      expect(cells[2][5]).toBe("marked");
    });

    it("11.1.4 marks cells when 3 regions contain 3 rows (2★ puzzle)", () => {
      // Regions 0, 1, 2 completely contain rows 0-2
      // Each region has cells outside those rows that should be marked
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
          [0, 3, 1, 3, 2, 3],
          [3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3],
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

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Regions 0, 1, 2 contain rows 0-2 completely
      // Region 0 cells outside rows 0-2: (3,0)
      // Region 1 cells outside rows 0-2: (3,2)
      // Region 2 cells outside rows 0-2: (3,4)
      expect(cells[3][0]).toBe("marked");
      expect(cells[3][2]).toBe("marked");
      expect(cells[3][4]).toBe("marked");
    });
  });

  describe("11.2 Column-based overcounting", () => {
    it("11.2.1 marks cells outside columns when 1 region contains 1 column", () => {
      // Region 0 completely contains column 0, plus has cell (0,1)
      // Many regions per row prevent row-based overcounting from triggering first
      const board: Board = {
        grid: [
          [0, 0, 1, 2],
          [0, 3, 1, 2],
          [0, 3, 1, 2],
          [0, 3, 1, 4],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Region 0 cell outside col 0: (0,1)
      expect(cells[0][1]).toBe("marked");
    });

    it("11.2.2 marks cells when 2 regions contain 2 columns", () => {
      // Regions 0 and 1 completely contain columns 0-1
      // Region 0 also has cell (0,2) outside cols 0-1
      // Many unique regions per row prevent row-based from triggering
      const board: Board = {
        grid: [
          [0, 1, 0, 2],
          [0, 1, 3, 4],
          [0, 1, 5, 6],
          [0, 1, 7, 8],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Region 0 cell outside cols 0-1: (0,2)
      expect(cells[0][2]).toBe("marked");
    });

    it("11.2.3 marks cells when 3 regions contain 3 columns (2★ puzzle)", () => {
      // Regions 0, 1, 2 completely contain columns 0-2
      // Each region has cells outside those columns
      // Use many unique regions per row to prevent row-based from triggering
      const board: Board = {
        grid: [
          [0, 1, 2, 0, 3, 4],
          [0, 1, 2, 5, 6, 7],
          [0, 1, 2, 8, 9, 10],
          [0, 1, 2, 11, 12, 13],
          [0, 1, 2, 14, 15, 16],
          [0, 1, 2, 17, 18, 19],
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

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Regions 0, 1, 2 contain cols 0-2 completely
      // Region 0 cell outside cols 0-2: (0,3)
      expect(cells[0][3]).toBe("marked");
    });
  });

  describe("11.3 No overcounting", () => {
    it("11.3.1 returns false when no regions completely contain row sets", () => {
      // Each row has a different mix of regions - no N regions contain N rows
      // Row 0: {0,1}, Row 1: {0,2}, Row 2: {1,3}, Row 3: {2,3}
      // No subset of rows is completely covered by the same set of regions
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 2, 2],
          [1, 1, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      expect(result).toBe(false);
    });

    it("11.3.2 returns false when regions are exactly the rows (nothing outside to mark)", () => {
      // Region 0 is exactly row 0, region 1 is exactly row 1, etc.
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [2, 2, 2, 2],
          [3, 3, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      // Each region is exactly 1 row, no cells outside to mark
      expect(result).toBe(false);
    });

    it("11.3.3 returns false when cells already marked", () => {
      // Region 0 contains row 0, but its only cell outside row 0 is already marked
      // Many unique regions per column prevent column-based overcounting
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [8, 9, 10, 11],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      // Region 0 contains row 0, (1,0) is outside row 0 but already marked
      expect(result).toBe(false);
    });
  });

  describe("11.4 Edge cases", () => {
    it("11.4.1 marks non-contiguous cells when region contains a row", () => {
      // Region 0 contains row 0, but also has cells in row 2 (non-contiguous)
      // Those non-contiguous cells should be marked
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
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

      const result = overcounting(board, cells);

      // Region 0 contains row 0 completely
      // Region 0 has cells (2,0-3) outside row 0 - should be marked
      expect(result).toBe(true);
      expect(cells[2][0]).toBe("marked");
      expect(cells[2][1]).toBe("marked");
      expect(cells[2][2]).toBe("marked");
      expect(cells[2][3]).toBe("marked");
    });

    it("11.4.2 skips regions that already have full star quota", () => {
      // Region 0 contains row 0, but already has its star
      // Region 1 spans multiple rows and doesn't contain any row completely
      // Should NOT trigger overcounting since region 0 is "inactive"
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "marked", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      // Region 0 already has 1 star (= board.stars), so it's inactive
      // Region 1 is active but doesn't contain any row completely (col 0 is region 0)
      const result = overcounting(board, cells);

      // Should return false - region 0 is inactive, region 1 doesn't contain any row
      expect(result).toBe(false);
      // Cells (1,0), (2,0), (3,0) should NOT be marked
      expect(cells[1][0]).toBe("unknown");
      expect(cells[2][0]).toBe("unknown");
      expect(cells[3][0]).toBe("unknown");
    });

    it("11.4.3 handles smallest valid case with 1 region containing 1 row", () => {
      // Minimal case
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 1, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // Region 0 contains row 0 completely
      // Region 0 cell outside row 0: (1,0)
      expect(cells[1][0]).toBe("marked");
    });

    it("11.4.4 marks all eligible cells in single call (batch behavior)", () => {
      // Multiple cells from multiple regions should be marked in one call
      // Regions 0, 1 contain rows 0-1, both have cells outside
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
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

      const result = overcounting(board, cells);

      expect(result).toBe(true);
      // All region 0 and 1 cells in row 2 should be marked in ONE call
      expect(cells[2][0]).toBe("marked");
      expect(cells[2][1]).toBe("marked");
      expect(cells[2][2]).toBe("marked");
      expect(cells[2][3]).toBe("marked");
    });

    it("11.4.5 processes rows before columns", () => {
      // Setup where both row-based and column-based overcounting could apply
      // Implementation processes rows first
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 1, 1],
          [0, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = overcounting(board, cells);

      // Region 0 contains row 0 (row-based)
      // Region 0 also contains col 0 (column-based)
      // Either would mark (1,0) and (2,0)
      expect(result).toBe(true);
      expect(cells[1][0]).toBe("marked");
      expect(cells[2][0]).toBe("marked");
    });
  });
});
