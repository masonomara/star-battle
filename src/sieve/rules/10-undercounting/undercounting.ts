import { Board, CellState } from "../../helpers/types";

export default function undercounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  const regionRows = new Map<number, Set<number>>();
  const regionCols = new Map<number, Set<number>>();
  const regionStars = new Map<number, number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!regionRows.has(id)) {
        regionRows.set(id, new Set());
        regionCols.set(id, new Set());
        regionStars.set(id, 0);
      }
      regionRows.get(id)!.add(r);
      regionCols.get(id)!.add(c);
      if (cells[r][c] === "star") regionStars.set(id, regionStars.get(id)! + 1);
    }
  }

  const active = [...regionRows.keys()].filter(
    (id) => regionStars.get(id)! < board.stars,
  );
  const inRows = (id: number, rows: Set<number>) =>
    [...regionRows.get(id)!].every((r) => rows.has(r));
  const inCols = (id: number, cols: Set<number>) =>
    [...regionCols.get(id)!].every((c) => cols.has(c));

  for (const id of active) {
    const rows = regionRows.get(id)!;
    const contained = active.filter((i) => inRows(i, rows));
    if (contained.length === rows.size) {
      const set = new Set(contained);
      for (const row of rows) {
        for (let c = 0; c < size; c++) {
          if (!set.has(board.grid[row][c]) && cells[row][c] === "unknown") {
            cells[row][c] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  if (changed) return true;

  for (const id of active) {
    const cols = regionCols.get(id)!;
    const contained = active.filter((i) => inCols(i, cols));
    if (contained.length === cols.size) {
      const set = new Set(contained);
      for (const col of cols) {
        for (let r = 0; r < size; r++) {
          if (!set.has(board.grid[r][col]) && cells[r][col] === "unknown") {
            cells[r][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}
