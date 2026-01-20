import { describe, it, expect } from "vitest";
import {
  generateTileCandidates,
  findAllMinimalTilings,
  computeAllTilings,
} from "./tiling";
import { Board, CellState, Coord, Tile, TilingCache } from "./types";

/**
 * Tiling Algorithm Tests
 *
 * Tests for generating 2×2 tile candidates and finding minimal tilings
 * using the DLX algorithm. These tilings are used by multiple rules:
 * - Rule 6: The 2×2
 * - Rule 8: Exclusion
 * - Rule 9: Pressured Exclusion
 * - Rule 12: The Squeeze
 * - Rule 14: Composite Regions
 */

// Helper to create a coord set string for comparison
const coordSetKey = (coords: Coord[]): string =>
  coords
    .map(([r, c]) => `${r},${c}`)
    .sort()
    .join("|");

// Helper to create a tiling key for comparison
const tilingKey = (tiles: Tile[]): string =>
  tiles
    .map((t) => `${t.anchor[0]},${t.anchor[1]}`)
    .sort()
    .join("|");

describe("1. Candidate Generation", () => {
  describe("1.1 Basic shapes", () => {
    it("1.1.1 single 2x2 at origin", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Multiple tiles can overlap this region from different anchors
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // The tile anchored at (0,0) should cover all 4 cells
      const fullCoverage = candidates.find(
        (t) => t.anchor[0] === 0 && t.anchor[1] === 0
      );
      expect(fullCoverage).toBeDefined();
      expect(fullCoverage!.coveredCells).toHaveLength(4);
    });

    it("1.1.2 single 2x2 offset from origin", () => {
      const regionCells: Coord[] = [
        [2, 3],
        [2, 4],
        [3, 3],
        [3, 4],
      ];
      const gridSize = 6;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Multiple tiles can overlap this region
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // The tile anchored at (2,3) should cover all 4 cells
      const fullCoverage = candidates.find(
        (t) => t.anchor[0] === 2 && t.anchor[1] === 3
      );
      expect(fullCoverage).toBeDefined();
      expect(fullCoverage!.coveredCells).toHaveLength(4);
    });

    it("1.1.3 horizontal 1x3 line", () => {
      const regionCells: Coord[] = [
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Tiles anchored at (0,0), (0,1), (1,0), (1,1) could cover these cells
      // But only those that actually overlap the region cells
      expect(candidates.length).toBeGreaterThanOrEqual(2);

      // Verify all candidates actually cover at least one region cell
      for (const tile of candidates) {
        expect(tile.coveredCells.length).toBeGreaterThan(0);
      }
    });

    it("1.1.4 vertical 3x1 line", () => {
      const regionCells: Coord[] = [
        [0, 1],
        [1, 1],
        [2, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      expect(candidates.length).toBeGreaterThanOrEqual(2);
    });

    it("1.1.5 L-shape", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [1, 0],
        [1, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // At minimum, anchor at (0,0) covers all 3 cells
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // Find the tile that covers all 3
      const fullCoverage = candidates.find((t) => t.coveredCells.length === 3);
      expect(fullCoverage).toBeDefined();
    });
  });

  describe("1.2 Single cell regions", () => {
    it("1.2.1 single cell in center of grid", () => {
      const regionCells: Coord[] = [[2, 2]];
      const gridSize = 5;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // 4 possible anchors: (1,1), (1,2), (2,1), (2,2)
      expect(candidates).toHaveLength(4);
    });

    it("1.2.2 single cell at corner", () => {
      const regionCells: Coord[] = [[0, 0]];
      const gridSize = 5;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Only anchor (0,0) works
      expect(candidates).toHaveLength(1);
      expect(candidates[0].anchor).toEqual([0, 0]);
    });

    it("1.2.3 single cell at edge", () => {
      const regionCells: Coord[] = [[0, 2]];
      const gridSize = 5;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Anchors (0,1) and (0,2) work
      expect(candidates).toHaveLength(2);
    });
  });

  describe("1.3 Cell state filtering", () => {
    it("1.3.1 excludes marked cells from coverage", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));
      cells[0][0] = "marked";
      cells[0][1] = "marked";

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Multiple tiles may exist, but each only covers unknown cells
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // The tile at (0,0) should only cover the 2 unknown cells
      const tileAtOrigin = candidates.find(
        (t) => t.anchor[0] === 0 && t.anchor[1] === 0
      );
      expect(tileAtOrigin).toBeDefined();
      expect(tileAtOrigin!.coveredCells).toHaveLength(2);
      expect(tileAtOrigin!.coveredCells).toContainEqual([1, 0]);
      expect(tileAtOrigin!.coveredCells).toContainEqual([1, 1]);
    });

    it("1.3.2 excludes star cells from coverage", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));
      cells[0][0] = "star";

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Multiple tiles may exist
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // The tile at (0,0) should only cover the 3 unknown cells
      const tileAtOrigin = candidates.find(
        (t) => t.anchor[0] === 0 && t.anchor[1] === 0
      );
      expect(tileAtOrigin).toBeDefined();
      expect(tileAtOrigin!.coveredCells).toHaveLength(3);
    });

    it("1.3.3 returns empty when all cells marked", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));
      cells[0][0] = "marked";
      cells[0][1] = "marked";

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // No candidates needed when nothing to cover
      expect(candidates).toHaveLength(0);
    });
  });

  describe("1.4 Grid boundary respect", () => {
    it("1.4.1 region at bottom-right corner", () => {
      const gridSize = 4;
      const regionCells: Coord[] = [
        [3, 3],
        [2, 3],
        [3, 2],
      ];
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Only anchor at (2,2) is valid within bounds
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // No anchor should be outside grid
      for (const tile of candidates) {
        expect(tile.anchor[0]).toBeGreaterThanOrEqual(0);
        expect(tile.anchor[1]).toBeGreaterThanOrEqual(0);
        expect(tile.anchor[0]).toBeLessThan(gridSize - 1);
        expect(tile.anchor[1]).toBeLessThan(gridSize - 1);
      }
    });

    it("1.4.2 1x4 line at grid edge", () => {
      const gridSize = 4;
      const regionCells: Coord[] = [
        [3, 0],
        [3, 1],
        [3, 2],
        [3, 3],
      ];
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const candidates = generateTileCandidates(regionCells, cells, gridSize);

      // Anchors must be at row 2 (one row up)
      for (const tile of candidates) {
        expect(tile.anchor[0]).toBe(2);
      }
    });
  });
});

describe("3. Minimum Tiling", () => {
  describe("3.1 Simple shapes", () => {
    it("3.1.1 2x2 square requires 1 tile", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(1);
      expect(result.allMinimalTilings).toHaveLength(1);
    });

    it("3.1.2 1x2 domino requires 1 tile", () => {
      const regionCells: Coord[] = [
        [1, 1],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(1);
    });

    it("3.1.3 1x4 line requires 2 tiles", () => {
      const regionCells: Coord[] = [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ];
      const gridSize = 5;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(2);
    });

    it("3.1.4 2x3 rectangle requires 2 tiles", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(2);
      // Two ways to tile: left+right or some overlap
      expect(result.allMinimalTilings.length).toBeGreaterThanOrEqual(1);
    });

    it("3.1.5 3x3 square requires 4 tiles", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(4);
    });
  });

  describe("3.2 Complex shapes", () => {
    it("3.2.1 L-shape (5 cells) requires 3 tiles", () => {
      // L-shape: vertical bar + horizontal extension
      // (0,0), (1,0), (2,0), (2,1), (2,2)
      // Cannot cover (0,0) and (2,2) with same tiles that cover middle
      const regionCells: Coord[] = [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
        [2, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(3);
    });

    it("3.2.2 T-shape requires 3 tiles", () => {
      // T-shape: horizontal bar + vertical stem
      // (0,0), (0,1), (0,2), (1,1), (2,1)
      // Corners (0,0) and (0,2) cannot be covered by same tile
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 1],
        [2, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(3);
    });

    it("3.2.3 plus/cross shape requires 3 tiles (non-overlapping)", () => {
      // Plus shape: center + 4 arms
      // (0,1), (1,0), (1,1), (1,2), (2,1)
      // Center cell (1,1) is in every possible 2×2 tile, so any two tiles overlap.
      // Non-overlapping tiling requires 3 tiles.
      const regionCells: Coord[] = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(3);
    });

    it("3.2.4 U-shape requires 2 tiles", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
        [0, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(2);
    });

    it("3.2.5 staircase (3 steps) requires 2 tiles", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(2);
    });

    it("3.2.6 disconnected 2x2s require 2 tiles", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [3, 3],
        [3, 4],
        [4, 3],
        [4, 4],
      ];
      const gridSize = 6;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(2);
      expect(result.allMinimalTilings).toHaveLength(1);
    });
  });

  describe("3.3 Multiple tilings", () => {
    it("3.3.1 2x3 has multiple minimal tilings", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      // Anchors at (0,0)+(0,1) is one tiling
      // Could also overlap differently
      expect(result.allMinimalTilings.length).toBeGreaterThanOrEqual(1);

      // All tilings should have same count
      for (const tiling of result.allMinimalTilings) {
        expect(tiling).toHaveLength(result.minTileCount);
      }
    });

    it("3.3.2 each tiling covers all cells", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);
      const regionSet = new Set(regionCells.map(([r, c]) => `${r},${c}`));

      for (const tiling of result.allMinimalTilings) {
        const covered = new Set<string>();
        for (const tile of tiling) {
          for (const [r, c] of tile.coveredCells) {
            covered.add(`${r},${c}`);
          }
        }
        // All region cells should be covered
        for (const cellKey of regionSet) {
          expect(covered.has(cellKey)).toBe(true);
        }
      }
    });

    it("3.3.3 no duplicate tilings returned", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [0, 2],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      const tilingKeys = result.allMinimalTilings.map(tilingKey);
      const uniqueKeys = new Set(tilingKeys);

      expect(uniqueKeys.size).toBe(result.allMinimalTilings.length);
    });
  });

  describe("3.4 Edge cases", () => {
    it("3.4.1 empty region (all marked)", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));
      cells[0][0] = "marked";
      cells[0][1] = "marked";

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(0);
      expect(result.allMinimalTilings).toHaveLength(1);
      expect(result.allMinimalTilings[0]).toHaveLength(0);
    });

    it("3.4.2 single unknown cell", () => {
      const regionCells: Coord[] = [[1, 1]];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      expect(result.minTileCount).toBe(1);
      // Multiple tilings (different anchor positions)
      expect(result.allMinimalTilings.length).toBeGreaterThanOrEqual(1);
    });

    it("3.4.3 region with existing star excludes neighbors", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const gridSize = 4;
      const cells: CellState[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill("unknown"));
      cells[0][0] = "star";
      cells[0][1] = "marked"; // neighbor of star
      cells[1][0] = "marked"; // neighbor of star
      cells[1][1] = "marked"; // neighbor of star

      const result = findAllMinimalTilings(regionCells, cells, gridSize);

      // Only (0,2) and (1,2) are unknown
      expect(result.minTileCount).toBe(1);
    });
  });
});

describe("4. Spec Examples", () => {
  it("4.1 example_tiling_1a - region tiles to minimum 2", () => {
    // From spec: "the following region can be tiled with a minimum of two 2×2s"
    // Reconstructing the L-shaped region from the description
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
      [2, 1],
    ];
    const gridSize = 4;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    expect(result.minTileCount).toBe(2);
  });

  it("4.2 example_tiling_1b - identifies tiles with limited region coverage", () => {
    // From spec: "one of the 2×2s has only one cell within the region"
    // This is about the tile having limited intersection with the region,
    // which is valuable for forced placement deductions.
    // The spec's L-shape example from image shows this pattern.
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
      [2, 1],
    ];
    const gridSize = 4;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    // Verify we found minimal tilings
    expect(result.minTileCount).toBeGreaterThan(0);
    expect(result.allMinimalTilings.length).toBeGreaterThan(0);

    // Check that tiles correctly track which cells they cover in the region
    for (const tiling of result.allMinimalTilings) {
      for (const tile of tiling) {
        // Every tile's coveredCells should be a subset of regionCells
        for (const cell of tile.coveredCells) {
          const inRegion = regionCells.some(
            (rc) => rc[0] === cell[0] && rc[1] === cell[1]
          );
          expect(inRegion).toBe(true);
        }
      }
    }
  });

  it("4.3 example_tiling_2 - region fits at most 3 stars", () => {
    // "the following region can fit at most three stars"
    // Larger irregular region
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
    const gridSize = 4;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    expect(result.minTileCount).toBe(3);
  });

  it("4.4 squeeze - 4 tiles across row pair", () => {
    // "minimally tile a pair of rows with four 2×2s"
    // Two full rows in a 10x10 would need 5 tiles, but with marks it's 4
    // Simplified: 2 rows × 4 cols = 8 cells
    const regionCells: Coord[] = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) {
        regionCells.push([r, c]);
      }
    }
    const gridSize = 10;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    expect(result.minTileCount).toBe(4);
  });
});

describe("5. Edge Cases", () => {
  it("5.1 region spanning entire small grid", () => {
    const gridSize = 4;
    const regionCells: Coord[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        regionCells.push([r, c]);
      }
    }
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    expect(result.minTileCount).toBe(4);
  });

  it("5.2 sparse diagonal cells", () => {
    const regionCells: Coord[] = [
      [0, 0],
      [2, 2],
      [4, 4],
    ];
    const gridSize = 6;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    // Each isolated cell needs its own tile
    expect(result.minTileCount).toBe(3);
  });

  it("5.3 1-cell region", () => {
    const regionCells: Coord[] = [[2, 2]];
    const gridSize = 5;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const result = findAllMinimalTilings(regionCells, cells, gridSize);

    expect(result.minTileCount).toBe(1);
    // 4 different tiles could cover this single cell
    expect(result.allMinimalTilings.length).toBe(4);
  });
});

describe("6. Performance Bounds", () => {
  it("6.1 typical region (10 cells) completes quickly", () => {
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
      [3, 1],
    ];
    const gridSize = 6;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const start = performance.now();
    const result = findAllMinimalTilings(regionCells, cells, gridSize);
    const elapsed = performance.now() - start;

    expect(result.minTileCount).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100); // 100ms threshold
  });

  it("6.2 larger region (16 cells) completes in reasonable time", () => {
    const regionCells: Coord[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        regionCells.push([r, c]);
      }
    }
    const gridSize = 6;
    const cells: CellState[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("unknown"));

    const start = performance.now();
    const result = findAllMinimalTilings(regionCells, cells, gridSize);
    const elapsed = performance.now() - start;

    expect(result.minTileCount).toBe(4);
    expect(elapsed).toBeLessThan(200); // 200ms threshold
  });
});

describe("7. Tiling Cache", () => {
  it("7.1 computes tilings for all regions", () => {
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

    const cache = computeAllTilings(board, cells);

    expect(cache.byRegion.size).toBe(4);
    expect(cache.byRegion.has(0)).toBe(true);
    expect(cache.byRegion.has(1)).toBe(true);
    expect(cache.byRegion.has(2)).toBe(true);
    expect(cache.byRegion.has(3)).toBe(true);
  });

  it("7.2 computes row pair tilings", () => {
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

    const cache = computeAllTilings(board, cells);

    // Row pairs: 0-1, 1-2, 2-3
    expect(cache.byRowPair.size).toBe(3);
    expect(cache.byRowPair.has(0)).toBe(true);
    expect(cache.byRowPair.has(1)).toBe(true);
    expect(cache.byRowPair.has(2)).toBe(true);
  });

  it("7.3 computes column pair tilings", () => {
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

    const cache = computeAllTilings(board, cells);

    // Col pairs: 0-1, 1-2, 2-3
    expect(cache.byColPair.size).toBe(3);
  });

  it("7.4 respects current cell state", () => {
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
      ["star", "marked", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const cache = computeAllTilings(board, cells);

    // Region 0 has only marked/star cells - nothing to tile
    const region0 = cache.byRegion.get(0)!;
    expect(region0.minTileCount).toBe(0);
  });
});
