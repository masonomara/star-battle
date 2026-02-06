/**
 * Rules: Complement Composites (Level 6)
 *
 * When regions are confined to a band of rows (or columns), the complement
 * cells form a composite shape with a derived star count.
 * Four atomic rules per axis: tiling/enumeration × marks/placements.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import {
  Composite,
  analyzeCompositeTilingMarks,
  analyzeCompositeTilingPlacements,
  analyzeCompositeEnumerationMarks,
  analyzeCompositeEnumerationPlacements,
} from "../../helpers/compositeAnalysis";

type CompositeAnalyzer = (
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
) => boolean;

/**
 * Build the complement composite for a band, then analyze it.
 */
function findComplementInBand(
  bandLines: number[],
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
): boolean {
  const { size, regions, rowStars, colStars } = analysis;
  const bandSet = new Set(bandLines);

  const confined = [...regions.values()].filter((r) => {
    if (r.starsNeeded <= 0) return false;
    const lines = axis === "row" ? r.unknownRows : r.unknownCols;
    if (lines.size === 0) return false;
    return [...lines].every((l) => bandSet.has(l));
  });

  if (confined.length === 0) return false;

  const lineStars = axis === "row" ? rowStars : colStars;
  let bandStarsTotal = 0;
  for (const line of bandLines) {
    bandStarsTotal += board.stars - lineStars[line];
  }

  let confinedStarsTotal = 0;
  for (const r of confined) {
    confinedStarsTotal += r.starsNeeded;
  }

  const complementStars = bandStarsTotal - confinedStarsTotal;
  if (complementStars <= 0) return false;

  const confinedIds = new Set(confined.map((r) => r.id));
  const complementCells: Coord[] = [];

  if (axis === "row") {
    for (const row of bandLines) {
      for (let col = 0; col < size; col++) {
        if (
          cells[row][col] === "unknown" &&
          !confinedIds.has(board.grid[row][col])
        ) {
          complementCells.push([row, col]);
        }
      }
    }
  } else {
    for (const col of bandLines) {
      for (let row = 0; row < size; row++) {
        if (
          cells[row][col] === "unknown" &&
          !confinedIds.has(board.grid[row][col])
        ) {
          complementCells.push([row, col]);
        }
      }
    }
  }

  if (complementCells.length === 0) return false;

  const regionIds = new Set(
    complementCells.map(([r, c]) => board.grid[r][c]),
  );

  const composite: Composite = {
    id: `complement-${axis}-${bandLines.join(",")}`,
    source: "complement",
    cells: complementCells,
    unknownCells: complementCells,
    starsNeeded: complementStars,
    regionIds,
  };

  return analyze(composite, board, cells, analysis);
}

function forEachComplementBand(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  analyze: CompositeAnalyzer,
): boolean {
  const { size, regions } = analysis;

  for (let start = 0; start < size; start++) {
    for (let width = 2; width < size; width++) {
      const end = start + width;
      if (end > size) break;
      const bandLines = Array.from({ length: width }, (_, i) => start + i);
      if (findComplementInBand(bandLines, board, cells, analysis, axis, analyze)) {
        return true;
      }
    }
  }

  const unknownLines = axis === "row" ? "unknownRows" : "unknownCols";
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0 || region[unknownLines].size < 2) continue;
    const bandLines = [...region[unknownLines]];
    if (findComplementInBand(bandLines, board, cells, analysis, axis, analyze)) {
      return true;
    }
  }

  return false;
}

// Confinement + Inference → Marks
export function complementCompositeTilingMarksRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "row", analyzeCompositeTilingMarks);
}

export function complementCompositeTilingMarksColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "col", analyzeCompositeTilingMarks);
}

// Confinement + Inference → Placements
export function complementCompositeTilingPlacementsRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "row", analyzeCompositeTilingPlacements);
}

export function complementCompositeTilingPlacementsColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "col", analyzeCompositeTilingPlacements);
}

// Confinement + Enumeration → Marks
export function complementCompositeEnumerationMarksRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "row", analyzeCompositeEnumerationMarks);
}

export function complementCompositeEnumerationMarksColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "col", analyzeCompositeEnumerationMarks);
}

// Confinement + Enumeration → Placements
export function complementCompositeEnumerationPlacementsRow(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "row", analyzeCompositeEnumerationPlacements);
}

export function complementCompositeEnumerationPlacementsColumn(
  board: Board, cells: CellState[][], analysis: BoardAnalysis,
): boolean {
  return forEachComplementBand(board, cells, analysis, "col", analyzeCompositeEnumerationPlacements);
}
