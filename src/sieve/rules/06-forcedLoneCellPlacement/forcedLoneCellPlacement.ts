import { CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

/**
 * When a lone cell is forced (detected by BoardAnalysis), place a star.
 */
export default function forcedLoneCellPlacement(
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  for (const [row, col] of analysis.forcedLoneCells) {
    if (cells[row][col] === "unknown") {
      cells[row][col] = "star";
      return true;
    }
  }
  return false;
}
