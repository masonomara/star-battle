/**
 * Rules: Combination Composites (Level 6)
 *
 * Merges adjacent region pairs into composite shapes with summed star quotas.
 * Four atomic rules: tiling/enumeration × marks/placements.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";
import {
  CompositeAnalyzer,
  Composite,
  buildAdjacencyGraph,
  analyzeCompositeTilingMarks,
  analyzeCompositeTilingPlacements,
  analyzeCompositeEnumerationMarks,
  analyzeCompositeEnumerationPlacements,
} from "../../helpers/compositeAnalysis";

function forEachCombinationComposite(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  analyze: CompositeAnalyzer,
  returnOnFirst = true,
): boolean {
  const { regions } = analysis;

  const activeRegions = new Map<number, RegionMeta>();
  for (const [id, meta] of regions) {
    if (meta.starsNeeded > 0 && meta.unknownCoords.length > 0) {
      activeRegions.set(id, meta);
    }
  }

  if (activeRegions.size < 2) return false;

  const adjacency = buildAdjacencyGraph(board, activeRegions);
  let changed = false;

  for (const [id1, neighborIds] of adjacency) {
    const r1 = activeRegions.get(id1);
    if (!r1) continue;

    for (const id2 of neighborIds) {
      if (id2 <= id1) continue;

      const r2 = activeRegions.get(id2);
      if (!r2) continue;

      const starsNeeded = r1.starsNeeded + r2.starsNeeded;
      if (starsNeeded <= 0) continue;

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

      if (analyze(composite, board, cells, analysis)) {
        if (returnOnFirst) return true;
        changed = true;
      }
    }
  }

  return changed;
}

export function combinationCompositeTilingMarks(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachCombinationComposite(board, cells, analysis, analyzeCompositeTilingMarks, false);
}

export function combinationCompositeTilingPlacements(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachCombinationComposite(board, cells, analysis, analyzeCompositeTilingPlacements);
}

export function combinationCompositeEnumerationMarks(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachCombinationComposite(board, cells, analysis, analyzeCompositeEnumerationMarks, false);
}

export function combinationCompositeEnumerationPlacements(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachCombinationComposite(board, cells, analysis, analyzeCompositeEnumerationPlacements);
}
