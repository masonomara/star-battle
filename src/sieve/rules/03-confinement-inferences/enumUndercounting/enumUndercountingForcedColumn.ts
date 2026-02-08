/**
 * Rule: Enum Undercounting Forced (Column)
 *
 * If a group of regions forms a tight constraint and a column has exactly as many
 * unknowns inside those regions as it must contribute, those cells must be stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumUndercountingLoop } from "./enumUndercountingHelper";

export default function enumUndercountingForcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const grid = board.grid;
  return enumUndercountingLoop(board, cells, analysis, "col",
    (cells, regionIdSet, lineIndex, inside, maxContrib, _lineStarsNeeded) => {
      if (inside !== maxContrib) return false;
      let changed = false;
      for (let row = 0; row < size; row++) {
        if (cells[row][lineIndex] === "unknown" && regionIdSet.has(grid[row][lineIndex])) {
          cells[row][lineIndex] = "star";
          changed = true;
        }
      }
      return changed;
    },
  );
}
