/**
 * 2×2 Tiling Algorithm for Star Battle
 *
 * One function. One enumeration. Returns everything.
 * Caller takes what they need.
 */

import { Coord, Tile, TilingResult } from "./types";
import { dlxSolve } from "./dlx";
import { coordKey, parseKey } from "./cellKey";

/**
 * Compute tiling for a set of cells.
 *
 * Returns capacity (max stars), all minimal tilings, and forced cells.
 * Uses DLX with secondary columns to prevent tile overlap.
 */
export function computeTiling(cells: Coord[], gridSize: number): TilingResult {
  if (cells.length === 0) {
    return { capacity: 0, tilings: [[]], forcedCells: [] };
  }

  if (cells.length === 1) {
    return { capacity: 1, tilings: [], forcedCells: [cells[0]] };
  }

  const cellSet = new Set(cells.map(coordKey));
  const cellToIndex = new Map<string, number>();
  cells.forEach((c, i) => cellToIndex.set(coordKey(c), i));

  // Generate all 2x2 tiles touching these cells
  const tiles: Tile[] = [];
  const seenAnchors = new Set<string>();
  const maxAnchor = gridSize - 2;

  for (const [r, c] of cells) {
    for (const dr of [-1, 0]) {
      for (const dc of [-1, 0]) {
        const ar = r + dr;
        const ac = c + dc;
        if (ar < 0 || ac < 0 || ar > maxAnchor || ac > maxAnchor) continue;

        const anchorKey = coordKey([ar, ac]);
        if (seenAnchors.has(anchorKey)) continue;
        seenAnchors.add(anchorKey);

        const allCells: Coord[] = [
          [ar, ac],
          [ar, ac + 1],
          [ar + 1, ac],
          [ar + 1, ac + 1],
        ];
        const coveredCells = allCells.filter((tc) => cellSet.has(coordKey(tc)));

        if (coveredCells.length > 0) {
          tiles.push({ anchor: [ar, ac], cells: allCells, coveredCells });
        }
      }
    }
  }

  if (tiles.length === 0) {
    return { capacity: 0, tilings: [], forcedCells: [] };
  }

  // Build DLX: primary = cells to cover, secondary = outside cells
  const secondaryToIndex = new Map<string, number>();
  for (const tile of tiles) {
    for (const c of tile.cells) {
      const key = coordKey(c);
      if (!cellToIndex.has(key) && !secondaryToIndex.has(key)) {
        secondaryToIndex.set(key, secondaryToIndex.size);
      }
    }
  }

  const numPrimary = cells.length;
  const numSecondary = secondaryToIndex.size;

  const dlxRows: number[][] = tiles.map((tile) => {
    const row: number[] = [];
    for (const c of tile.coveredCells) {
      row.push(cellToIndex.get(coordKey(c))!);
    }
    for (const c of tile.cells) {
      const key = coordKey(c);
      if (!cellToIndex.has(key) && secondaryToIndex.has(key)) {
        row.push(numPrimary + secondaryToIndex.get(key)!);
      }
    }
    return row;
  });

  // Solve once
  const solutions = dlxSolve(numPrimary, numSecondary, dlxRows);

  if (solutions.length === 0) {
    return {
      capacity: Math.ceil(cells.length / 4) || 1,
      tilings: [],
      forcedCells: [],
    };
  }

  // Extract everything
  const capacity = Math.min(...solutions.map((s) => s.length));
  const minimalSolutions = solutions.filter((s) => s.length === capacity);
  const tilings = minimalSolutions.map((sol) => sol.map((i) => tiles[i]));

  // Find forced cells: single-coverage in ALL tilings
  const forcedCells: Coord[] = [];
  for (const cell of cells) {
    const key = coordKey(cell);
    const forcedInAll = tilings.every((tiling) => {
      const tile = tiling.find((t) =>
        t.coveredCells.some((c) => coordKey(c) === key),
      );
      return tile && tile.coveredCells.length === 1;
    });
    if (forcedInAll) forcedCells.push(cell);
  }

  return { capacity, tilings, forcedCells };
}
