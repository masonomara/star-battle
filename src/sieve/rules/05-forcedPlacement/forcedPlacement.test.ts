import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import forcedPlacement from "./forcedPlacement";

describe("5. Forced Placement", () => {
  describe("5.1 Row forced placement", () => {
    it("5.1.1 places star when 1 unknown, needs 1 star", () => {
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

    it("5.1.2 places ONE star when 2 unknowns, needs 2 stars", () => {
      // Row 1 has unknowns at (1,1) and (1,3) - not adjacent
      // forcedPlacement places ONE star at a time
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
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,1)
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "star", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.1.2b second call places the remaining forced star", () => {
      // Continuation of 5.1.2: after first star placed at (1,1),
      // row 1 now has 1 star and 1 unknown at (1,3)
      // Second call should place the second star
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      // State after 5.1.2's first call
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "star", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Second star now placed at (1,3)
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "star", "marked", "star"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.1.2c places ONE star when 3 unknowns, needs 3 stars, all non-adjacent", () => {
      // Row 0 has unknowns at (0,0), (0,2), (0,4) - all non-adjacent
      // All 3 must be stars, but incremental design places only ONE per call
      // This proves batch-vs-incremental choice is intentional
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        ],
        stars: 3,
      };

      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed at (0,0) - incremental, not batch
      expect(cells[0].filter((c) => c === "star").length).toBe(1);
      expect(cells[0][0]).toBe("star");
      // Other forced positions remain unknown for subsequent calls
      expect(cells[0][2]).toBe("unknown");
      expect(cells[0][4]).toBe("unknown");
    });

    it("5.1.3 places remaining star (has 1 star, 1 unknown)", () => {
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
      expect(cells).toEqual([
        ["star", "marked", "star", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.2 Column forced placement", () => {
    it("5.2.1 places star when 1 unknown, needs 1 star", () => {
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
      expect(cells).toEqual([
        ["marked", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("5.2.2 places ONE star when 2 unknowns, needs 2 stars", () => {
      // Col 2 has unknowns at (1,2) and (3,2) - not adjacent
      // forcedPlacement places ONE star at a time
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
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,2)
      expect(cells).toEqual([
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "star", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.2.3 places remaining star (has 1 star, 1 unknown)", () => {
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
      expect(cells).toEqual([
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.3 Region forced placement", () => {
    it("5.3.1 places star when 1 unknown, needs 1 star", () => {
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
      expect(cells).toEqual([
        ["marked", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("5.3.2 detects contradiction: diagonally adjacent unknowns both need stars", () => {
      // Region 0 has 2 unknowns at (0,0) and (1,1) - diagonally adjacent.
      // Both cells MUST be stars (2 unknowns, needs 2 stars), but stars
      // cannot be adjacent. This is a CONTRADICTION - an unsolvable state.
      // The rule correctly detects this and returns false without placing.
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
        ["unknown", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      // Detects contradiction: adjacent cells can't both be stars
      expect(result).toBe(false);
      // No change - contradiction detected, not "nothing to do"
      expect(cells).toEqual([
        ["unknown", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.3 detects contradiction: orthogonally adjacent unknowns both need stars", () => {
      // Region 0 has 2 unknowns at (0,0) and (0,1) - horizontally adjacent.
      // Both cells MUST be stars (2 unknowns, needs 2 stars), but stars
      // cannot be adjacent. This is a CONTRADICTION - an unsolvable state.
      // The rule correctly detects this and returns false without placing.
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
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      // Detects contradiction: adjacent cells can't both be stars
      expect(result).toBe(false);
      // No change - contradiction detected, not "nothing to do"
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.4 places star in L-shaped region", () => {
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
      expect(cells).toEqual([
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "star", "unknown"],
      ]);
    });

    it("5.3.5 places remaining star (has 1 star, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "star", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.6 places star in scattered region", () => {
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
      expect(cells).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "star"],
      ]);
    });

    it("5.3.6b forced placement in region with unknowns spanning multiple rows/cols", () => {
      // Region 0 is an irregular shape spanning rows 0-2 and cols 0-2
      // Two unknowns at (0,0) and (2,2) - different rows AND columns, non-adjacent
      // Needs 2 stars, has 2 unknowns → forced (places ONE per call)
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [0, 0, 0, 1, 1],
          [1, 0, 0, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
        ],
        stars: 2,
      };

      // Region 0 cells: (0,0), (0,1), (1,0), (1,1), (1,2), (2,1), (2,2)
      // Mark all except (0,0) and (2,2) which are in different rows AND cols
      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "unknown", "unknown"],
        ["unknown", "marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // First star placed at (0,0) - the first unknown found in region
      expect(cells[0][0]).toBe("star");
      // (2,2) remains unknown for next call
      expect(cells[2][2]).toBe("unknown");
    });

    it("5.3.7 places ONE star when multiple regions have forced placements", () => {
      // Region 0 (col 0): only (1,0) unknown, forced
      // Region 3 (col 3): only (3,3) unknown, forced
      // Only ONE star placed per call - region 0 is found first
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
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,0) from region 0
      expect(cells).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["star", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.4 No forced placement", () => {
    it("5.4.1 returns false when nothing forced", () => {
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

    it("5.4.2 returns false when more unknowns than needed", () => {
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

    it("5.4.3 returns false when row already has all stars", () => {
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

  describe("5.5 Multiple forced placements", () => {
    it("5.5.1 places ONE star when multiple rows have forced placements", () => {
      // Row 0: only (0,1) unknown, forced
      // Row 3: only (3,3) unknown, forced
      // Only ONE star placed - row 0 is checked first
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
        ["marked", "unknown", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (0,1) from row 0
      expect(cells).toEqual([
        ["marked", "star", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "unknown"],
      ]);
    });

    it("5.5.2 places ONE star when row, column, region all have forced placements", () => {
      // Row 1: only (1,0) unknown, forced
      // Col 2: only (2,2) unknown, forced (also region 1)
      // Only ONE star placed - row check comes first, finds (1,0)
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "marked", "marked"],
        ["unknown", "marked", "marked"],
        ["marked", "marked", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,0) from row 1
      expect(cells).toEqual([
        ["marked", "marked", "marked"],
        ["star", "marked", "marked"],
        ["marked", "marked", "unknown"],
      ]);
    });
  });
});
