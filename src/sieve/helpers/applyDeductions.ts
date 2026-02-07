import { CellState, Deduction } from "./types";

export function applyDeductions(
  cells: CellState[][],
  deductions: Deduction[],
): boolean {
  let changed = false;
  for (const {
    coord: [r, c],
    state,
  } of deductions) {
    if (cells[r][c] === "unknown") {
      cells[r][c] = state;
      changed = true;
    }
  }
  return changed;
}
