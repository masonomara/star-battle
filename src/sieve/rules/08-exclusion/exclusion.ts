import buildRegions from "../../helpers/regions";
import { cellKey } from "../../helpers/cellKey";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, Coord, TilingCache } from "../../helpers/types";
import { markNeighbors } from "../01-trivialNeighbors/trivialNeighbors";

export default function exclusion(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    regionStars.set(id, stars);
  }

  const tight = new Map<number, { coords: Coord[]; needed: number }>();
  for (const [id, coords] of regions) {
    const needed = board.stars - regionStars.get(id)!;
    if (needed <= 0) continue;
    const tiling =
      tilingCache?.byRegion.get(id) ??
      findAllMinimalTilings(coords, cells, size);
    if (tiling.minTileCount === needed) tight.set(id, { coords, needed });
  }
  if (tight.size === 0) return false;

  const toCheck = new Set<string>();
  for (const [, { coords }] of tight) {
    for (const [r, c] of coords) {
      toCheck.add(cellKey(r, c));
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr,
            nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size)
            toCheck.add(cellKey(nr, nc));
        }
      }
    }
  }

  for (const k of toCheck) {
    const [row, col] = k.split(",").map(Number);
    if (cells[row][col] !== "unknown") continue;

    const temp = cells.map((r) => [...r]);
    temp[row][col] = "star";
    markNeighbors(temp, row, col);

    for (const [regionId, { coords, needed }] of tight) {
      const inRegion = board.grid[row][col] === regionId;
      const rem = inRegion ? needed - 1 : needed;
      if (rem <= 0) continue;
      const t = findAllMinimalTilings(coords, temp, size);
      if (t.minTileCount < rem) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }
  return false;
}
