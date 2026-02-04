/**
 * Helper for detecting 1×n constraints.
 *
 * A 1×n constraint exists when a region's remaining unknown cells
 * are all confined to a single row (or column). This guarantees
 * that row/column will receive at least N stars from that region.
 */

import { Board, CellState, Coord } from "./types";
import { BoardAnalysis } from "./boardAnalysis";

export type OneByNConstraint = {
  regionId: number;
  axis: "row" | "col";
  index: number; // which row or column
  cells: Coord[]; // cells that must contain the star(s)
  starsNeeded: number; // how many stars this region still needs
};

/**
 * Find all 1×n constraints in the current board state.
 *
 * A constraint is found when ALL unknown cells of a region
 * that still needs stars are in a single row or column.
 * Optionally accepts BoardAnalysis to reuse pre-computed data.
 */
export function findOneByNConstraints(
  board: Board,
  cells: CellState[][],
  analysis?: BoardAnalysis,
): OneByNConstraint[] {
  const size = board.grid.length;
  const constraints: OneByNConstraint[] = [];

  // Use pre-computed data if analysis provided
  if (analysis) {
    for (const [regionId, meta] of analysis.regions) {
      const { unknownCoords, starsNeeded } = meta;

      if (starsNeeded <= 0 || unknownCoords.length === 0) continue;

      // Check if all unknowns are in a single row
      const rows = new Set(unknownCoords.map(([r]) => r));
      if (rows.size === 1) {
        const rowIndex = rows.values().next().value as number;
        constraints.push({
          regionId,
          axis: "row",
          index: rowIndex,
          cells: unknownCoords,
          starsNeeded,
        });
      }

      // Check if all unknowns are in a single column
      const cols = new Set(unknownCoords.map(([, c]) => c));
      if (cols.size === 1) {
        const colIndex = cols.values().next().value as number;
        constraints.push({
          regionId,
          axis: "col",
          index: colIndex,
          cells: unknownCoords,
          starsNeeded,
        });
      }
    }
    return constraints;
  }

  // Fallback: compute from scratch
  const regionUnknowns = new Map<number, Coord[]>();
  const regionStars = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];

      if (cells[row][col] === "star") {
        regionStars.set(regionId, (regionStars.get(regionId) ?? 0) + 1);
      } else if (cells[row][col] === "unknown") {
        if (!regionUnknowns.has(regionId)) {
          regionUnknowns.set(regionId, []);
        }
        regionUnknowns.get(regionId)!.push([row, col]);
      }
    }
  }

  // Check each region for 1×n constraints
  for (const [regionId, unknowns] of regionUnknowns) {
    const stars = regionStars.get(regionId) ?? 0;
    const starsNeeded = board.stars - stars;

    if (starsNeeded <= 0 || unknowns.length === 0) continue;

    // Check if all unknowns are in a single row
    const rows = new Set(unknowns.map(([r]) => r));
    if (rows.size === 1) {
      const rowIndex = rows.values().next().value as number;
      constraints.push({
        regionId,
        axis: "row",
        index: rowIndex,
        cells: unknowns,
        starsNeeded,
      });
    }

    // Check if all unknowns are in a single column
    const cols = new Set(unknowns.map(([, c]) => c));
    if (cols.size === 1) {
      const colIndex = cols.values().next().value as number;
      constraints.push({
        regionId,
        axis: "col",
        index: colIndex,
        cells: unknowns,
        starsNeeded,
      });
    }
  }

  return constraints;
}

/**
 * Build a set of cell keys that would be marked by placing a star at (row, col).
 */
export function buildMarkedCellSet(
  row: number,
  col: number,
  size: number,
): Set<string> {
  const marked = new Set<string>();
  marked.add(`${row},${col}`);

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        marked.add(`${nr},${nc}`);
      }
    }
  }

  return marked;
}
