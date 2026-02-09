import { CellState } from "./helpers/types";

export function printBoard(grid: number[][]) {
  const size = grid.length;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => letters[i]).join(" ");
  console.log(colHeader);
  for (let r = 0; r < size; r++) {
    const label = String(r + 1).padStart(2);
    const row = grid[r].map((id) => letters[id]).join(" ");
    console.log(`${label}  ${row}`);
  }
}

export function printCellStateWithDiff(
  cells: CellState[][],
  prev: CellState[][] | null,
) {
  const size = cells.length;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const sym = { unknown: ".", marked: "X", star: "\u2605" };
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => letters[i]).join(" ");
  console.log(colHeader);
  for (let r = 0; r < size; r++) {
    const label = String(r + 1).padStart(2);
    const line = cells[r].map((c, i) => {
      const s = sym[c];
      return prev && prev[r][i] !== c ? `\x1b[43m\x1b[30m${s}\x1b[0m` : s;
    });
    console.log(`${label}  ${line.join(" ")}`);
  }
}
