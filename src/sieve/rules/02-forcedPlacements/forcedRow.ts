import { Board, CellState, Coord } from "../../helpers/types";

/**
 * When unknowns in a row equal needed stars, place one star.
 */
export default function forcedRow(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }
    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  return false;
}
