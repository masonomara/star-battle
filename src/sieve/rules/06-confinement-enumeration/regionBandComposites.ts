/**
 * Rules: Region Band Composites (Level 6)
 *
 * Uses each region's unknown rows (or columns) as a band. When other
 * regions are also confined within those same lines, the remaining
 * cells form a complement composite with a derived star count.
 * Bands may be non-contiguous.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import {
  CompositeAnalyzer,
  findComplementInBand,
  analyzeCompositeTilingMarks,
  analyzeCompositeTilingPlacements,
} from "../../helpers/compositeAnalysis";

function forEachRegionBand(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
  returnOnFirst = true,
): boolean {
  const { regions } = analysis;
  let changed = false;

  const unknownLines = axis === "row" ? "unknownRows" : "unknownCols";
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0 || region[unknownLines].size < 2) continue;
    const bandLines = [...region[unknownLines]];
    if (findComplementInBand(bandLines, board, cells, analysis, axis, analyze)) {
      if (returnOnFirst) return true;
      changed = true;
    }
  }

  return changed;
}

// Tight tiling
export function regionBandTilingMarksRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachRegionBand(board, cells, analysis, "row", analyzeCompositeTilingMarks, false);
}
export function regionBandTilingMarksColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachRegionBand(board, cells, analysis, "col", analyzeCompositeTilingMarks, false);
}
export function regionBandTilingPlacementsRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachRegionBand(board, cells, analysis, "row", analyzeCompositeTilingPlacements);
}
export function regionBandTilingPlacementsColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachRegionBand(board, cells, analysis, "col", analyzeCompositeTilingPlacements);
}

