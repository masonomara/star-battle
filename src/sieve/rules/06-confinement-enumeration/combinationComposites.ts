/**
 * Rule: Combination Composites (Level 6 — Confinement + Enumeration)
 *
 * Merges adjacent region pairs into composite shapes with summed star quotas,
 * then applies tiling analysis and placement enumeration to find deductions
 * that individual region analysis misses.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";
import {
  Composite,
  buildAdjacencyGraph,
  analyzeComposite,
} from "../../helpers/compositeAnalysis";

export default function combinationComposites(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions } = analysis;

  // Filter to active regions (still need stars and have unknowns)
  const activeRegions = new Map<number, RegionMeta>();
  for (const [id, meta] of regions) {
    if (meta.starsNeeded > 0 && meta.unknownCoords.length > 0) {
      activeRegions.set(id, meta);
    }
  }

  if (activeRegions.size < 2) return false;

  // Build adjacency graph between active regions
  const adjacency = buildAdjacencyGraph(board, activeRegions);

  // Test each adjacent region pair
  for (const [id1, neighborIds] of adjacency) {
    const r1 = activeRegions.get(id1);
    if (!r1) continue;

    for (const id2 of neighborIds) {
      if (id2 <= id1) continue; // Canonical ordering avoids duplicates

      const r2 = activeRegions.get(id2);
      if (!r2) continue;

      const starsNeeded = r1.starsNeeded + r2.starsNeeded;
      if (starsNeeded <= 0) continue;

      // Build composite from pair
      const allCoords = [...r1.unknownCoords, ...r2.unknownCoords];
      const unknownCells = allCoords.filter(
        ([r, c]) => cells[r][c] === "unknown",
      );

      if (unknownCells.length === 0) continue;

      const composite: Composite = {
        id: `${id1}-${id2}`,
        source: "combination",
        cells: allCoords,
        unknownCells,
        starsNeeded,
        regionIds: new Set([id1, id2]),
      };

      if (analyzeComposite(composite, board, cells, analysis)) {
        return true;
      }
    }
  }

  return false;
}
