import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

// Generate all combinations of size k from array
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (k > arr.length) return;

  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of combinations(arr.slice(i + 1), k - 1)) {
      yield [arr[i], ...rest];
    }
  }
}

export default function undercounting(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regionRows, regionCols, activeRegions } = analysis;
  const active = activeRegions.map((r) => r.id);

  const inRows = (id: number, rows: Set<number>) =>
    [...regionRows.get(id)!].every((row) => rows.has(row));
  const inCols = (id: number, cols: Set<number>) =>
    [...regionCols.get(id)!].every((col) => cols.has(col));

  // Helper to apply undercounting for a given row set
  const applyRowUndercounting = (rows: Set<number>): boolean => {
    const contained = active.filter((i) => inRows(i, rows));
    if (contained.length === rows.size) {
      const set = new Set(contained);
      let localChanged = false;
      for (const row of rows) {
        for (let col = 0; col < size; col++) {
          if (!set.has(board.grid[row][col]) && cells[row][col] === "unknown") {
            cells[row][col] = "marked";
            localChanged = true;
          }
        }
      }
      return localChanged;
    }
    return false;
  };

  // Helper to apply undercounting for a given col set
  const applyColUndercounting = (cols: Set<number>): boolean => {
    const contained = active.filter((i) => inCols(i, cols));
    if (contained.length === cols.size) {
      const set = new Set(contained);
      let localChanged = false;
      for (const col of cols) {
        for (let row = 0; row < size; row++) {
          if (!set.has(board.grid[row][col]) && cells[row][col] === "unknown") {
            cells[row][col] = "marked";
            localChanged = true;
          }
        }
      }
      return localChanged;
    }
    return false;
  };

  const processedRows = new Set<string>();
  const processedCols = new Set<string>();

  let rowChanged = false;
  let colChanged = false;

  // Single-region seeding
  for (const id of active) {
    const rowKey = [...regionRows.get(id)!].sort((a, b) => a - b).join(",");
    if (!processedRows.has(rowKey)) {
      processedRows.add(rowKey);
      if (applyRowUndercounting(regionRows.get(id)!)) rowChanged = true;
    }
  }
  for (const id of active) {
    const colKey = [...regionCols.get(id)!].sort((a, b) => a - b).join(",");
    if (!processedCols.has(colKey)) {
      processedCols.add(colKey);
      if (applyColUndercounting(regionCols.get(id)!)) colChanged = true;
    }
  }

  // Union-based seeding: combinations of 2 to N regions
  const maxCombinationSize = Math.min(active.length, 24);
  for (let k = 2; k <= maxCombinationSize; k++) {
    for (const combo of combinations(active, k)) {
      // Row union
      const rowUnion = new Set<number>();
      for (const id of combo) {
        for (const row of regionRows.get(id)!) rowUnion.add(row);
      }
      const rowKey = [...rowUnion].sort((a, b) => a - b).join(",");
      if (!processedRows.has(rowKey)) {
        processedRows.add(rowKey);
        if (applyRowUndercounting(rowUnion)) rowChanged = true;
      }

      // Col union
      const colUnion = new Set<number>();
      for (const id of combo) {
        for (const col of regionCols.get(id)!) colUnion.add(col);
      }
      const colKey = [...colUnion].sort((a, b) => a - b).join(",");
      if (!processedCols.has(colKey)) {
        processedCols.add(colKey);
        if (applyColUndercounting(colUnion)) colChanged = true;
      }
    }
  }

  return rowChanged || colChanged;
}
