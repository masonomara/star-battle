/**
 * 1×N Confinement Detection
 *
 * One function. Detect which regions are confined to single rows/columns.
 * Returns everything. Caller takes what they need.
 */

import { Coord } from "./types";
import { BoardAnalysis } from "./boardAnalysis";

/** A region whose remaining cells all lie in a single row or column */
export type ConfinedRegion = {
  regionId: number;
  starsNeeded: number;
  cells: Coord[];
};

/** Confinement data indexed by axis and line index */
export type ConfinementResult = {
  row: Map<number, ConfinedRegion[]>; // row index → regions confined to that row
  col: Map<number, ConfinedRegion[]>; // col index → regions confined to that col
};

/**
 * Compute confinement for all regions.
 *
 * A region is "confined" to a row if ALL its unknown cells sit in that row.
 * Same for columns.
 */
export function computeConfinement(analysis: BoardAnalysis): ConfinementResult {
  const result: ConfinementResult = {
    row: new Map(),
    col: new Map(),
  };

  for (const [regionId, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const unknowns = meta.unknownCoords;
    const rows = new Set(unknowns.map(([r]) => r));
    if (rows.size === 1) {
      const rowIndex = rows.values().next().value as number;
      if (!result.row.has(rowIndex)) result.row.set(rowIndex, []);
      result.row
        .get(rowIndex)!
        .push({ regionId, starsNeeded: meta.starsNeeded, cells: unknowns });
    }

    const cols = new Set(unknowns.map(([, c]) => c));
    if (cols.size === 1) {
      const colIndex = cols.values().next().value as number;
      if (!result.col.has(colIndex)) result.col.set(colIndex, []);
      result.col
        .get(colIndex)!
        .push({ regionId, starsNeeded: meta.starsNeeded, cells: unknowns });
    }
  }

  return result;
}

