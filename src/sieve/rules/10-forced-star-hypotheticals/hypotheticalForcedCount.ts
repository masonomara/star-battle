/**
 * Hypothetical Forced Count
 *
 * If a hypothetical star forces another star (via Forced Placement),
 * and the forced star's neighbors leave any row, column, or region
 * without enough remaining cells for its required stars, mark the
 * original cell.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/neighbors";
import { findForcedStars } from "../../helpers/findForcedStars";

export default function hypotheticalForcedCount(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      const forcedStars = findForcedStars(
        board, cells, row, col, markedCells, analysis,
      );
      if (forcedStars.length === 0) continue;

      // Expand with forced stars' neighbors
      const expanded = new Set(markedCells);
      const starKeys = new Set<string>();
      starKeys.add(`${row},${col}`);

      for (const [fr, fc] of forcedStars) {
        starKeys.add(`${fr},${fc}`);
        for (const key of buildMarkedCellSet(fr, fc, size)) {
          expanded.add(key);
        }
      }

      // Check for adjacent forced stars (immediate violation)
      let violation = false;
      const allStars: [number, number][] = [[row, col], ...forcedStars];
      for (let i = 0; i < allStars.length && !violation; i++) {
        for (let j = i + 1; j < allStars.length && !violation; j++) {
          if (
            Math.abs(allStars[i][0] - allStars[j][0]) <= 1 &&
            Math.abs(allStars[i][1] - allStars[j][1]) <= 1
          ) {
            violation = true;
          }
        }
      }

      // Check all rows
      if (!violation)
      for (let r = 0; r < size && !violation; r++) {
        let stars = 0;
        let remaining = 0;

        for (let c = 0; c < size; c++) {
          const key = `${r},${c}`;
          if (cells[r][c] === "star" || starKeys.has(key)) {
            stars++;
          } else if (cells[r][c] === "unknown" && !expanded.has(key)) {
            remaining++;
          }
        }

        const needed = board.stars - stars;
        if (needed < 0) violation = true;
        else if (needed > 0 && remaining < needed) violation = true;
      }

      // Check all columns
      if (!violation)
      for (let c = 0; c < size && !violation; c++) {
        let stars = 0;
        let remaining = 0;

        for (let r = 0; r < size; r++) {
          const key = `${r},${c}`;
          if (cells[r][c] === "star" || starKeys.has(key)) {
            stars++;
          } else if (cells[r][c] === "unknown" && !expanded.has(key)) {
            remaining++;
          }
        }

        const needed = board.stars - stars;
        if (needed < 0) violation = true;
        else if (needed > 0 && remaining < needed) violation = true;
      }

      // Check all regions
      if (!violation)
      for (const [, region] of analysis.regions) {
        if (violation) break;

        let extraStars = 0;
        let remaining = 0;

        for (const [r, c] of region.unknownCoords) {
          if (cells[r][c] !== "unknown") continue;
          const key = `${r},${c}`;
          if (starKeys.has(key)) {
            extraStars++;
          } else if (!expanded.has(key)) {
            remaining++;
          }
        }

        const needed = region.starsNeeded - extraStars;
        if (needed < 0) violation = true;
        else if (needed > 0 && remaining < needed) violation = true;
      }

      if (violation) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
