import { Board, CellState } from "../../helpers/types";
import { describe, it, expect } from "vitest";
import partitionedPlacement from "./partitionedPlacement";

describe("06. Partitioned Placement", () => {
  describe("06.1 Partitioned forced placement", () => {
    it("06.1.1 places star in singleton column component", () => {
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

      const result = partitionedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[4][0]).toBe("star");
    });

    it("06.1.2 places star in singleton row component", () => {
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

      const result = partitionedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[0][4]).toBe("star");
    });

    it("06.1.3 places star in singleton region component", () => {
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

      const result = partitionedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells[2][0]).toBe("star");
    });

    it("06.1.4 does not place when sum(MIS) > needed", () => {
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

      const result = partitionedPlacement(board, cells);

      expect(result).toBe(false);
    });

    it("06.1.5 does not place when no singleton component", () => {
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

      const result = partitionedPlacement(board, cells);

      expect(result).toBe(false);
    });
  });
});
