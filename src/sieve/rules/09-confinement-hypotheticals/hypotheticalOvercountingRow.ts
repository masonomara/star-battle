/**
 * Rule: Hypothetical Overcounting Row (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if rows confined to the same regions need more stars than those regions
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
  const { size, regions, rowStars } = analysis;
  const starRegionId = board.grid[starRow][starCol];

  // Build rowToRegions under hypothesis
  const rowToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    rowToRegions.set(i, new Set());
  }
  for (const [id, meta] of regions) {
    const needed = meta.starsNeeded - (id === starRegionId ? 1 : 0);
    if (needed <= 0) continue;
    const rows = adjustedRows(meta.unknownCoords, cells, markedCells);
    for (const row of rows) {
      rowToRegions.get(row)!.add(id);
    }
  }

  for (let startRow = 0; startRow < size; startRow++) {
    const delta = startRow === starRow ? 1 : 0;
    const lineNeeded = board.stars - rowStars[startRow] - delta;
    if (lineNeeded <= 0) continue;

    const touchedRegions = rowToRegions.get(startRow);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    const confinedRows = new Set<number>();
    for (let row = 0; row < size; row++) {
      const rowRegs = rowToRegions.get(row);
      if (!rowRegs || rowRegs.size === 0) continue;
      if ([...rowRegs].every((rid) => touchedRegions.has(rid))) {
        confinedRows.add(row);
      }
    }

    let demand = 0;
    for (const row of confinedRows) {
      const d = row === starRow ? 1 : 0;
      demand += board.stars - rowStars[row] - d;
    }

    let supply = 0;
    for (const rid of touchedRegions) {
      const meta = regions.get(rid);
      if (meta) {
        supply += meta.starsNeeded - (rid === starRegionId ? 1 : 0);
      }
    }

    if (demand > supply) return true;
  }

  return false;
}

export default function hypotheticalOvercountingRow(
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
