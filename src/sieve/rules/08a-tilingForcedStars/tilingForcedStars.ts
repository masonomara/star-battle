import buildRegions from "../../helpers/regions";
import { computeTiling } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * Rule 8a: Tiling Forced Stars
 *
 * When capacity === starsNeeded, each tile contains exactly one star.
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
    const unknowns: Coord[] = [];
    for (const [row, col] of coords) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling = computeTiling(unknowns, size);
    if (tiling.capacity !== needed) continue;

    for (const [row, col] of tiling.forcedCells) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "star";
        changed = true;
      }
    }
  }

  return changed;
}
