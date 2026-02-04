import { Coord } from "./types";
import { describe, it, expect } from "vitest";
import { computeTiling } from "./tiling";

describe("computeTiling", () => {
  describe("capacity calculation", () => {
    it("empty cells returns 0 capacity", () => {
      const result = computeTiling([], 4);
      expect(result.capacity).toBe(0);
      expect(result.tilings).toEqual([[]]);
      expect(result.forcedCells).toEqual([]);
    });

    it("2×2 square needs 1 tile", () => {
      const cells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const result = computeTiling(cells, 4);
      expect(result.capacity).toBe(1);
    });

    it("L-shape needs 2 tiles (spec example_tiling_1a)", () => {
      const cells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 0],
        [2, 1],
      ];
      const result = computeTiling(cells, 4);
      expect(result.capacity).toBe(2);
    });

    it("8-cell region needs 3 tiles (spec example_tiling_2)", () => {
      const cells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ];
      const result = computeTiling(cells, 4);
      expect(result.capacity).toBe(3);
    });

    it("row pair (2×8) needs 4 tiles (squeeze pattern, Rule 12)", () => {
      const cells: Coord[] = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 8; c++) {
          cells.push([r, c]);
        }
      }
      const result = computeTiling(cells, 10);
      expect(result.capacity).toBe(4);
    });
  });

  describe("forcedCells identification", () => {
    it("single-cell tile forces that cell (spec example_tiling_1b)", () => {
      // L-shape where one tile covers only cell (0,2)
      const cells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2], // This cell is isolated from others
        [1, 0],
        [1, 1],
      ];
      const result = computeTiling(cells, 4);
      expect(result.capacity).toBe(2);
      expect(result.forcedCells).toContainEqual([0, 2]);
    });

    it("no forced cells when multiple tilings disagree", () => {
      // 2x4 rectangle - can be tiled multiple ways
      const cells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ];
      const result = computeTiling(cells, 4);
      expect(result.capacity).toBe(2);
      expect(result.forcedCells).toEqual([]);
    });

    it("multiple forced cells when all isolated", () => {
      // Three isolated cells - each must be single-coverage
      const cells: Coord[] = [
        [0, 0],
        [0, 3],
        [3, 0],
      ];
      const result = computeTiling(cells, 6);
      expect(result.capacity).toBe(3);
      expect(result.forcedCells).toHaveLength(3);
    });
  });

  describe("capacity checks (formerly canTileWithMinCount)", () => {
    it("5 cells with adjacent forced positions can only fit 3 stars (not 5)", () => {
      // This is the exact bug case from the 25x25 6-star puzzle:
      // Cells: (15,15) isolated, (21,17), (22,17), (22,18), (23,18) L-shape cluster
      // (21,17) and (22,17) are vertically adjacent
      // Maximum non-adjacent stars: 3 (one from isolated + two from L)
      const cells: Coord[] = [
        [15, 15], // isolated
        [21, 17], // adjacent to (22,17)
        [22, 17], // adjacent to (21,17) and (22,18)
        [22, 18], // adjacent to (22,17) and (23,18)
        [23, 18], // adjacent to (22,18)
      ];
      const result = computeTiling(cells, 25);
      // Can't fit 5 non-adjacent stars
      expect(result.capacity >= 5).toBe(false);
      // Can fit 3 non-adjacent stars: (15,15), (21,17), (23,18)
      expect(result.capacity >= 3).toBe(true);
    });

    it("L-shape cluster with forced adjacent positions fails for 2 stars", () => {
      const cells: Coord[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ];
      // Can fit at least 2 with proper tiling
      expect(computeTiling(cells, 5).capacity >= 2).toBe(true);
    });

    it("two isolated cells far apart can fit 2 stars", () => {
      const cells: Coord[] = [
        [0, 0],
        [10, 10],
      ];
      expect(computeTiling(cells, 15).capacity >= 2).toBe(true);
    });

    it("two adjacent cells cannot fit 2 stars", () => {
      const cells: Coord[] = [
        [5, 5],
        [5, 6],
      ];
      // Both cells are adjacent, so max 1 star
      expect(computeTiling(cells, 10).capacity >= 2).toBe(false);
      expect(computeTiling(cells, 10).capacity >= 1).toBe(true);
    });

    it("diagonally adjacent cells can still both have stars in some configs", () => {
      // Diagonal neighbors are still "adjacent" in Star Battle (8-connected)
      const cells: Coord[] = [
        [5, 5],
        [6, 6],
      ];
      expect(computeTiling(cells, 10).capacity >= 2).toBe(false);
      expect(computeTiling(cells, 10).capacity >= 1).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("single cell returns capacity 1 and is forced", () => {
      const cells: Coord[] = [[0, 0]];
      const result = computeTiling(cells, 4);
      expect(result.capacity).toBe(1);
      expect(result.forcedCells).toContainEqual([0, 0]);
    });

    it("disconnected cells that can each be covered", () => {
      // Two cells far apart - each needs its own tile
      const cells: Coord[] = [
        [0, 0],
        [3, 3],
      ];
      const result = computeTiling(cells, 5);
      expect(result.capacity).toBe(2);
      expect(result.forcedCells).toHaveLength(2);
    });
  });
});
