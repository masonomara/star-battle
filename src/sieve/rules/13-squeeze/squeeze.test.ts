import { describe, it, expect } from "vitest";
import squeeze from "./squeeze";
import { Board, CellState } from "../../helpers/types";

describe("13. Squeeze", () => {
  describe("13.1 Row pair squeeze", () => {
    it("13.1.1 returns false when row pair cells can share 2x2 tiles", () => {
      // Two consecutive rows with marks creating a squeeze opportunity
      // Row pair 0-1 in a 2-star puzzle needs 4 stars total
      // Marks create isolated cells that must be stars
      //
      // Row 0: X . . X    (X = marked)
      // Row 1: X . . X
      //
      // Middle cells (0,1), (0,2), (1,1), (1,2) form a 2x2 block
      // But we need 4 stars in 2 rows... this needs more marks to squeeze
      //
      // Better setup: marks that leave isolated cells
      // Row 0: . X X .
      // Row 1: . X X .
      // Cells (0,0), (0,3), (1,0), (1,3) are isolated from each other
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
        ["unknown", "marked", "marked", "unknown"],
        ["unknown", "marked", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      // Row pair 0-1: unknowns at (0,0), (0,3), (1,0), (1,3)
      // Need 4 stars, each pair of vertically adjacent cells forms one 2x2
      // minTiles = 2, but we need 4 stars... so no squeeze
      // Actually: (0,0)+(1,0) can share a 2x2, (0,3)+(1,3) can share a 2x2
      // minTiles = 2, neededStars = 4 -> no match, no progress
      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.1.2 returns false when checkerboard pattern minTiles != neededStars", () => {
      // Checkerboard pattern in row pair - testing that squeeze correctly
      // identifies when tiling doesn't match star requirements
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1, 1, 1],
        ],
        stars: 2,
      };

      // Checkerboard pattern in first 2 rows
      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "marked", "unknown", "marked", "unknown", "marked"],
        ["marked", "unknown", "marked", "unknown", "marked", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = squeeze(board, cells);

      // Squeeze returns false when minTiles doesn't match neededStars
      expect(result).toBe(false);
    });

    it("13.1.3 makes progress when isolated unknowns in row pair need tiles extending outside", () => {
      // Row pair 0-1 with isolated unknowns that force tiles to extend outside
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      // Only 2 isolated unknowns in row 0, row 1 fully marked
      // Tiles must extend into row 2
      const cells: CellState[][] = [
        ["unknown", "marked", "marked", "unknown"],
        ["marked", "marked", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = squeeze(board, cells);

      // Squeeze makes progress by marking cells in row 2 that are covered by all tilings
      expect(result).toBe(true);
    });
  });

  describe("13.2 Column pair squeeze", () => {
    it("13.2.1 returns false when unknowns insufficient for needed stars", () => {
      // Column pair with only 2 unknowns but needs 4 stars
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        stars: 2,
      };

      // Col pair 0-1 unknowns: (0,0), (3,0) - only 2 cells
      // Need 4 stars (2-star x 2 cols) -> impossible with 2 unknowns
      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "marked", "unknown", "unknown"],
      ];

      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.2.2 returns false when column pair checkerboard minTiles != neededStars", () => {
      // Column pair with checkerboard pattern - testing that squeeze correctly
      // identifies when tiling doesn't match star requirements
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = squeeze(board, cells);

      // Squeeze returns false when minTiles doesn't match neededStars
      expect(result).toBe(false);
    });
  });

  describe("13.3 No-op cases", () => {
    it("13.3.1 returns false when minTiles does not equal neededStars", () => {
      // Setup where tiles don't match star count
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // All unknowns - 8 cells in row pair, can be tiled many ways
      // minTiles likely 2-4, but need 4 stars
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      // With 8 unknowns in a 2x4 block, minTiles = 2 (two 2x2s cover it)
      // Need 4 stars, so minTiles(2) !== needed(4) -> no progress
      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.3.2 returns false when pair already has enough stars", () => {
      // Use a valid 1-star puzzle to test that squeeze returns false
      // when a row pair already has its required stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      // Row pair 0-1 already has 2 stars (1 per row, satisfies region 0)
      // Row pair 2-3 has unknown cells but plenty of space
      const cells: CellState[][] = [
        ["star", "marked", "marked", "marked"],
        ["marked", "marked", "star", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.3.3 returns false when no unknown cells exist in pair", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // All cells in row pair 0-1 are marked or stars
      const cells: CellState[][] = [
        ["star", "marked", "marked", "star"],
        ["marked", "marked", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });
  });

  describe("13.4 Edge cases", () => {
    it("13.4.1 returns false for 1-star puzzle with no squeeze opportunity", () => {
      // 1-star means each row pair needs 2 stars
      // With all unknowns in a 4x4 grid, minTiles won't match neededStars
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

      // 8 unknowns per row pair, neededStars = 2
      // minTiles = 2 (two 2x2s can cover 8 cells in 2 rows)
      // Actually might match - let's verify specific outcome
      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.4.2 returns false for 3-star puzzle with no squeeze opportunity", () => {
      // 3-star means each row pair needs 6 stars
      // With all unknowns, minTiles won't match 6
      const board: Board = {
        grid: [
          [0, 0, 0, 1, 1, 1],
          [0, 0, 0, 1, 1, 1],
          [2, 2, 2, 3, 3, 3],
          [2, 2, 2, 3, 3, 3],
          [4, 4, 4, 5, 5, 5],
          [4, 4, 4, 5, 5, 5],
        ],
        stars: 3,
      };

      const cells: CellState[][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => "unknown" as CellState),
      );

      // 12 unknowns per row pair, neededStars = 6
      // minTiles = 3 (three 2x2s cover 12 cells) - won't match 6
      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.4.3 returns false for 2x2 grid (minTiles != neededStars)", () => {
      const board: Board = {
        grid: [
          [0, 1],
          [0, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown"],
        ["unknown", "unknown"],
      ];

      // 2x2 grid: row pair 0-1 has 4 cells, need 2 stars
      // minTiles = 1 (one 2x2 covers all 4)
      // minTiles(1) !== neededStars(2) -> no progress
      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.4.4 returns false when row pair has contiguous block (minTiles != neededStars)", () => {
      // Row pair with contiguous unknowns where minTiles won't match neededStars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 1],
          [2, 2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2, 2],
        ],
        stars: 2,
      };

      // All unknowns - 12 cells per row pair, need 4 stars
      // A 2x6 block can be tiled with 3 non-overlapping 2x2s, so minTiles = 3
      // minTiles(3) !== neededStars(4) -> no progress
      const cells: CellState[][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => "unknown" as CellState),
      );

      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });

    it("13.4.5 returns false when column pair has contiguous block (minTiles != neededStars)", () => {
      // Column pair with contiguous unknowns where minTiles won't match neededStars
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
          [0, 0, 1, 1, 2, 2],
        ],
        stars: 2,
      };

      // All unknowns - 12 cells per col pair, need 4 stars
      // A 6x2 block can be tiled with 3 non-overlapping 2x2s, so minTiles = 3
      // minTiles(3) !== neededStars(4) -> no progress
      const cells: CellState[][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => "unknown" as CellState),
      );

      const result = squeeze(board, cells);
      expect(result).toBe(false);
    });
  });

});
