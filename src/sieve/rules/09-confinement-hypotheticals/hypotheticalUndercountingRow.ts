/**
 * Rule: Hypothetical Undercounting Row (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if regions confined to the same rows need more stars than those rows
 * can provide. If so, mark the cell.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/neighbors";

function adjustedRows(
  unknownCoords: Coord[],
  cells: CellState[][],
  markedCells: Set<string>,
): Set<number> {
  const rows = new Set<number>();
  for (const [r, c] of unknownCoords) {
    if (cells[r][c] !== "unknown") continue;
    if (markedCells.has(`${r},${c}`)) continue;
    rows.add(r);
  }
  return rows;
}

function checkViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  markedCells: Set<string>,
): boolean {
  const { regions, rowStars } = analysis;
  const starRegionId = board.grid[starRow][starCol];

  for (const region of regions.values()) {
    const needed = region.starsNeeded - (region.id === starRegionId ? 1 : 0);
    if (needed <= 0) continue;

    const rows = adjustedRows(region.unknownCoords, cells, markedCells);
    if (rows.size === 0) return true;

    let demand = 0;
    for (const r of regions.values()) {
      const rNeeded = r.starsNeeded - (r.id === starRegionId ? 1 : 0);
      if (rNeeded <= 0) continue;
      const rRows = adjustedRows(r.unknownCoords, cells, markedCells);
      if (rRows.size === 0) continue;
      if ([...rRows].every((row) => rows.has(row))) {
        demand += rNeeded;
      }
    }

    let supply = 0;
    for (const row of rows) {
      const delta = row === starRow ? 1 : 0;
      supply += board.stars - rowStars[row] - delta;
    }

    if (demand > supply) return true;
  }

  return false;
}

export default function hypotheticalUndercountingRow(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const markedCells = buildMarkedCellSet(row, col, size);

      if (checkViolation(row, col, board, cells, analysis, markedCells)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
