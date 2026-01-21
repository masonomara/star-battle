import buildRegions from "../../helpers/regions";
import { cellKey } from "../../helpers/cellKey";
import { findAllMinimalTilings } from "../../helpers/tiling";
import {
  Board,
  CellState,
  Coord,
  StripCache,
  TilingCache,
} from "../../helpers/types";
import { markNeighbors } from "../01-trivialNeighbors/trivialNeighbors";

export default function pressuredExclusion(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  stripCache?: StripCache,
): boolean {
  if (!stripCache) return false;

  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    regionStars.set(id, stars);
  }

  const seen = new Set<string>();
  const candidates: Coord[] = [];
  for (const [regionId, strips] of stripCache.byRegion) {
    if (board.stars - (regionStars.get(regionId) ?? 0) <= 0) continue;
    for (const strip of strips) {
      if (strip.starsNeeded <= 0) continue;
      for (const [r, c] of strip.cells) {
        const k = cellKey(r, c);
        if (cells[r][c] === "unknown" && !seen.has(k)) {
          seen.add(k);
          candidates.push([r, c]);
        }
      }
    }
  }

  for (const [fr, fc] of candidates) {
    const temp = cells.map((row) => [...row]);
    temp[fr][fc] = "star";
    markNeighbors(temp, fr, fc, size);

    for (const [regionId, coords] of regions) {
      const existing = regionStars.get(regionId) ?? 0;
      const inRegion = board.grid[fr][fc] === regionId;
      const needed = board.stars - existing - (inRegion ? 1 : 0);
      if (needed <= 0) continue;
      const t = findAllMinimalTilings(coords, temp, size);
      if (t.minTileCount < needed) {
        cells[fr][fc] = "marked";
        return true;
      }
    }

    for (const [regionId, coords] of regions) {
      if (board.grid[fr][fc] === regionId) continue;
      const needed = board.stars - (regionStars.get(regionId) ?? 0);
      if (needed <= 0) continue;
      const t = findAllMinimalTilings(coords, temp, size);
      if (t.allMinimalTilings.length === 0) continue;

      const colUsedInAll = t.allMinimalTilings.every((tl) =>
        tl.some((tile) => tile.coveredCells.some(([, c]) => c === fc)),
      );

      if (colUsedInAll) {
        const blocked = temp.map((row) => [...row]);
        for (let r = 0; r < size; r++)
          if (blocked[r][fc] === "unknown") blocked[r][fc] = "marked";

        for (const [otherId, otherCoords] of regions) {
          if (otherId === regionId || board.grid[fr][fc] === otherId) continue;
          const otherNeeded = board.stars - (regionStars.get(otherId) ?? 0);
          if (otherNeeded <= 0) continue;
          const ot = findAllMinimalTilings(otherCoords, blocked, size);
          if (ot.minTileCount < otherNeeded) {
            cells[fr][fc] = "marked";
            return true;
          }
        }
      }
    }
  }
  return false;
}
