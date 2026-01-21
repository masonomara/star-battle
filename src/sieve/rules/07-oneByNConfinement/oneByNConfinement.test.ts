import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import oneByNConfinement from "./oneByNConfinement";
import { computeAllStrips } from "../../helpers/strips";

describe("7. The 1×n Confinement", () => {
  describe("7.1 Row confinement", () => {
    it("7.1.1 marks row remainder when region confined to single row (1 star)", () => {
      // Region 1 unknowns all in row 1 → mark rest of row 1
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [1, 1, 0, 0],
          [1, 1, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });

    it("7.1.2 marks row remainder when region confined to single row (2 stars)", () => {
      // Region 0 (L-shaped) unknowns all in row 2 → mark rest of row 2
      const board: Board = {
        grid: [
          [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1, 1, 1, 2, 1],
          [0, 0, 0, 1, 1, 1, 2, 2, 2, 2],
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        [
          "marked",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "marked",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      // The three 1s in row 2 should be marked
      expect(cells[2][3]).toBe("marked");
      expect(cells[2][4]).toBe("marked");
      expect(cells[2][5]).toBe("marked");
    });

    it("7.1.3 marks when two 1×n regions together fill row quota", () => {
      // Regions 1 and 2 each confined to row 1, together account for all stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [1, 1, 0, 0, 0, 0, 2, 2],
          [1, 1, 0, 0, 0, 0, 2, 2],
          [1, 1, 0, 0, 0, 0, 2, 2],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "marked",
          "marked",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "marked",
          "marked",
        ],
        [
          "marked",
          "marked",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "marked",
          "marked",
        ],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
      expect(cells[1][4]).toBe("marked");
      expect(cells[1][5]).toBe("marked");
    });
  });

  describe("7.2 Column confinement", () => {
    it("7.2.1 marks column remainder when region confined to single column", () => {
      // Region 1 unknowns all in col 1 → mark rest of col 1
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [0, 1, 1, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      expect(cells[2][1]).toBe("marked");
      expect(cells[3][1]).toBe("marked");
    });
  });

  describe("7.3 No confinement", () => {
    it("7.3.1 returns false when regions span multiple rows and columns", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
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

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );
      expect(result).toBe(false);
    });

    it("7.3.2 returns false when region already has all stars", () => {
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
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );
      expect(result).toBe(false);
    });

    it("7.3.3 returns false when 1×n spans entire row (nothing to mark)", () => {
      // Region 1 fills row 1 completely - nowhere else to mark
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
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

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );
      expect(result).toBe(false);
    });
  });

  describe("7.4 Edge cases", () => {
    it("7.4.1 handles single-cell region (trivially confined)", () => {
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

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      expect(cells[0][1]).toBe("marked");
      expect(cells[0][2]).toBe("marked");
      expect(cells[0][3]).toBe("marked");
    });
  });

  describe("7.5 Column symmetry", () => {
    it("7.5.1 marks when two 1×n regions together fill column quota", () => {
      // Regions 1 and 2 each confined to col 1, together account for all stars
      const board: Board = {
        grid: [
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 0, 0],
          [0, 2, 0, 0],
          [0, 2, 0, 0],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      // Mark cells outside col 1 for regions 1 and 2 to make them column-confined
      cells[0][0] = "marked"; // Region 1's other cells
      cells[1][0] = "marked";
      cells[3][0] = "marked"; // Region 2's other cells
      cells[4][0] = "marked";

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      // Cell at (2,1) should be marked (not part of region 1 or 2)
      expect(cells[2][1]).toBe("marked");
    });

    it("7.5.2 marks column remainder with 2★ column confinement", () => {
      // Region 0 unknowns all in col 0 → mark rest of col 0
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      // Cells at (3,0) and (4,0) should be marked
      expect(cells[3][0]).toBe("marked");
      expect(cells[4][0]).toBe("marked");
    });
  });

  describe("7.6 Spec coverage gaps", () => {
    it("7.6.1 returns false when stripCache is undefined", () => {
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

      const result = oneByNConfinement(board, cells, undefined, undefined);

      expect(result).toBe(false);
      // No cells should be modified
      expect(cells.flat().every((c) => c === "unknown")).toBe(true);
    });

    it("7.6.2 marks remainder when confined region meets row quota", () => {
      // Region 1 confined to row 1, contributes 1 star
      // Row 1 needs 1 star, region 1 provides it → mark remainder of row 1
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [1, 1, 2, 2, 2, 2],
          [1, 1, 2, 2, 2, 2],
          [1, 1, 2, 2, 2, 2],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
    });

    it("7.6.3 marks remainder when confined region fills row quota", () => {
      // Region 1 confined to row 1, contributes 2 stars (all row needs)
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [1, 1, 2, 2, 2, 2],
          [1, 1, 2, 2, 2, 2],
          [1, 1, 2, 2, 2, 2],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      // Region 1 confined to row 1 (contributes 2 stars)
      // Row 1 needs 2 stars → should mark remainder (region 2's cells in row 1)
      expect(result).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
      expect(cells[1][4]).toBe("marked");
      expect(cells[1][5]).toBe("marked");
    });

    it("7.6.4 returns false when regions span multiple rows despite existing star", () => {
      // Regions 1 and 2 span rows 0-3, not confined to any single row
      const board: Board = {
        grid: [
          [0, 1, 1, 2, 2],
          [0, 1, 1, 2, 2],
          [0, 1, 1, 2, 2],
          [0, 1, 1, 2, 2],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
      ];

      // Row 0 has 1 star, needs 1 more
      // Region 1 unknowns: (0,1), (0,2), (1,1), (1,2), etc - spans multiple rows
      // Region 2 unknowns: (0,3), (0,4), (1,3), (1,4), etc - spans multiple rows
      // Neither region is confined to row 0 alone
      // This should return false (no confined regions)
      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(false);
    });

    it("7.6.5 handles 3★ puzzle with row confinement", () => {
      // 3★ puzzle, region confined to single row
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0, 1, 1, 1],
          [0, 0, 0, 0, 0, 0, 1, 1, 1],
          [0, 0, 0, 0, 0, 0, 1, 1, 1],
          [2, 2, 2, 2, 2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2, 2, 2, 2, 2],
        ],
        stars: 3,
      };
      const cells: CellState[][] = [
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "marked",
          "marked",
          "marked",
          "marked",
          "marked",
          "marked",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "marked",
          "marked",
          "marked",
          "marked",
          "marked",
          "marked",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
        [
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
          "unknown",
        ],
      ];

      // Region 0 unknowns: row 0 only (cols 0-5)
      // Region 0 needs 3 stars, all must be in row 0
      const result = oneByNConfinement(
        board,
        cells,
        undefined,
        computeAllStrips(board, cells),
      );

      expect(result).toBe(true);
      // Row 0, cols 6-8 (region 1) should be marked
      expect(cells[0][6]).toBe("marked");
      expect(cells[0][7]).toBe("marked");
      expect(cells[0][8]).toBe("marked");
    });
  });
});
