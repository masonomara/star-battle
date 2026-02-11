import { BoardAnalysis } from "./boardAnalysis";
import { CellState, Coord, TilingResult } from "./types";

export function squeezePairLoop(
  cells: CellState[][],
  size: number,
  stars: number,
  analysis: BoardAnalysis,
  axis: "row" | "col",
  onTightPair: (pairCells: Coord[], tiling: TilingResult) => boolean,
): boolean {
  const starsPerPair = stars * 2;
  let changed = false;

  for (let i = 0; i < size - 1; i++) {
    const pairCells: Coord[] = [];
    let existingStars = 0;

    for (let j = 0; j < size; j++) {
      const r0 = axis === "row" ? i : j;
      const c0 = axis === "row" ? j : i;
      const r1 = axis === "row" ? i + 1 : j;
      const c1 = axis === "row" ? j : i + 1;

      if (cells[r0][c0] === "unknown") pairCells.push([r0, c0]);
      if (cells[r1][c1] === "unknown") pairCells.push([r1, c1]);
      if (cells[r0][c0] === "star") existingStars++;
      if (cells[r1][c1] === "star") existingStars++;
    }

    if (pairCells.length === 0) continue;
    const neededStars = starsPerPair - existingStars;
    if (neededStars <= 0) continue;

    const tiling = analysis.getTiling(pairCells);
    if (tiling.capacity !== neededStars) continue;

    if (onTightPair(pairCells, tiling)) {
      changed = true;
    }
  }

  return changed;
}
