/**
 * Rule: Finned Overcounting (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if lines confined to the same regions need more stars than those regions
 * can provide. If so, mark the cell.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/oneByN";

type HypotheticalRegion = {
  id: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
};

function buildHypotheticalRegions(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  markedCells: Set<string>,
): Map<number, HypotheticalRegion> {
  const { regions } = analysis;
  const starRegionId = board.grid[starRow][starCol];
  const result = new Map<number, HypotheticalRegion>();

  for (const [id, meta] of regions) {
    const adjustedNeeded =
      id === starRegionId ? meta.starsNeeded - 1 : meta.starsNeeded;

    if (adjustedNeeded <= 0) {
      result.set(id, {
        id,
        starsNeeded: 0,
        unknownRows: new Set(),
        unknownCols: new Set(),
      });
      continue;
    }

    const unknownRows = new Set<number>();
    const unknownCols = new Set<number>();

    for (const [r, c] of meta.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (markedCells.has(key)) continue;

      unknownRows.add(r);
      unknownCols.add(c);
    }

    result.set(id, { id, starsNeeded: adjustedNeeded, unknownRows, unknownCols });
  }

  return result;
}

function checkOvercountingViolation(
  hypoRegions: Map<number, HypotheticalRegion>,
  starRow: number,
  starCol: number,
  board: Board,
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  const { size, rowStars, colStars } = analysis;

  const lineToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    lineToRegions.set(i, new Set());
  }
  for (const [id, region] of hypoRegions) {
    if (region.starsNeeded <= 0) continue;
    const lines = axis === "row" ? region.unknownRows : region.unknownCols;
    for (const line of lines) {
      lineToRegions.get(line)!.add(id);
    }
  }

  for (let startLine = 0; startLine < size; startLine++) {
    const basePlaced =
      axis === "row" ? rowStars[startLine] : colStars[startLine];
    const delta =
      startLine === (axis === "row" ? starRow : starCol) ? 1 : 0;
    const lineNeeded = board.stars - basePlaced - delta;
    if (lineNeeded <= 0) continue;

    const touchedRegions = lineToRegions.get(startLine);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    const confinedLines = new Set<number>();
    for (let line = 0; line < size; line++) {
      const lineRegs = lineToRegions.get(line);
      if (!lineRegs || lineRegs.size === 0) continue;
      if ([...lineRegs].every((rid) => touchedRegions.has(rid))) {
        confinedLines.add(line);
      }
    }

    let starsNeeded = 0;
    for (const line of confinedLines) {
      const bp = axis === "row" ? rowStars[line] : colStars[line];
      const d = line === (axis === "row" ? starRow : starCol) ? 1 : 0;
      starsNeeded += board.stars - bp - d;
    }

    let starsAvailable = 0;
    for (const rid of touchedRegions) {
      const region = hypoRegions.get(rid);
      if (region) starsAvailable += region.starsNeeded;
    }

    if (starsNeeded > starsAvailable) return true;
  }

  return false;
}

export default function finnedOvercounting(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);
      const hypoRegions = buildHypotheticalRegions(
        row, col, board, cells, analysis, markedCells,
      );

      if (
        checkOvercountingViolation(hypoRegions, row, col, board, analysis, "row") ||
        checkOvercountingViolation(hypoRegions, row, col, board, analysis, "col")
      ) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}
