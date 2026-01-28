import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * Check if two cells are adjacent (share edge or corner).
 */
function areAdjacent(a: Coord, b: Coord): boolean {
  const drow = Math.abs(a[0] - b[0]);
  const dcol = Math.abs(a[1] - b[1]);
  return drow <= 1 && dcol <= 1 && !(drow === 0 && dcol === 0);
}

/**
 * Check if any pair of cells in the list are adjacent.
 */
function hasAdjacentPair(coords: Coord[]): boolean {
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      if (areAdjacent(coords[i], coords[j])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * If unknowns === needed stars, places all forced stars.
 * Returns true if any stars were placed.
 * Returns false if placement would create adjacent stars (unsolvable state).
 */
function placeAllForced(
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
    // Validate: forced cells must not be adjacent to each other
    if (hasAdjacentPair(unknowns)) {
      return false; // Unsolvable - let solver fail
    }
    for (const [row, col] of unknowns) {
      cells[row][col] = "star";
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
    for (let col = 0; col < size; col++) coords.push([row, col]);
    if (placeAllForced(board, cells, coords)) changed = true;
  }

  for (let col = 0; col < size; col++) {
    const coords: Coord[] = [];
    for (let row = 0; row < size; row++) coords.push([row, col]);
    if (placeAllForced(board, cells, coords)) changed = true;
  }

  for (const coords of getRegionCoords(board.grid)) {
    if (placeAllForced(board, cells, coords)) changed = true;
  }

  return changed;
}
