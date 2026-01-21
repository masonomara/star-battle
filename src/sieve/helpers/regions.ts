import { Coord } from "./types";

export default function buildRegions(grid: number[][]) {
  const map = new Map<number, Coord[]>();
  const numRows = grid.length;
  if (numRows === 0) return map;
  const numCols = grid[0].length;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const id = grid[r][c];
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push([r, c]);
    }
  }
  return map;
}
