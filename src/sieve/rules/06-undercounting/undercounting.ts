import { Board, CellState } from "../../helpers/types";

export default function undercounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  const regionRows = new Map<number, Set<number>>();
  const regionCols = new Map<number, Set<number>>();
  const regionStars = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = board.grid[row][col];
      if (!regionRows.has(id)) {
        regionRows.set(id, new Set());
        regionCols.set(id, new Set());
        regionStars.set(id, 0);
      }
      regionRows.get(id)!.add(row);
      regionCols.get(id)!.add(col);
      if (cells[row][col] === "star") regionStars.set(id, regionStars.get(id)! + 1);
    }
  }

  const active = [...regionRows.keys()].filter(
    (id) => regionStars.get(id)! < board.stars,
  );
  const inRows = (id: number, rows: Set<number>) =>
    [...regionRows.get(id)!].every((row) => rows.has(row));
  const inCols = (id: number, cols: Set<number>) =>
    [...regionCols.get(id)!].every((col) => cols.has(col));

  for (const id of active) {
    const rows = regionRows.get(id)!;
    const contained = active.filter((i) => inRows(i, rows));
    if (contained.length === rows.size) {
      const set = new Set(contained);
      for (const row of rows) {
        for (let col = 0; col < size; col++) {
          if (!set.has(board.grid[row][col]) && cells[row][col] === "unknown") {
            cells[row][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }

  for (const id of active) {
    const cols = regionCols.get(id)!;
    const contained = active.filter((i) => inCols(i, cols));
    if (contained.length === cols.size) {
      const set = new Set(contained);
      for (const col of cols) {
        for (let row = 0; row < size; row++) {
          if (!set.has(board.grid[row][col]) && cells[row][col] === "unknown") {
            cells[row][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}
