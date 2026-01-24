/**
 * 2×2 Tiling Algorithm for Star Battle
 *
 * Tiles a region with non-overlapping 2×2 squares (allowing boundary overhang).
 * Uses DLX (Dancing Links) to find all minimal tilings efficiently.
 *
 * Used by: twoByTwoTiling, exclusion
 */

import { CellState, Coord, Tile, TilingResult } from "./types";
import { dlxSolve } from "./dlx";
import { coordKey, parseKey } from "./cellKey";

/**
 * Fast check if a region can be tiled with at least minTiles 2×2 tiles.
 * Uses backtracking to find non-overlapping tiles.
 */
export function canTileWithMinCount(
  regionCells: Coord[],
  gridSize: number,
  minTiles: number,
): boolean {
  if (regionCells.length === 0) return minTiles <= 0;

  const regionSet = new Set(regionCells.map(coordKey));

  // Generate all tile candidates that touch at least one region cell
  const candidateAnchors = new Set<string>();
  const maxAnchor = gridSize - 2;
  for (const [r, c] of regionCells) {
    for (const dr of [-1, 0]) {
      for (const dc of [-1, 0]) {
        const ar = r + dr;
        const ac = c + dc;
        if (ar >= 0 && ac >= 0 && ar <= maxAnchor && ac <= maxAnchor) {
          candidateAnchors.add(coordKey([ar, ac]));
        }
      }
    }
  }

  // Build tiles with their cells
  const tiles: Set<string>[] = [];
  for (const anchorKey of candidateAnchors) {
    const [ar, ac] = parseKey(anchorKey);
    const cells = new Set([
      coordKey([ar, ac]),
      coordKey([ar, ac + 1]),
      coordKey([ar + 1, ac]),
      coordKey([ar + 1, ac + 1]),
    ]);
    const touchesRegion = [...cells].some((c) => regionSet.has(c));
    if (touchesRegion) {
      tiles.push(cells);
    }
  }

  if (tiles.length < minTiles) return false;

  // Backtracking search
  function search(idx: number, count: number, used: Set<string>): boolean {
    if (count >= minTiles) return true;
    if (idx >= tiles.length) return false;
    if (tiles.length - idx + count < minTiles) return false; // Prune

    // Try including tile[idx]
    const tile = tiles[idx];
    const overlaps = [...tile].some((c) => used.has(c));
    if (!overlaps) {
      for (const c of tile) used.add(c);
      if (search(idx + 1, count + 1, used)) return true;
      for (const c of tile) used.delete(c);
    }

    // Try excluding tile[idx]
    return search(idx + 1, count, used);
  }

  return search(0, 0, new Set());
}

/**
 * Find all minimal tilings for a region using DLX.
 *
 * Uses exact cover with:
 * - Primary columns: region cells (must be covered exactly once)
 * - Secondary columns: non-region cells touched by tiles (at most once, prevents overlap)
 *
 * Returns the minimum number of tiles needed and all tilings achieving that minimum.
 */
export function findAllMinimalTilings(
  regionCells: Coord[],
  cells: CellState[][],
  gridSize: number,
): TilingResult {
  // Build unknown cells set and index map in one pass
  const unknownCells: Coord[] = [];
  const unknownSet = new Set<string>();
  const primaryCellToIndex = new Map<string, number>();

  for (const [r, c] of regionCells) {
    if (cells[r][c] === "unknown") {
      const key = coordKey([r, c]);
      unknownSet.add(key);
      primaryCellToIndex.set(key, unknownCells.length);
      unknownCells.push([r, c]);
    }
  }

  if (unknownCells.length === 0) {
    return { minTileCount: 0, allMinimalTilings: [[]], forcedCells: [] };
  }

  // Generate tile candidates
  // A 2×2 anchored at (r,c) covers (r,c), (r,c+1), (r+1,c), (r+1,c+1)
  const candidateAnchors = new Set<string>();
  const maxAnchor = gridSize - 2;

  for (const [r, c] of unknownCells) {
    for (const dr of [-1, 0]) {
      for (const dc of [-1, 0]) {
        const ar = r + dr;
        const ac = c + dc;
        if (ar >= 0 && ac >= 0 && ar <= maxAnchor && ac <= maxAnchor) {
          candidateAnchors.add(coordKey([ar, ac]));
        }
      }
    }
  }

  const candidates: Tile[] = [];
  for (const anchorKey of candidateAnchors) {
    const [ar, ac] = parseKey(anchorKey);
    const allCells: Coord[] = [
      [ar, ac],
      [ar, ac + 1],
      [ar + 1, ac],
      [ar + 1, ac + 1],
    ];
    const coveredCells: Coord[] = [];
    for (const cell of allCells) {
      if (unknownSet.has(coordKey(cell))) {
        coveredCells.push(cell);
      }
    }
    if (coveredCells.length > 0) {
      candidates.push({ anchor: [ar, ac], cells: allCells, coveredCells });
    }
  }

  if (candidates.length === 0) {
    return { minTileCount: Infinity, allMinimalTilings: [], forcedCells: [] };
  }

  // Collect non-region cells touched by any tile (secondary columns prevent overlap)
  const secondaryCellToIndex = new Map<string, number>();
  for (const tile of candidates) {
    for (const cell of tile.cells) {
      const key = coordKey(cell);
      if (!primaryCellToIndex.has(key) && !secondaryCellToIndex.has(key)) {
        secondaryCellToIndex.set(key, secondaryCellToIndex.size);
      }
    }
  }

  const numPrimary = unknownCells.length;
  const numSecondary = secondaryCellToIndex.size;

  // Build DLX rows: each tile covers some primary and some secondary columns
  const dlxRows: number[][] = [];
  for (const tile of candidates) {
    const row: number[] = [];

    // Add primary columns (region cells this tile covers)
    for (const cell of tile.coveredCells) {
      const idx = primaryCellToIndex.get(coordKey(cell));
      if (idx !== undefined) {
        row.push(idx);
      }
    }

    // Add secondary columns (non-region cells this tile covers)
    for (const cell of tile.cells) {
      const key = coordKey(cell);
      if (!primaryCellToIndex.has(key)) {
        const idx = secondaryCellToIndex.get(key);
        if (idx !== undefined) {
          row.push(numPrimary + idx);
        }
      }
    }

    dlxRows.push(row);
  }

  // Solve with DLX
  const solutions = dlxSolve(numPrimary, numSecondary, dlxRows);

  // No solutions found
  if (solutions.length === 0) {
    return { minTileCount: Infinity, allMinimalTilings: [], forcedCells: [] };
  }

  // Find minimum tile count and filter for minimal solutions
  let minTileCount = Infinity;
  for (const solution of solutions) {
    if (solution.length < minTileCount) {
      minTileCount = solution.length;
    }
  }

  const minimalSolutions = solutions.filter((s) => s.length === minTileCount);

  // Convert row indices back to Tile arrays
  const allMinimalTilings: Tile[][] = minimalSolutions.map((solution) =>
    solution.map((rowIdx) => candidates[rowIdx]),
  );

  // Find forced cells: cells that are single-coverage in ALL tilings
  const forcedCells: Coord[] = [];
  for (const cell of unknownCells) {
    const key = coordKey(cell);
    const isForcedInAll = allMinimalTilings.every((tiling) => {
      const tile = tiling.find((t) =>
        t.coveredCells.some((c) => coordKey(c) === key),
      );
      return tile !== undefined && tile.coveredCells.length === 1;
    });
    if (isForcedInAll) {
      forcedCells.push(cell);
    }
  }

  return { minTileCount, allMinimalTilings, forcedCells };
}
