import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, Coord, Tile } from "../../helpers/types";
import { coordKey } from "../../helpers/cellKey";

/**
 * Rule 8b: Tiling Overhang Marks
 *
 * When minTiles === starsNeeded, each tile contains exactly one star.
 * Non-region cells covered by tiles in ALL minimal tilings cannot have stars
 * (the tile's star must be in the region portion).
 */
export default function tilingOverhangMarks(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  let changed = false;

  for (const [, coords] of regions) {
    let stars = 0;
    for (const [row, col] of coords) if (cells[row][col] === "star") stars++;

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling = findAllMinimalTilings(coords, cells, size);
    if (tiling.minTileCount !== needed) continue;

    const forcedNonRegion = findForcedNonRegionCells(tiling.allMinimalTilings);
    for (const [row, col] of forcedNonRegion) {
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
 */
function findForcedNonRegionCells(allMinimalTilings: Tile[][]): Coord[] {
  if (allMinimalTilings.length === 0) return [];

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

  const intersection = [...nonRegionSets[0]].filter((key) =>
    nonRegionSets.every((set) => set.has(key)),
  );

  return intersection.map((key) => {
    const [row, col] = key.split(",").map(Number);
    return [row, col] as Coord;
  });
}
