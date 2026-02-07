/**
 * Rules: Contiguous Band Composites (Level 6)
 *
 * Slides a window of consecutive rows (or columns). When regions are
 * fully confined within the band, the remaining cells form a complement
 * composite with a derived star count.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import {
  CompositeAnalyzer,
  findComplementInBand,
  analyzeCompositeTilingMarks,
  analyzeCompositeTilingPlacements,
  analyzeCompositeEnumerationMarks,
  analyzeCompositeEnumerationPlacements,
} from "../../helpers/compositeAnalysis";

function forEachContiguousBand(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
  returnOnFirst = true,
): boolean {
  const { size } = analysis;
  let changed = false;

  for (let start = 0; start < size; start++) {
    for (let width = 2; width < size; width++) {
      const end = start + width;
      if (end > size) break;
      const bandLines = Array.from({ length: width }, (_, i) => start + i);
      if (findComplementInBand(bandLines, board, cells, analysis, axis, analyze)) {
        if (returnOnFirst) return true;
        changed = true;
      }
    }
  }

  return changed;
}

// Tight tiling
export function contiguousTilingMarksRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "row", analyzeCompositeTilingMarks, false);
}
export function contiguousTilingMarksColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "col", analyzeCompositeTilingMarks, false);
}
export function contiguousTilingPlacementsRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "row", analyzeCompositeTilingPlacements);
}
export function contiguousTilingPlacementsColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "col", analyzeCompositeTilingPlacements);
}

// Slack enumeration
export function contiguousEnumerationMarksRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "row", analyzeCompositeEnumerationMarks, false);
}
export function contiguousEnumerationMarksColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "col", analyzeCompositeEnumerationMarks, false);
}
export function contiguousEnumerationPlacementsRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "row", analyzeCompositeEnumerationPlacements);
}
export function contiguousEnumerationPlacementsColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachContiguousBand(board, cells, analysis, "col", analyzeCompositeEnumerationPlacements);
}
