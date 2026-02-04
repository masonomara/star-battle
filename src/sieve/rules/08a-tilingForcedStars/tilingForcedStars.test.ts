import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import { buildBoardAnalysis } from "../../helpers/boardAnalysis";
import tilingForcedStars from "./tilingForcedStars";

function run(board: Board, cells: CellState[][]): boolean {
  const analysis = buildBoardAnalysis(board, cells);
  return tilingForcedStars(board, cells, analysis);
}

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

      const result = run(board, cells);

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

      const result = run(board, cells);

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

      const result = run(board, cells);

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

      run(board, cells);

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

      const result = run(board, cells);

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

      const result = run(board, cells);

      expect(result).toBe(false);
      expect(cells[0][0]).toBe("unknown");
      expect(cells[0][1]).toBe("unknown");
    });

    it("returns false when no container has capacity === starsNeeded", () => {
      // Region 0 has no unknowns (all marked)
      // Rows and columns have slack (capacity > needed)
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
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = run(board, cells);

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

      const result = run(board, cells);

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

      const result = run(board, cells);

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

      const result = run(board, cells);

      expect(result).toBe(false);
      expect(cells.flat().every((c) => c === "unknown")).toBe(true);
    });

    it("places one star per call for isolated cells", () => {
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

      const result = run(board, cells);

      expect(result).toBe(true);
      const starCount = cells.flat().filter((c) => c === "star").length;
      expect(starCount).toBe(1);
    });

    it("places one forced star per call", () => {
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

      const result = run(board, cells);

      expect(result).toBe(true);
      const starCount = cells.flat().filter((c) => c === "star").length;
      expect(starCount).toBe(1);
      expect(cells[0][0]).toBe("star");
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

      const result = run(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star");
    });
  });
});
