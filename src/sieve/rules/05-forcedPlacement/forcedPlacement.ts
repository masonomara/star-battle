import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * When unknowns equal needed stars, place one star.
 * Only places one star per call to let starNeighbors rule
 * exclude adjacent cells before the next placement.
 */
function placeOneForced(
  board: Board,
  cells: CellState[][],
  coords: Coord[],
): boolean {
  let stars = 0;
  const unknowns: Coord[] = [];
  for (const [row, col] of coords) {
    if (cells[row][col] === "star") stars++;
    else if (cells[row][col] === "unknown") unknowns.push([row, col]);
  }
  const needed = board.stars - stars;
  if (needed > 0 && unknowns.length === needed) {
    const [row, col] = unknowns[0];
    cells[row][col] = "star";
    return true;
  }
  return false;
}

export default function forcedPlacement(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    const coords: Coord[] = [];
    for (let col = 0; col < size; col++) coords.push([row, col]);
    if (placeOneForced(board, cells, coords)) return true;
  }

  for (let col = 0; col < size; col++) {
    const coords: Coord[] = [];
    for (let row = 0; row < size; row++) coords.push([row, col]);
    if (placeOneForced(board, cells, coords)) return true;
  }

  for (const coords of getRegionCoords(board.grid)) {
    if (placeOneForced(board, cells, coords)) return true;
  }

  return false;
}
