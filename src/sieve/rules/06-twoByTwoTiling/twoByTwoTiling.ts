import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, Coord, Tile } from "../../helpers/types";
import { coordKey } from "../../helpers/cellKey";

/**
 * Rule 6: The 2×2 Tiling
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
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling = findAllMinimalTilings(coords, cells, size);

    // Skip when no deduction possible:
    // - Infinity: no valid tiling exists
    // - minTileCount !== needed: tiles don't match star quota
    if (tiling.minTileCount !== needed) continue;

    // Place stars on forced cells (single-coverage in all tilings)
    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "star";
        changed = true;
      }
    }

    // Mark non-region cells that are covered by tiles in ALL minimal tilings
    const forcedNonRegion = findForcedNonRegionCells(tiling.allMinimalTilings);
    for (const [r, c] of forcedNonRegion) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "marked";
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
    const [r, c] = key.split(",").map(Number);
    return [r, c] as Coord;
  });
}
