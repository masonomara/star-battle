import { BoardAnalysis } from "../../helpers/boardAnalysis";
import {
  filterActiveTilings,
  findForcedOverhangCells,
} from "../../helpers/tilingEnumeration";
import { Board, CellState } from "../../helpers/types";

export default function tilingOverhangMarks(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  let changed = false;

  for (const [, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const tiling = analysis.getTiling(meta.unknownCoords);
    if (tiling.capacity !== meta.starsNeeded) continue;
    if (tiling.tilings.length === 0) continue;

    const insideSet = new Set<number>();
    for (const [r, c] of meta.unknownCoords) {
      insideSet.add(r * size + c);
    }

    const activeTilings = filterActiveTilings(tiling.tilings, insideSet, cells, size);
    if (activeTilings.length === 0) continue;

    for (const [row, col] of findForcedOverhangCells(activeTilings, insideSet, size)) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
