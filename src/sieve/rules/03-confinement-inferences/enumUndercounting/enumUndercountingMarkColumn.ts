/**
 * Rule: Enum Undercounting Mark (Column)
 *
 * If a group of regions forms a tight constraint with its touching columns,
 * every column must contribute its max — mark column cells outside those regions.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumUndercountingLoop } from "./enumUndercountingHelper";

export default function enumUndercountingMarkColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const grid = board.grid;
  return enumUndercountingLoop(board, cells, analysis, "col",
    (cells, regionIdSet, lineIndex, _inside, maxContrib, lineStarsNeeded) => {
      if (maxContrib !== lineStarsNeeded) return false;
      let changed = false;
      for (let row = 0; row < size; row++) {
        if (cells[row][lineIndex] === "unknown" && !regionIdSet.has(grid[row][lineIndex])) {
          cells[row][lineIndex] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
