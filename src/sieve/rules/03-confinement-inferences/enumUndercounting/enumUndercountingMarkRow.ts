/**
 * Rule: Enum Undercounting Mark (Row)
 *
 * If a group of regions forms a tight constraint with its touching rows,
 * every row must contribute its max — mark row cells outside those regions.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumUndercountingLoop } from "./enumUndercountingHelper";

export default function enumUndercountingMarkRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const grid = board.grid;
  return enumUndercountingLoop(board, cells, analysis, "row",
    (cells, regionIdSet, lineIndex, _inside, maxContrib, lineStarsNeeded) => {
      if (maxContrib !== lineStarsNeeded) return false;
      let changed = false;
      for (let col = 0; col < size; col++) {
        if (cells[lineIndex][col] === "unknown" && !regionIdSet.has(grid[lineIndex][col])) {
          cells[lineIndex][col] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
