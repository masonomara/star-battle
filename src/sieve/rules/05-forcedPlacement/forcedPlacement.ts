import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * If unknowns === needed stars, places all forced stars.
 * Returns true if any stars were placed.
 */
function placeAllForced(
  board: Board,
  cells: CellState[][],
  coords: Coord[],
): boolean {
  let stars = 0;
  const unknowns: Coord[] = [];
  for (const [r, c] of coords) {
    if (cells[r][c] === "star") stars++;
    else if (cells[r][c] === "unknown") unknowns.push([r, c]);
  }
  const needed = board.stars - stars;
  if (needed > 0 && unknowns.length === needed) {
    for (const [r, c] of unknowns) {
      cells[r][c] = "star";
    }
    return true;
  }
  return false;
}

export default function forcedPlacement(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;

  for (let row = 0; row < size; row++) {
    const coords: Coord[] = [];
    for (let c = 0; c < size; c++) coords.push([row, c]);
    if (placeAllForced(board, cells, coords)) changed = true;
  }

  for (let col = 0; col < size; col++) {
    const coords: Coord[] = [];
    for (let r = 0; r < size; r++) coords.push([r, col]);
    if (placeAllForced(board, cells, coords)) changed = true;
  }

  for (const coords of getRegionCoords(board.grid)) {
    if (placeAllForced(board, cells, coords)) changed = true;
  }

  return changed;
}
