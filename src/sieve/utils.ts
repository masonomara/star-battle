import { Board } from "./types";

// Convert region ID to Excel-style label (A-Z, AA-AZ, BA-BZ, ...)
function regionLabel(id: number): string {
  let label = "";
  let n = id;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function printBoard(board: Board): string {
  const maxWidth = regionLabel(board.grid.length - 1).length;
  return board.grid
    .map((row) =>
      row.map((id) => regionLabel(id).padStart(maxWidth)).join(" "),
    )
    .join("\n");
}
