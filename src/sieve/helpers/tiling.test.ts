import { CellState, Coord } from "./types";
import { describe, it, expect } from "vitest";
import { findAllMinimalTilings } from "./tiling";

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
