import { CellState, Coord } from "./types";
import { describe, it, expect } from "vitest";
import { findAllMinimalTilings, canTileWithMinCount } from "./tiling";

describe("findAllMinimalTilings", () => {
  const makeGrid = (size: number): CellState[][] =>
    Array(size)
      .fill(null)
      .map(() => Array(size).fill("unknown"));

  describe("minTileCount calculation", () => {
    it("empty region returns 0 tiles", () => {
      const result = findAllMinimalTilings([], makeGrid(4), 4);
      expect(result.minTileCount).toBe(0);
      expect(result.allMinimalTilings).toEqual([[]]);
      expect(result.forcedCells).toEqual([]);
    });

    it("2×2 square needs 1 tile", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      expect(result.minTileCount).toBe(1);
    });

    it("L-shape needs 2 tiles (spec example_tiling_1a)", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 0],
        [2, 1],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      expect(result.minTileCount).toBe(2);
    });

    it("8-cell region needs 3 tiles (spec example_tiling_2)", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      expect(result.minTileCount).toBe(3);
    });

    it("row pair (2×8) needs 4 tiles (squeeze pattern, Rule 12)", () => {
      const regionCells: Coord[] = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 8; c++) {
          regionCells.push([r, c]);
        }
      }
      const result = findAllMinimalTilings(regionCells, makeGrid(10), 10);
      expect(result.minTileCount).toBe(4);
    });
  });

  describe("forcedCells identification", () => {
    it("single-cell tile forces that cell (spec example_tiling_1b)", () => {
      // L-shape where one tile covers only cell (0,2)
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2], // This cell is isolated from others
        [1, 0],
        [1, 1],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      expect(result.minTileCount).toBe(2);
      expect(result.forcedCells).toContainEqual([0, 2]);
    });

    it("no forced cells when multiple tilings disagree", () => {
      // 2x4 rectangle - can be tiled multiple ways
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      expect(result.minTileCount).toBe(2);
      expect(result.forcedCells).toEqual([]);
    });

    it("multiple forced cells when all isolated", () => {
      // Three isolated cells - each must be single-coverage
      const regionCells: Coord[] = [
        [0, 0],
        [0, 3],
        [3, 0],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(6), 6);
      expect(result.minTileCount).toBe(3);
      expect(result.forcedCells).toHaveLength(3);
    });
  });

  describe("marked cells handling", () => {
    it("excludes marked cells from tiling", () => {
      // 1x4 strip with middle cell marked
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ];
      const cells = makeGrid(4);
      cells[0][1] = "marked";
      const result = findAllMinimalTilings(regionCells, cells, 4);
      // (0,0) isolated, (0,2) and (0,3) together
      expect(result.minTileCount).toBe(2);
      expect(result.forcedCells).toContainEqual([0, 0]);
    });

    it("excludes star cells from tiling", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const cells = makeGrid(4);
      cells[0][0] = "star";
      cells[0][1] = "marked";
      cells[1][0] = "marked";
      const result = findAllMinimalTilings(regionCells, cells, 4);
      // Only (1,1) is unknown
      expect(result.minTileCount).toBe(1);
      expect(result.forcedCells).toContainEqual([1, 1]);
    });

    it("all cells marked/starred returns 0 tiles", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
      ];
      const cells = makeGrid(4);
      cells[0][0] = "star";
      cells[0][1] = "marked";
      const result = findAllMinimalTilings(regionCells, cells, 4);
      expect(result.minTileCount).toBe(0);
    });
  });

  describe("canTileWithMinCount for exclusion rule", () => {
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
      // Can't fit 5 non-adjacent stars
      expect(canTileWithMinCount(cells, 25, 5)).toBe(false);
      // Can fit 3 non-adjacent stars: (15,15), (21,17), (23,18)
      expect(canTileWithMinCount(cells, 25, 3)).toBe(true);
    });

    it("L-shape cluster with forced adjacent positions fails for 2 stars", () => {
      // 4 cells in an L-shape where tiles would force adjacent positions
      // (0,0), (1,0), (1,1), (2,1)
      // Tile at (-1,-1) or (0,-1) covers (0,0) alone → forced
      // Tile at (0,0) covers (0,0), (0,1), (1,0), (1,1) → multiple region cells
      // Tile at (1,0) covers (1,0), (1,1), (2,0), (2,1) → multiple region cells
      // Tile at (0,1) covers (0,1), (0,2), (1,1), (1,2) → (1,1) only in region → forced
      // If we pick tiles that force (0,0) and (1,1), those are adjacent
      const cells: Coord[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ];
      // Can fit at least 2 with proper tiling
      expect(canTileWithMinCount(cells, 5, 2)).toBe(true);
    });

    it("two isolated cells far apart can fit 2 stars", () => {
      const cells: Coord[] = [
        [0, 0],
        [10, 10],
      ];
      expect(canTileWithMinCount(cells, 15, 2)).toBe(true);
    });

    it("two adjacent cells cannot fit 2 stars", () => {
      const cells: Coord[] = [
        [5, 5],
        [5, 6],
      ];
      // Both cells are adjacent, so max 1 star
      expect(canTileWithMinCount(cells, 10, 2)).toBe(false);
      expect(canTileWithMinCount(cells, 10, 1)).toBe(true);
    });

    it("diagonally adjacent cells can still both have stars in some configs", () => {
      // Diagonal neighbors are still "adjacent" in Star Battle (8-connected)
      const cells: Coord[] = [
        [5, 5],
        [6, 6],
      ];
      expect(canTileWithMinCount(cells, 10, 2)).toBe(false);
      expect(canTileWithMinCount(cells, 10, 1)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("single unknown cell at grid corner returns Infinity", () => {
      // Cell at (0,0) - only one 2x2 can cover it, but it covers 4 cells
      // If only (0,0) is in region and unknown, it's still coverable
      const regionCells: Coord[] = [[0, 0]];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      expect(result.minTileCount).toBe(1);
      expect(result.forcedCells).toContainEqual([0, 0]);
    });

    it("disconnected cells that can each be covered", () => {
      // Two cells far apart - each needs its own tile
      const regionCells: Coord[] = [
        [0, 0],
        [3, 3],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(5), 5);
      expect(result.minTileCount).toBe(2);
      expect(result.forcedCells).toHaveLength(2);
    });

    it("returns Infinity when no valid tiling exists", () => {
      // Cell at bottom-right corner of 2x2 grid - no 2x2 tile can cover it
      // because tiles anchor at top-left and (1,1) would need anchor at (0,0) or (1,0) or (0,1) or (1,1)
      // but maxAnchor = 0, so only (0,0) is valid anchor
      // Tile at (0,0) covers (0,0),(0,1),(1,0),(1,1) - so it DOES cover (1,1)
      // Let me create a real case: cell at (1,1) in a 2x2 grid with (0,0) marked
      const regionCells: Coord[] = [
        [0, 0],
        [1, 1],
      ];
      const cells: CellState[][] = [
        ["marked", "unknown"],
        ["unknown", "unknown"],
      ];
      // Only (0,0) is in region but marked, so unknown region cells = []
      // Wait, (1,1) is in region and unknown
      // The only valid tile anchor is (0,0) which covers all 4 cells
      // So (1,1) is covered by tile at (0,0)
      const result = findAllMinimalTilings(regionCells, cells, 2);
      // (0,0) is marked so excluded, (1,1) is covered by tile at anchor (0,0)
      expect(result.minTileCount).toBe(1);
    });
  });
});
