/**
 * Rule: Counting Forced (Row)
 *
 * If a group of rows forms a tight constraint and a region has exactly as many
 * unknowns inside as it must contribute, those cells must be stars.
 */

import { Board, CellState } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { countingLoop } from "./countingHelper";

export default function countingForcedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  return countingLoop(board, cells, analysis, "row",
    (cells, mask, inside, maxContrib, _starsNeeded, unknownCoords) => {
      if (inside !== maxContrib) return false;
      let changed = false;
      for (const [r, c] of unknownCoords) {
        if ((mask >> r) & 1 && cells[r][c] === "unknown") {
          cells[r][c] = "star";
          changed = true;
        }
      }
      return changed;
    },
  );
}
