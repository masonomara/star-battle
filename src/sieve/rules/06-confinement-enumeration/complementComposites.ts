/**
 * Rule: Complement Composites (Level 6 — Confinement + Enumeration)
 *
 * When regions are confined to a band of rows (or columns), the complement
 * cells in that band form a composite shape with a derived star count.
 * Tiling and enumeration on the complement can reveal deductions that
 * confinement alone (level 3) cannot.
 *
 * Extends the undercounting pattern: undercounting fires when the band is
 * saturated (complement stars = 0). This rule fires when the complement
 * has positive stars, then analyzes the complement as a composite.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Composite, analyzeComposite } from "../../helpers/compositeAnalysis";

/**
 * Shared logic: given a band of lines (rows or columns), find confined regions,
 * build the complement composite, and analyze it.
 */
function findComplementInBand(
  bandLines: number[],
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  const { size, regions, rowStars, colStars } = analysis;
  const bandSet = new Set(bandLines);

  // Find regions whose unknowns on this axis are all within the band
  const confined = [...regions.values()].filter((r) => {
    if (r.starsNeeded <= 0) return false;
    const lines = axis === "row" ? r.unknownRows : r.unknownCols;
    if (lines.size === 0) return false;
    return [...lines].every((l) => bandSet.has(l));
  });

  if (confined.length === 0) return false;

  // Band's total star capacity
  const lineStars = axis === "row" ? rowStars : colStars;
  let bandStarsTotal = 0;
  for (const line of bandLines) {
    bandStarsTotal += board.stars - lineStars[line];
  }

  // Confined regions' total star need
  let confinedStarsTotal = 0;
  for (const r of confined) {
    confinedStarsTotal += r.starsNeeded;
  }

  const complementStars = bandStarsTotal - confinedStarsTotal;

  // complementStars <= 0 means saturated — handled by level 3 undercounting
  if (complementStars <= 0) return false;

  // Build complement cells: unknowns in the band outside confined regions
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

  return analyzeComposite(composite, board, cells, analysis);
}

export function complementCompositesRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions } = analysis;

  // Mode A: Consecutive row bands (width 2 to size-1)
  for (let start = 0; start < size; start++) {
    for (let width = 2; width < size; width++) {
      const end = start + width;
      if (end > size) break;
      const bandLines = Array.from({ length: width }, (_, i) => start + i);
      if (findComplementInBand(bandLines, board, cells, analysis, "row")) {
        return true;
      }
    }
  }

  // Mode B: Region-based bands (each region's unknownRows as candidate)
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0 || region.unknownRows.size < 2) continue;
    const bandLines = [...region.unknownRows];
    if (findComplementInBand(bandLines, board, cells, analysis, "row")) {
      return true;
    }
  }

  return false;
}

export function complementCompositesColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions } = analysis;

  // Mode A: Consecutive column bands (width 2 to size-1)
  for (let start = 0; start < size; start++) {
    for (let width = 2; width < size; width++) {
      const end = start + width;
      if (end > size) break;
      const bandLines = Array.from({ length: width }, (_, i) => start + i);
      if (findComplementInBand(bandLines, board, cells, analysis, "col")) {
        return true;
      }
    }
  }

  // Mode B: Region-based bands (each region's unknownCols as candidate)
  for (const region of regions.values()) {
    if (region.starsNeeded <= 0 || region.unknownCols.size < 2) continue;
    const bandLines = [...region.unknownCols];
    if (findComplementInBand(bandLines, board, cells, analysis, "col")) {
      return true;
    }
  }

  return false;
}
