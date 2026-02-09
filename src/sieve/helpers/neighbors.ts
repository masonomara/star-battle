import { Coord } from "./types";

export function cellKey(r: number, c: number, size: number): number {
  return r * size + c;
}

export function* neighbors(
  row: number,
  col: number,
  size: number,
): Generator<Coord> {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        yield [nr, nc];
      }
    }
  }
}

export function buildMarkedCellSet(
  row: number,
  col: number,
  size: number,
): Set<number> {
  const marked = new Set<number>();
  marked.add(cellKey(row, col, size));

  for (const [nr, nc] of neighbors(row, col, size)) {
    marked.add(cellKey(nr, nc, size));
  }

  return marked;
}
