/**
 * Rule: Enum Overcounting Mark (Row)
 *
 * If a group of rows forms a tight constraint with its touching regions,
 * every region must contribute its max — mark region cells outside those rows.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumOvercountingLoop } from "./enumOvercountingHelper";

export default function enumOvercountingMarkRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return enumOvercountingLoop(board, cells, analysis, "row",
    (cells, mask, _inside, maxContrib, starsNeeded, unknownCoords) => {
      if (maxContrib !== starsNeeded) return false;
      let changed = false;
      for (const [r, c] of unknownCoords) {
        if (!((mask >> r) & 1) && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
      return changed;
    },
  );
}
