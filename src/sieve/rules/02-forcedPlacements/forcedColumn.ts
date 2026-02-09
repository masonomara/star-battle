import { Board, CellState, Coord } from "../../helpers/types";

/**
 * When unknowns in a column equal needed stars, place one star.
 */
export default function forcedColumn(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;

  for (let col = 0; col < size; col++) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }
    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      for (const [r, c] of unknowns) {
        cells[r][c] = "star";
      }
      return true;
    }
  }

  return false;
}
