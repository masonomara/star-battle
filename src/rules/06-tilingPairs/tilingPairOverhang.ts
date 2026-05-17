import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { squeezePairLoop } from "../../helpers/tilingPairs";
import { filterActiveTilings, findForcedOverhangCells } from "../../helpers/tilingEnumeration";

export function tilingPairOverhang(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return squeezePairLoop(cells, size, board.stars, analysis, axis, (pairCells, tiling) => {
      if (tiling.tilings.length === 0) return false;
      const pairSet = new Set<number>(pairCells.map(([r, c]) => r * size + c));
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
  };
}
