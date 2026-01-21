import buildRegions from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";

function hasAdjacentPair(coords: Coord[]): boolean {
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      if (
        Math.abs(coords[i][0] - coords[j][0]) <= 1 &&
        Math.abs(coords[i][1] - coords[j][1]) <= 1
      )
        return true;
    }
  }
  return false;
}

export default function forcedPlacement(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (let c = 0; c < size; c++) {
      if (cells[row][c] === "star") stars++;
      else if (cells[row][c] === "unknown") unknowns.push([row, c]);
    }
    const needed = board.stars - stars;
    if (
      needed > 0 &&
      unknowns.length === needed &&
      !hasAdjacentPair(unknowns)
    ) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  for (let col = 0; col < size; col++) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (let r = 0; r < size; r++) {
      if (cells[r][col] === "star") stars++;
      else if (cells[r][col] === "unknown") unknowns.push([r, col]);
    }
    const needed = board.stars - stars;
    if (
      needed > 0 &&
      unknowns.length === needed &&
      !hasAdjacentPair(unknowns)
    ) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  for (const [, coords] of buildRegions(board.grid)) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (const [r, c] of coords) {
      if (cells[r][c] === "star") stars++;
      else if (cells[r][c] === "unknown") unknowns.push([r, c]);
    }
    const needed = board.stars - stars;
    if (
      needed > 0 &&
      unknowns.length === needed &&
      !hasAdjacentPair(unknowns)
    ) {
      const [r, c] = unknowns[0];
      cells[r][c] = "star";
      return true;
    }
  }

  return false;
}
