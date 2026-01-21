import { getRegionCoords } from "../../helpers/regions";
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

function* allConstraints(board: Board): Generator<Coord[]> {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    yield Array.from({ length: size }, (_, c) => [row, c] as Coord);
  }

  for (let col = 0; col < size; col++) {
    yield Array.from({ length: size }, (_, r) => [r, col] as Coord);
  }

  yield* getRegionCoords(board.grid);
}

export default function forcedPlacement(
  board: Board,
  cells: CellState[][],
): boolean {
  for (const constraint of allConstraints(board)) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (const [r, c] of constraint) {
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
