import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import tilingForcedStars from "./tilingForcedStars";

describe("08a. Tiling Forced Stars", () => {
  describe("Single-cell tile forces star", () => {
    it("places star when tile covers only one region cell", () => {
      // L-shaped region: minTiles=2, stars=2
      // One tile covers only cell (0,2) → must be a star
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star");
    });

    it("returns false when minTiles > starsNeeded", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(false);
      expect(cells.flat().filter((c) => c === "star").length).toBe(0);
    });

    it("places star when existing star reduces quota to match tiles", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star");
    });
  });

  describe("All tilings must agree", () => {
    it("skips cell when only some tilings have single coverage", () => {
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

      tilingForcedStars(board, cells);

      const stars = cells.flat().filter((c) => c === "star").length;
      expect(stars).toBe(0);
    });
  });

  describe("Marked cells affect tiling", () => {
    it("excludes marked cells from tiling computation", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(true);
      expect(cells[0][0]).toBe("star");
    });
  });

  describe("Edge cases", () => {
    it("returns false when minTiles < starsNeeded (unsolvable)", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(false);
      expect(cells[0][0]).toBe("unknown");
      expect(cells[0][1]).toBe("unknown");
    });

    it("returns false when minTiles === Infinity (no valid tiling)", () => {
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
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(false);
    });

    it("skips region when all stars already placed", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(false);
    });

    it("returns false when region fits entirely within one 2x2", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("Batch behavior", () => {
    it("returns false when minTiles < starsNeeded (region lacks capacity)", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(false);
      expect(cells.flat().every((c) => c === "unknown")).toBe(true);
    });

    it("places all stars for 3-star puzzle with isolated cells", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(true);
      const starCount = cells.flat().filter((c) => c === "star").length;
      expect(starCount).toBe(3);
      expect(cells[0][0]).toBe("star");
      expect(cells[0][3]).toBe("star");
      expect(cells[3][0]).toBe("star");
    });

    it("places all forced stars in one call", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(true);
      const starCount = cells.flat().filter((c) => c === "star").length;
      expect(starCount).toBe(2);
      expect(cells[0][0]).toBe("star");
      expect(cells[0][2]).toBe("star");
    });

    it("processes first eligible region when multiple have forcing opportunities", () => {
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

      const result = tilingForcedStars(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star");
    });
  });
});
