import { describe, it, expect } from "vitest";
import { generateTileCandidates, findAllMinimalTilings } from "./tiling";
import { CellState, Coord, Tile } from "./types";

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

describe("1. Candidate Generation (Exact Cover)", () => {
  // Helpers
  const coordKey = ([r, c]: Coord): string => `${r},${c}`;
  const coordSet = (coords: Coord[]): Set<string> =>
    new Set(coords.map(coordKey));

  const makeGrid = (size: number, fill: CellState = "unknown"): CellState[][] =>
    Array(size)
      .fill(null)
      .map(() => Array(size).fill(fill));

  describe("1.1 Completeness", () => {
    it("1.1.1 enumerates all tiles covering a cell", () => {
      // A cell in the center can be covered by 4 different 2x2 tiles
      // (anchored at NW, NE, SW, SE relative to the cell)
      const regionCells: Coord[] = [[2, 2]];
      const candidates = generateTileCandidates(regionCells, makeGrid(5), 5);

      expect(candidates).toHaveLength(4);

      // Verify all 4 anchors present: (1,1), (1,2), (2,1), (2,2)
      const anchors = coordSet(candidates.map((t) => t.anchor));
      expect(anchors.has("1,1")).toBe(true);
      expect(anchors.has("1,2")).toBe(true);
      expect(anchors.has("2,1")).toBe(true);
      expect(anchors.has("2,2")).toBe(true);
    });

    it("1.1.2 boundary limits valid anchors", () => {
      // Corner cell: only 1 tile can cover it
      const corner: Coord[] = [[0, 0]];
      const cornerCandidates = generateTileCandidates(corner, makeGrid(5), 5);
      expect(cornerCandidates).toHaveLength(1);
      expect(cornerCandidates[0].anchor).toEqual([0, 0]);

      // Edge cell: only 2 tiles can cover it
      const edge: Coord[] = [[0, 2]];
      const edgeCandidates = generateTileCandidates(edge, makeGrid(5), 5);
      expect(edgeCandidates).toHaveLength(2);
    });
  });

  describe("1.2 Coverage Accuracy", () => {
    it("1.2.1 tile records exact cells covered", () => {
      // Tile at anchor (1,1) covers exactly: (1,1), (1,2), (2,1), (2,2)
      const regionCells: Coord[] = [
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ];
      const candidates = generateTileCandidates(regionCells, makeGrid(4), 4);

      const tile = candidates.find(
        (t) => t.anchor[0] === 1 && t.anchor[1] === 1,
      );
      expect(tile).toBeDefined();

      const covered = coordSet(tile!.coveredCells);
      expect(covered.size).toBe(4);
      expect(covered.has("1,1")).toBe(true);
      expect(covered.has("1,2")).toBe(true);
      expect(covered.has("2,1")).toBe(true);
      expect(covered.has("2,2")).toBe(true);
    });

    it("1.2.2 tile covers only region intersection", () => {
      // L-shaped region: tile at (0,0) covers 3 of its 4 cells
      const regionCells: Coord[] = [
        [0, 0],
        [1, 0],
        [1, 1],
      ];
      const candidates = generateTileCandidates(regionCells, makeGrid(4), 4);

      const tile = candidates.find(
        (t) => t.anchor[0] === 0 && t.anchor[1] === 0,
      );
      expect(tile).toBeDefined();

      const covered = coordSet(tile!.coveredCells);
      expect(covered.size).toBe(3);
      expect(covered.has("0,1")).toBe(false); // not in region
    });
  });

  describe("1.3 Universe Definition", () => {
    it("1.3.1 coverage excludes non-unknown cells", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const cells = makeGrid(4);
      cells[0][0] = "marked";
      cells[0][1] = "star";

      const candidates = generateTileCandidates(regionCells, cells, 4);
      const tile = candidates.find(
        (t) => t.anchor[0] === 0 && t.anchor[1] === 0,
      );

      expect(tile).toBeDefined();
      const covered = coordSet(tile!.coveredCells);
      expect(covered.size).toBe(2);
      expect(covered.has("0,0")).toBe(false); // marked
      expect(covered.has("0,1")).toBe(false); // star
      expect(covered.has("1,0")).toBe(true);
      expect(covered.has("1,1")).toBe(true);
    });

    it("1.3.2 empty universe yields no candidates", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
      ];
      const cells = makeGrid(4);
      cells[0][0] = "marked";
      cells[0][1] = "marked";

      const candidates = generateTileCandidates(regionCells, cells, 4);
      expect(candidates).toHaveLength(0);
    });
  });

  describe("1.4 Coverability", () => {
    it("1.4.1 every unknown cell appears in at least one candidate", () => {
      // Irregular region - verify all cells are reachable
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 0],
        [2, 1],
      ];
      const candidates = generateTileCandidates(regionCells, makeGrid(4), 4);

      // Union of all covered cells should equal the region
      const allCovered = new Set<string>();
      for (const tile of candidates) {
        for (const cell of tile.coveredCells) {
          allCovered.add(coordKey(cell));
        }
      }

      const regionSet = coordSet(regionCells);
      for (const cell of regionSet) {
        expect(allCovered.has(cell)).toBe(true);
      }
    });

    it("1.4.2 coverage is always subset of region", () => {
      const regionCells: Coord[] = [
        [1, 1],
        [1, 2],
        [2, 1],
      ];
      const candidates = generateTileCandidates(regionCells, makeGrid(5), 5);

      const regionSet = coordSet(regionCells);
      for (const tile of candidates) {
        for (const cell of tile.coveredCells) {
          expect(regionSet.has(coordKey(cell))).toBe(true);
        }
      }
    });
  });
});

describe("3. Minimum Tiling (Exact Cover)", () => {
  // Helpers
  const coordKey = ([r, c]: Coord): string => `${r},${c}`;
  const coordSet = (coords: Coord[]): Set<string> =>
    new Set(coords.map(coordKey));

  const makeGrid = (size: number, fill: CellState = "unknown"): CellState[][] =>
    Array(size)
      .fill(null)
      .map(() => Array(size).fill(fill));

  describe("3.1 Exact Cover Invariants", () => {
    it("3.1.1 each cell covered exactly once (no overlaps)", () => {
      // 2x3 rectangle - verify tiles partition the cells
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      for (const tiling of result.allMinimalTilings) {
        const coverCount = new Map<string, number>();

        for (const tile of tiling) {
          for (const cell of tile.coveredCells) {
            const key = coordKey(cell);
            coverCount.set(key, (coverCount.get(key) ?? 0) + 1);
          }
        }

        // Each cell covered exactly once
        for (const [, count] of coverCount) {
          expect(count).toBe(1);
        }
      }
    });

    it("3.1.2 coverage equals universe exactly", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [0, 2],
        [1, 2],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
      const universe = coordSet(regionCells);

      for (const tiling of result.allMinimalTilings) {
        const covered = new Set<string>();
        for (const tile of tiling) {
          for (const cell of tile.coveredCells) {
            covered.add(coordKey(cell));
          }
        }

        // Covered = universe (no gaps, no extras)
        expect(covered.size).toBe(universe.size);
        for (const cell of universe) {
          expect(covered.has(cell)).toBe(true);
        }
        for (const cell of covered) {
          expect(universe.has(cell)).toBe(true);
        }
      }
    });

    it("3.1.3 all returned tilings use minimum tile count", () => {
      // Plus shape has multiple solutions - all should be minimal
      const regionCells: Coord[] = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      for (const tiling of result.allMinimalTilings) {
        expect(tiling.length).toBe(result.minTileCount);
      }
    });
  });

  describe("3.2 Minimality", () => {
    it("3.2.1 single tile suffices for 2x2", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      expect(result.minTileCount).toBe(1);
      expect(result.allMinimalTilings).toHaveLength(1);
    });

    it("3.2.2 two tiles for 2x3 rectangle", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      expect(result.minTileCount).toBe(2);
    });

    it("3.2.3 three tiles for plus shape (center forces overlap)", () => {
      // Center cell (1,1) appears in all 4 possible tiles
      // Any 2 tiles covering center overlap, so need 3
      const regionCells: Coord[] = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      expect(result.minTileCount).toBe(3);
    });

    it("3.2.4 four tiles for 3x3 square", () => {
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
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      expect(result.minTileCount).toBe(4);
    });
  });

  describe("3.3 Solution Enumeration", () => {
    it("3.3.1 finds all minimal solutions for 2x3", () => {
      // 2x3 has exactly one valid partition:
      // - Tile (0,0): covers {(0,0), (0,1), (1,0), (1,1)}
      // - Tile (0,2): covers {(0,2), (1,2)}
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      expect(result.allMinimalTilings.length).toBe(1);
    });

    it("3.3.2 no duplicate solutions", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

      const tilingKeys = result.allMinimalTilings.map(tilingKey);
      const uniqueKeys = new Set(tilingKeys);

      expect(uniqueKeys.size).toBe(result.allMinimalTilings.length);
    });

    it("3.3.3 single cell has 4 solutions (one per anchor)", () => {
      const regionCells: Coord[] = [[2, 2]];
      const result = findAllMinimalTilings(regionCells, makeGrid(5), 5);

      expect(result.minTileCount).toBe(1);
      expect(result.allMinimalTilings.length).toBe(4);
    });
  });

  describe("3.4 Edge Cases", () => {
    it("3.4.1 empty universe yields zero tiles, one solution", () => {
      const regionCells: Coord[] = [
        [0, 0],
        [0, 1],
      ];
      const cells = makeGrid(4);
      cells[0][0] = "marked";
      cells[0][1] = "marked";

      const result = findAllMinimalTilings(regionCells, cells, 4);

      expect(result.minTileCount).toBe(0);
      expect(result.allMinimalTilings).toHaveLength(1);
      expect(result.allMinimalTilings[0]).toHaveLength(0);
    });

    it("3.4.2 disconnected components tile independently", () => {
      // Two separate 2x2 squares
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
      const result = findAllMinimalTilings(regionCells, makeGrid(6), 6);

      expect(result.minTileCount).toBe(2);
      expect(result.allMinimalTilings).toHaveLength(1);
    });

    it("3.4.3 isolated cells each need separate tile", () => {
      // Sparse diagonal - cells too far apart to share a tile
      const regionCells: Coord[] = [
        [0, 0],
        [2, 2],
        [4, 4],
      ];
      const result = findAllMinimalTilings(regionCells, makeGrid(6), 6);

      expect(result.minTileCount).toBe(3);
    });
  });
});

describe("4. Spec Examples", () => {
  const makeGrid = (size: number): CellState[][] =>
    Array(size)
      .fill(null)
      .map(() => Array(size).fill("unknown"));

  it("4.1 L-shape minimal tiling", () => {
    // From spec example_tiling_1a:
    // "the following region can be tiled with a minimum of two 2×2s"
    // minTileCount bounds the maximum stars this region can contain
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
      [2, 1],
    ];
    const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);

    expect(result.minTileCount).toBe(2);
    expect(result.allMinimalTilings.length).toBeGreaterThanOrEqual(1);
  });

  it("4.2 region bounding star count", () => {
    // From spec example_tiling_2:
    // "the following region can fit at most three stars"
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

    // minTileCount bounds max stars in region
    expect(result.minTileCount).toBe(3);
  });

  it("4.3 row pair squeeze pattern", () => {
    // From spec Rule 12 (The Squeeze):
    // "minimally tile a pair of rows with four 2×2s"
    // 2 rows × 8 cols = 16 cells, tiles to 4
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

