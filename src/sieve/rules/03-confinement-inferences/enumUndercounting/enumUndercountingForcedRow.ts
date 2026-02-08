/**
 * Rule: Enum Undercounting Forced (Row)
 *
 * If a group of regions forms a tight constraint and a row has exactly as many
 * unknowns inside those regions as it must contribute, those cells must be stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumUndercountingLoop } from "./enumUndercountingHelper";

export default function enumUndercountingForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const grid = board.grid;
  return enumUndercountingLoop(board, cells, analysis, "row",
    (cells, regionIdSet, lineIndex, inside, maxContrib, _lineStarsNeeded) => {
      if (inside !== maxContrib) return false;
      let changed = false;
      for (let col = 0; col < size; col++) {
        if (cells[lineIndex][col] === "unknown" && regionIdSet.has(grid[lineIndex][col])) {
          cells[lineIndex][col] = "star";
          changed = true;
        }
      }
      return changed;
    },
  );
}
