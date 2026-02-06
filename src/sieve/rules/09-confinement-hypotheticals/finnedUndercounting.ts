/**
 * Rule: Finned Undercounting (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if regions confined to the same lines need more stars than those lines
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

function checkUndercountingViolation(
  hypoRegions: Map<number, HypotheticalRegion>,
  starRow: number,
  starCol: number,
  board: Board,
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  const { rowStars, colStars } = analysis;

  for (const region of hypoRegions.values()) {
    if (region.starsNeeded <= 0) continue;

    const lines = axis === "row" ? region.unknownRows : region.unknownCols;

    if (lines.size === 0) return true;

    const confined: HypotheticalRegion[] = [];
    for (const r of hypoRegions.values()) {
      if (r.starsNeeded <= 0) continue;
      const rLines = axis === "row" ? r.unknownRows : r.unknownCols;
      if (rLines.size === 0) continue;
      if ([...rLines].every((l) => lines.has(l))) {
        confined.push(r);
      }
    }

    let starsNeeded = 0;
    for (const r of confined) {
      starsNeeded += r.starsNeeded;
    }

    let starsAvailable = 0;
    for (const line of lines) {
      const basePlaced = axis === "row" ? rowStars[line] : colStars[line];
      const delta =
        line === (axis === "row" ? starRow : starCol) ? 1 : 0;
      starsAvailable += board.stars - basePlaced - delta;
    }

    if (starsNeeded > starsAvailable) return true;
  }

  return false;
}

export default function finnedUndercounting(
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
        checkUndercountingViolation(hypoRegions, row, col, board, analysis, "row") ||
        checkUndercountingViolation(hypoRegions, row, col, board, analysis, "col")
      ) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}
