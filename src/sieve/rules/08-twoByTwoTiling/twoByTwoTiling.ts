import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, Coord, Tile } from "../../helpers/types";
import { coordKey } from "../../helpers/cellKey";

/**
 * Check if two cells are adjacent (including diagonals).
 */
function cellsAreAdjacent(c1: Coord, c2: Coord): boolean {
  return Math.abs(c1[0] - c2[0]) <= 1 && Math.abs(c1[1] - c2[1]) <= 1;
}

/**
 * Rule 8: The 2×2 Tiling
 *
 * When minTiles === starsNeeded, each tile contains exactly one star.
 *
 * This enables two deductions:
 * 1. Stars: Cells with single-coverage in ALL minimal tilings must be stars
 * 2. Marks: Non-region cells covered by tiles in ALL minimal tilings cannot
 *    have stars (the tile's star must be in the region portion)
 *
 * Edge cases (no progress, returns false):
 * - minTiles < needed: region can't fit required stars (unsolvable)
 * - minTiles > needed: no deduction possible
 * - minTiles === Infinity: no valid tiling exists (unsolvable)
 */
export default function twoByTwoTiling(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  let changed = false;

  for (const [regionId, coords] of regions) {
    let stars = 0;
    for (const [row, col] of coords) if (cells[row][col] === "star") stars++;

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling = findAllMinimalTilings(coords, cells, size);

    // Skip when no deduction possible:
    // - Infinity: no valid tiling exists
    // - minTileCount !== needed: tiles don't match star quota
    if (tiling.minTileCount !== needed) continue;

    // Place stars on forced cells (single-coverage in all tilings)
    for (const [row, col] of tiling.forcedCells) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "star";
        changed = true;
      }
    }

    // Mark non-region cells that are covered by tiles in ALL minimal tilings
    const forcedNonRegion = findForcedNonRegionCells(tiling.allMinimalTilings);
    for (const [row, col] of forcedNonRegion) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }

    // Mark cells that would force adjacent stars in ALL tilings
    const unknownCells = coords.filter(([r, c]) => cells[r][c] === "unknown");
    const invalidCells = findInvalidCellsDueToAdjacency(
      unknownCells,
      tiling.allMinimalTilings,
      cells,
    );
    for (const [row, col] of invalidCells) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }
  return changed;
}

/**
 * Find non-region cells that appear in ALL minimal tilings.
 * These cells cannot have stars because the tile's star must be in the region.
 */
function findForcedNonRegionCells(allMinimalTilings: Tile[][]): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  // For each tiling, collect non-region cells (cells - coveredCells for each tile)
  const nonRegionSets: Set<string>[] = allMinimalTilings.map((tiling) => {
    const nonRegion = new Set<string>();
    for (const tile of tiling) {
      const coveredKeys = new Set(tile.coveredCells.map(coordKey));
      for (const cell of tile.cells) {
        const key = coordKey(cell);
        if (!coveredKeys.has(key)) {
          nonRegion.add(key);
        }
      }
    }
    return nonRegion;
  });

  // Find intersection across all tilings
  const intersection = [...nonRegionSets[0]].filter((key) =>
    nonRegionSets.every((set) => set.has(key)),
  );

  // Convert back to coordinates
  return intersection.map((key) => {
    const [row, col] = key.split(",").map(Number);
    return [row, col] as Coord;
  });
}

/**
 * Find cells that cannot be stars because placing a star there
 * would force adjacent stars in ALL minimal tilings.
 *
 * For each candidate cell X in the region:
 * - For each tiling, find the tile containing X
 * - Assume X is the star in that tile
 * - Check if stars can be placed in other tiles without adjacency conflicts
 * - If NO tiling allows X to be a star without forcing adjacency, mark X
 */
function findInvalidCellsDueToAdjacency(
  unknownCells: Coord[],
  allMinimalTilings: Tile[][],
  cells: CellState[][],
): Coord[] {
  if (allMinimalTilings.length === 0 || unknownCells.length === 0) return [];

  const invalidCells: Coord[] = [];
  const unknownSet = new Set(unknownCells.map(coordKey));

  for (const cell of unknownCells) {
    const cellKey = coordKey(cell);

    // Check if this cell can be a star in ANY tiling without forcing adjacency
    let canBeStarInSomeTiling = false;

    for (const tiling of allMinimalTilings) {
      // Find the tile containing this cell
      const containingTile = tiling.find((tile) =>
        tile.coveredCells.some((c) => coordKey(c) === cellKey),
      );

      if (!containingTile) continue;

      // Get other tiles in this tiling
      const otherTiles = tiling.filter((t) => t !== containingTile);

      // Check if we can place stars in other tiles without adjacency to cell
      // and without adjacency to each other
      if (canPlaceStarsInTiles(cell, otherTiles, unknownSet, cells)) {
        canBeStarInSomeTiling = true;
        break;
      }
    }

    if (!canBeStarInSomeTiling) {
      invalidCells.push(cell);
    }
  }

  return invalidCells;
}

/**
 * Check if stars can be placed in the given tiles such that:
 * 1. No star is adjacent to the assumed star at `assumedStar`
 * 2. No two stars are adjacent to each other
 */
function canPlaceStarsInTiles(
  assumedStar: Coord,
  tiles: Tile[],
  unknownSet: Set<string>,
  cells: CellState[][],
): boolean {
  const placed: Coord[] = [];
  const tilesNeedingStars: Coord[][] = [];

  for (const tile of tiles) {
    const existingStar = tile.coveredCells.find(
      ([r, c]) => cells[r][c] === "star",
    );

    if (existingStar) {
      // Tile already has a star - check adjacencies
      if (cellsAreAdjacent(existingStar, assumedStar)) return false;
      if (placed.some((p) => cellsAreAdjacent(existingStar, p))) return false;
      placed.push(existingStar);
    } else {
      // Find valid positions: unknown and not adjacent to assumedStar
      const valid = tile.coveredCells.filter(
        (c) => unknownSet.has(coordKey(c)) && !cellsAreAdjacent(c, assumedStar),
      );
      if (valid.length === 0) return false;
      tilesNeedingStars.push(valid);
    }
  }

  // Backtrack to assign stars to remaining tiles
  return assignStars(tilesNeedingStars, 0, placed);
}

/** Backtrack to find if a valid star assignment exists for remaining tiles. */
function assignStars(tiles: Coord[][], idx: number, placed: Coord[]): boolean {
  if (idx >= tiles.length) return true;

  for (const pos of tiles[idx]) {
    if (placed.some((p) => cellsAreAdjacent(pos, p))) continue;
    placed.push(pos);
    if (assignStars(tiles, idx + 1, placed)) return true;
    placed.pop();
  }
  return false;
}
