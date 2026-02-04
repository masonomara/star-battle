import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * When unknowns in a region equal needed stars, place one star.
 */
export default function forcedPlacementRegion(
  board: Board,
  cells: CellState[][],
): boolean {
  for (const coords of getRegionCoords(board.grid)) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (const [row, col] of coords) {
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
