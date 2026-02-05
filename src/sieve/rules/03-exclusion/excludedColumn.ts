/**
 * Rule 09b: Confinement Mark Remainder (Column)
 *
 * When confined regions account for all stars a column needs,
 * mark the remaining cells in that column.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeConfinement } from "../../helpers/confinement";

export default function excludedColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  if (board.grid.length === 0) return false;

  const confinement = computeConfinement(analysis);
  const numRows = board.grid.length;

  let changed = false;

  for (const [colIndex, regions] of confinement.col) {
    const quota = board.stars - analysis.colStars[colIndex];
    if (quota <= 0) continue;

    const totalContribution = regions.reduce((sum, r) => sum + r.starsNeeded, 0);
    if (totalContribution < quota) continue;

    const contributing = new Set<string>();
    for (const region of regions) {
      for (const [r, c] of region.cells) {
        contributing.add(`${r},${c}`);
      }
    }

    for (let row = 0; row < numRows; row++) {
      if (
        cells[row][colIndex] === "unknown" &&
        !contributing.has(`${row},${colIndex}`)
      ) {
        cells[row][colIndex] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
