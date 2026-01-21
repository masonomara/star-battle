import buildRegions from "../../helpers/regions";
import { cellKey } from "../../helpers/cellKey";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, TilingCache } from "../../helpers/types";

export default function twoByTwoTiling(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  for (const [regionId, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling =
      tilingCache?.byRegion.get(regionId) ??
      findAllMinimalTilings(coords, cells, size);

    if (tiling.allMinimalTilings.length === 0 || tiling.minTileCount !== needed)
      continue;

    for (const [row, col] of coords) {
      if (cells[row][col] !== "unknown") continue;
      const k = cellKey(row, col);

      const isSingle = tiling.allMinimalTilings.every((ts) => {
        const tile = ts.find((t) =>
          t.coveredCells.some((c) => cellKey(c[0], c[1]) === k),
        );
        return tile && tile.coveredCells.length === 1;
      });

      if (isSingle) {
        cells[row][col] = "star";
        return true;
      }
    }
  }
  return false;
}
