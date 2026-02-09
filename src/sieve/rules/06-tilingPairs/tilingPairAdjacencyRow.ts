import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { squeezePairLoop } from "../../helpers/squeezeHelper";
import { collectValidStarCells } from "../../helpers/tilingEnumeration";
import { Board, CellState } from "../../helpers/types";

export default function tilingPairAdjacencyRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  return squeezePairLoop(cells, size, board.stars, analysis, "row", (pairCells, tiling) => {
    if (tiling.tilings.length === 0) return false;

    const pairSet = new Set<number>();
    for (const [r, c] of pairCells) pairSet.add(r * size + c);

    const validStarCells = collectValidStarCells(tiling.tilings, pairSet, cells, size);
    let changed = false;

    for (const [r, c] of pairCells) {
      if (!validStarCells.has(r * size + c) && cells[r][c] === "unknown") {
        cells[r][c] = "marked";
        changed = true;
      }
    }

    return changed;
  });
}
