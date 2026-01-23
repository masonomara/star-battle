// TODO: Strengthen using forcedCells from tiling results.
// Per spec Rule 8: if hypothetical star creates forced cells that violate
// row/column constraints (e.g., two forced in same row), candidate can be marked.

import buildRegions from "../../helpers/regions";
import { findAllMinimalTilings } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";

export default function exclusion(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  // Build region info: coords and stars still needed
  const regionInfo = new Map<number, { coords: Coord[]; needed: number }>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    const needed = board.stars - stars;
    if (needed > 0) regionInfo.set(id, { coords, needed });
  }

  if (regionInfo.size === 0) return false;

  // Check every unknown cell
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const temp = cells.map((r) => [...r]);
      temp[row][col] = "star";
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && temp[nr][nc] === "unknown") {
            temp[nr][nc] = "marked";
          }
        }
      }

      for (const [regionId, { coords, needed }] of regionInfo) {
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
  }
  return false;
}
