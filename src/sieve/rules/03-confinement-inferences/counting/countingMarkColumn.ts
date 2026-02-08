/**
 * Rule: Enum Overcounting Mark (Column)
 *
 * If a group of columns forms a tight constraint with its touching regions,
 * every region must contribute its max — mark region cells outside those columns.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumOvercountingLoop } from "./enumOvercountingHelper";

export default function enumOvercountingMarkColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return enumOvercountingLoop(board, cells, analysis, "col",
    (cells, mask, _inside, maxContrib, starsNeeded, unknownCoords) => {
      if (maxContrib !== starsNeeded) return false;
      let changed = false;
      for (const [r, c] of unknownCoords) {
        if (!((mask >> c) & 1) && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
