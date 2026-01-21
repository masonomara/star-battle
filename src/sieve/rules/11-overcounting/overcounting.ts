import buildRegions from "../../helpers/regions";
import { Board, CellState } from "../../helpers/types";

export function overcounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  const regions = buildRegions(board.grid);
  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    regionStars.set(id, stars);
  }

  const active = new Set(
    [...regions.keys()].filter((id) => regionStars.get(id)! < board.stars),
  );

  const rowRegions = new Map<number, Set<number>>();
  const colRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    rowRegions.set(i, new Set());
    colRegions.set(i, new Set());
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (active.has(id)) {
        rowRegions.get(r)!.add(id);
        colRegions.get(c)!.add(id);
      }
    }
  }

  for (let start = 0; start < size; start++) {
    const rowSet = new Set<number>();
    const regSet = new Set<number>();
    for (let end = start; end < size; end++) {
      rowSet.add(end);
      const prev = regSet.size;
      for (const id of rowRegions.get(end)!) regSet.add(id);
      const added = regSet.size > prev;

      if (regSet.size === rowSet.size) {
        let valid = true;
        for (const row of rowSet) {
          for (let c = 0; c < size && valid; c++)
            if (!regSet.has(board.grid[row][c])) valid = false;
        }
        if (valid) {
          for (const id of regSet) {
            for (const [r, c] of regions.get(id)!) {
              if (!rowSet.has(r) && cells[r][c] === "unknown") {
                cells[r][c] = "marked";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }
      if (end > start && added && regSet.size > rowSet.size) break;
    }
  }

  for (let start = 0; start < size; start++) {
    const colSet = new Set<number>();
    const regSet = new Set<number>();
    for (let end = start; end < size; end++) {
      colSet.add(end);
      const prev = regSet.size;
      for (const id of colRegions.get(end)!) regSet.add(id);
      const added = regSet.size > prev;

      if (regSet.size === colSet.size) {
        let valid = true;
        for (const col of colSet) {
          for (let r = 0; r < size && valid; r++)
            if (!regSet.has(board.grid[r][col])) valid = false;
        }
        if (valid) {
          for (const id of regSet) {
            for (const [r, c] of regions.get(id)!) {
              if (!colSet.has(c) && cells[r][c] === "unknown") {
                cells[r][c] = "marked";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }
      if (end > start && added && regSet.size > colSet.size) break;
    }
  }

  return changed;
}
