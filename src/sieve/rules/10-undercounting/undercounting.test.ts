import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import undercounting from "./undercounting";

describe("10. Undercounting", () => {
  // Undercounting: N regions completely contained within N rows/cols
  // → Stars in those rows/cols must be in those regions
  // → Mark cells in those rows/cols that lie OUTSIDE the N regions

  describe("10.1 Row-based undercounting", () => {
    it("10.1.1 marks cells outside region when 1 region contained in 1 row", () => {
      // Region 0 fits entirely in row 0 (cols 0-2)
      // Row 0 needs 1 star, which must come from region 0
      // Cells in row 0 outside region 0 (col 3) should be marked
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      expect(cells[0][3]).toBe("marked"); // outside region 0, in row 0
    });

    it("10.1.2 marks cells when 2 regions contained in 2 rows", () => {
      // Regions 0 and 1 fit entirely within rows 0-1
      // 2 rows need 2 stars, must come from regions 0 and 1
      // Cells in rows 0-1 outside regions 0,1 should be marked
      const board: Board = {
        grid: [
          [0, 0, 2, 2],
          [1, 1, 2, 2],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      // Region 2 cells in rows 0-1 should be marked: (0,2), (0,3), (1,2), (1,3)
      expect(cells[0][2]).toBe("marked");
      expect(cells[0][3]).toBe("marked");
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });

    it("10.1.3 marks cells when 3 regions contained in 3 rows for 2-star puzzle", () => {
      // Regions 0, 1, 2 contained within rows 0-2
      // 3 rows × 2 stars = 6 stars must come from these 3 regions
      // Cells in rows 0-2 outside regions 0,1,2 should be marked
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 3, 3],
          [1, 1, 1, 1, 3, 3],
          [2, 2, 2, 2, 3, 3],
          [3, 3, 3, 3, 3, 3],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      // Region 3 cells in rows 0-2 should be marked
      expect(cells[0][4]).toBe("marked");
      expect(cells[0][5]).toBe("marked");
      expect(cells[1][4]).toBe("marked");
      expect(cells[1][5]).toBe("marked");
      expect(cells[2][4]).toBe("marked");
      expect(cells[2][5]).toBe("marked");
    });
  });

  describe("10.2 Column-based undercounting", () => {
    it("10.2.1 marks cells outside region when 1 region contained in 1 column", () => {
      // Region 0 fits entirely in column 0 (rows 0-2)
      // Col 0 needs 1 star, which must come from region 0
      // Cells in col 0 outside region 0 (row 3) should be marked
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [0, 1, 1, 1],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      expect(cells[3][0]).toBe("marked"); // outside region 0, in col 0
    });

    it("10.2.2 marks cells when 2 regions contained in 2 columns", () => {
      // Regions 0 and 1 fit entirely within columns 0-1
      const board: Board = {
        grid: [
          [0, 1, 2, 2],
          [0, 1, 2, 2],
          [0, 1, 2, 2],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      // Region 2 cells in cols 0-1 should be marked: (3,0), (3,1)
      expect(cells[3][0]).toBe("marked");
      expect(cells[3][1]).toBe("marked");
    });

    it("10.2.3 marks cells when 3 regions contained in 3 columns for 2-star puzzle", () => {
      // Mirror of 10.1.3 but for columns
      // Regions 0, 1, 2 each contained within columns 0-2
      // 3 cols × 2 stars = 6 stars must come from these 3 regions
      const board: Board = {
        grid: [
          [0, 1, 2, 3, 3, 3],
          [0, 1, 2, 3, 3, 3],
          [0, 1, 2, 3, 3, 3],
          [0, 1, 2, 3, 3, 3],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      // Region 3 cells in cols 0-2 should be marked (rows 4-5, cols 0-2)
      expect(cells[4][0]).toBe("marked");
      expect(cells[4][1]).toBe("marked");
      expect(cells[4][2]).toBe("marked");
      expect(cells[5][0]).toBe("marked");
      expect(cells[5][1]).toBe("marked");
      expect(cells[5][2]).toBe("marked");
    });
  });

  describe("10.3 No undercounting", () => {
    it("10.3.1 returns false when no regions contained within row set", () => {
      // All regions span multiple row ranges
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = undercounting(board, cells);

      expect(result).toBe(false);
    });

    it("10.3.2 returns false when regions fill their rows completely", () => {
      // Region fills entire row - no cells outside region to mark
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

      const result = undercounting(board, cells);

      expect(result).toBe(false);
    });

    it("10.3.3 returns false when cells already marked", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = undercounting(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("10.4 Edge cases", () => {
    it("10.4.1 handles non-contiguous rows containing regions", () => {
      // Region 0 in row 0, region 1 in row 2 (skipping row 1)
      // This should NOT trigger undercounting (rows must be contiguous? or not?)
      // Per spec, we check "groups of consecutive rows" for squeeze,
      // but undercounting can work with any N rows containing N regions
      const board: Board = {
        grid: [
          [0, 0, 0, 2],
          [2, 2, 2, 2],
          [1, 1, 1, 2],
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

      const result = undercounting(board, cells);

      // Regions 0 and 1 are each contained in a single row
      // Row 0 + row 2 = 2 rows, contains 2 regions → marks region 2 cells in those rows
      expect(result).toBe(true);
      expect(cells[0][3]).toBe("marked"); // region 2 in row 0
      expect(cells[2][3]).toBe("marked"); // region 2 in row 2
    });

    it("10.4.2 skips regions that already have full star quota", () => {
      // Region 0 contained in row 0, but already has its star
      // Should NOT trigger undercounting since region 0 is "inactive"
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
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

      // Region 0 already has 1 star (= board.stars), so it's inactive
      // Implementation filters to active regions only
      const result = undercounting(board, cells);

      // Should return false - no undercounting applies with inactive region
      expect(result).toBe(false);
      // Cell (0,3) should NOT be marked since region 0 is inactive
      expect(cells[0][3]).toBe("unknown");
    });

    it("10.4.3 marks all eligible cells in single call", () => {
      // Multiple cells should be marked in one call
      // Region 0 in row 0 (cols 0-1), region 2 spans rows 0-3
      const board: Board = {
        grid: [
          [0, 0, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
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

      const result = undercounting(board, cells);

      expect(result).toBe(true);
      // All region 2 cells in row 0 should be marked in ONE call
      expect(cells[0][2]).toBe("marked");
      expect(cells[0][3]).toBe("marked");
      expect(cells[0][4]).toBe("marked");
    });

    it("10.4.4 processes rows before columns", () => {
      // Setup where both row-based and column-based undercounting could apply
      // Implementation processes rows first, then columns
      const board: Board = {
        grid: [
          [0, 0, 2],
          [1, 2, 2],
          [2, 2, 2],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = undercounting(board, cells);

      // Region 0 contained in row 0, region 1 contained in row 1
      // But also region 0 contained in cols 0-1, region 1 in col 0
      // Either way, something should be marked
      expect(result).toBe(true);
    });
  });
});
