import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import forcedPlacement from "./forcedPlacement";

describe("05. Forced Placement", () => {
  describe("05.1 Row forced placement", () => {
    it("05.1.1 places star when 1 unknown, needs 1 star", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "star", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("05.1.2 places remaining star (has 1 star, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star");
    });
  });

  describe("05.2 Column forced placement", () => {
    it("05.2.1 places star when 1 unknown, needs 1 star", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[1][0]).toBe("star");
    });

    it("05.2.2 places remaining star (has 1 star, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[2][0]).toBe("star");
    });
  });

  describe("05.3 Region forced placement", () => {
    it("05.3.1 places star when 1 unknown, needs 1 star", () => {
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[1][0]).toBe("star");
    });

    it("05.3.2 places star in L-shaped region", () => {
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 0, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[2][1]).toBe("star");
    });

    it("05.3.3 places star in corner region", () => {
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [0, 1, 1, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[3][3]).toBe("star");
    });
  });

  describe("05.4 No forced placement", () => {
    it("05.4.1 returns false when nothing forced", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });

    it("05.4.2 returns false when more unknowns than needed", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });

    it("05.4.3 returns false when constraint already satisfied", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("05.5 Partitioned forced placement", () => {
    it("05.5.1 places star in singleton column component", () => {
      // Column 0 has unknowns at rows 0,1 (adjacent, MIS=1) and row 4 (singleton, MIS=1)
      // Needs 2 stars, total MIS = 2, so row 4 must have a star
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[4][0]).toBe("star");
    });

    it("05.5.2 places star in singleton row component", () => {
      // Row 0 has unknowns at cols 0,1 (adjacent, MIS=1) and col 4 (singleton, MIS=1)
      // Needs 2 stars, total MIS = 2, so col 4 must have a star
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[0][4]).toBe("star");
    });

    it("05.5.3 places star in singleton region component", () => {
      // Region 0 has unknowns at (0,0),(0,1) (adjacent, MIS=1) and (2,0) (singleton, MIS=1)
      // Needs 2 stars, total MIS = 2, so (2,0) must have a star
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
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

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[2][0]).toBe("star");
    });

    it("05.5.4 does not place when sum(MIS) > needed", () => {
      // Column 0 has unknowns at rows 0,1 (MIS=1) and rows 3,4 (MIS=1)
      // Total MIS = 2, but needs only 1 star - no forced placement
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });

    it("05.5.5 does not place when no singleton component", () => {
      // Column 0 has unknowns at rows 0,1 (MIS=1) and rows 3,4 (MIS=1)
      // Total MIS = 2 = needed, but no singleton - can't determine which pair
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });
  });
});
