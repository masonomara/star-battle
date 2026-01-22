import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState } from "../../helpers/types";

/**
 * Rule 6: The 2×2 Tiling
 *
 * Places stars when tiling analysis reveals forced cells:
 * - When minTiles === starsNeeded, each tile contains exactly one star
 * - Cells that are single-coverage in ALL minimal tilings must be stars
 *
 * Edge cases (no progress, returns false):
 * - minTiles < needed: region can't fit required stars (unsolvable)
 * - minTiles > needed: no deduction possible
 * - minTiles === Infinity: no valid tiling exists (unsolvable)
 *
 * Note: This rule only places stars. Marking cells is handled by exclusion (Rule 8).
 */
export default function twoByTwoTiling(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  for (const [, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling = findAllMinimalTilings(coords, cells, size);

    // Skip when no deduction possible:
    // - Infinity: no valid tiling exists
    // - minTileCount !== needed: tiles don't match star quota
    if (tiling.minTileCount !== needed) continue;

    for (const [r, c] of tiling.forcedCells) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "star";
        return true;
      }
    }
  }
  return false;
}
