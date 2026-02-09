import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { collectValidStarCells } from "../../helpers/tilingEnumeration";
import { Board, CellState } from "../../helpers/types";

export default function tilingAdjacencyMarks(
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

    const insideSet = new Set<number>();
    for (const [r, c] of meta.unknownCoords) {
      insideSet.add(r * size + c);
    }

    const validStarCells = collectValidStarCells(
      tiling.tilings,
      insideSet,
      cells,
      size,
    );

    for (const [row, col] of meta.unknownCoords) {
      if (!validStarCells.has(row * size + col) && cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
