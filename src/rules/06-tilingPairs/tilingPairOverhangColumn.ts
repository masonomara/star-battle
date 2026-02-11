import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { squeezePairLoop } from "../../helpers/tilingPairs";
import {
  filterActiveTilings,
  findForcedOverhangCells,
} from "../../helpers/tilingEnumeration";
import { Board, CellState } from "../../helpers/types";

export default function tilingPairOverhangColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;

  return squeezePairLoop(cells, size, board.stars, analysis, "col", (pairCells, tiling) => {
    if (tiling.tilings.length === 0) return false;

    const pairSet = new Set<number>();
    for (const [r, c] of pairCells) pairSet.add(r * size + c);

    const activeTilings = filterActiveTilings(tiling.tilings, pairSet, cells, size);
    let changed = false;

    for (const [r, c] of findForcedOverhangCells(activeTilings, pairSet, size)) {
      if (cells[r][c] === "unknown") {
        cells[r][c] = "marked";
        changed = true;
      }
    }

    return changed;
  });
}
