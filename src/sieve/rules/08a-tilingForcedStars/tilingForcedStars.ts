import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState } from "../../helpers/types";

/**
 * Rule 8a: Tiling Forced Stars
 *
 * When minTiles === starsNeeded, each tile contains exactly one star.
 * Cells with single-coverage in ALL minimal tilings must be stars.
 */
export default function tilingForcedStars(
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

    for (const [row, col] of tiling.forcedCells) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "star";
        changed = true;
      }
    }
  }

  return changed;
}
