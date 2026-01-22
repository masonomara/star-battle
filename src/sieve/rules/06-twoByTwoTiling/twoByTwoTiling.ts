import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState } from "../../helpers/types";

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
