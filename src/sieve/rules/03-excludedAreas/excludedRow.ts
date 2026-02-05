/**
 * Rule 09a: Confinement Mark Remainder (Row)
 *
 * When confined regions account for all stars a row needs,
 * mark the remaining cells in that row.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { computeConfinement } from "../../helpers/confinement";

export default function excludedRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  if (board.grid.length === 0) return false;

  const confinement = computeConfinement(analysis);
  const numCols = board.grid[0]?.length ?? 0;

  let changed = false;

  for (const [rowIndex, regions] of confinement.row) {
    const quota = board.stars - analysis.rowStars[rowIndex];
    if (quota <= 0) continue;

    const totalContribution = regions.reduce(
      (sum, r) => sum + r.starsNeeded,
      0,
    );
    if (totalContribution < quota) continue;

    const contributing = new Set<string>();
    for (const region of regions) {
      for (const [r, c] of region.cells) {
        contributing.add(`${r},${c}`);
      }
    }

    for (let col = 0; col < numCols; col++) {
      if (
        cells[rowIndex][col] === "unknown" &&
        !contributing.has(`${rowIndex},${col}`)
      ) {
        cells[rowIndex][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
