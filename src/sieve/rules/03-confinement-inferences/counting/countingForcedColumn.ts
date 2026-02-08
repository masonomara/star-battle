/**
 * Rule: Enum Overcounting Forced (Column)
 *
 * If a group of columns forms a tight constraint and a region has exactly as
 * many unknowns inside as it must contribute, those cells must be stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { enumOvercountingLoop } from "./enumOvercountingHelper";

export default function enumOvercountingForcedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return enumOvercountingLoop(board, cells, analysis, "col",
    (cells, mask, inside, maxContrib, _starsNeeded, unknownCoords) => {
      if (inside !== maxContrib) return false;
      let changed = false;
      for (const [r, c] of unknownCoords) {
        if ((mask >> c) & 1 && cells[r][c] === "unknown") {
          cells[r][c] = "star";
          changed = true;
        }
      }
      return changed;
    },
  );
}
