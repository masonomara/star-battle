/**
 * Rule: Hypothetical Overcounting Column (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if columns confined to the same regions need more stars than those regions
 * can provide. If so, mark the cell.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/oneByN";

function adjustedCols(
  unknownCoords: Coord[],
  cells: CellState[][],
  markedCells: Set<string>,
): Set<number> {
  const cols = new Set<number>();
  for (const [r, c] of unknownCoords) {
    if (cells[r][c] !== "unknown") continue;
    if (markedCells.has(`${r},${c}`)) continue;
    cols.add(c);
  }
  return cols;
}

function checkViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  markedCells: Set<string>,
): boolean {
  const { size, regions, colStars } = analysis;
  const starRegionId = board.grid[starRow][starCol];

  // Build colToRegions under hypothesis
  const colToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    colToRegions.set(i, new Set());
  }
  for (const [id, meta] of regions) {
    const needed = meta.starsNeeded - (id === starRegionId ? 1 : 0);
    if (needed <= 0) continue;
    const cols = adjustedCols(meta.unknownCoords, cells, markedCells);
    for (const col of cols) {
      colToRegions.get(col)!.add(id);
    }
  }

  for (let startCol = 0; startCol < size; startCol++) {
    const delta = startCol === starCol ? 1 : 0;
    const lineNeeded = board.stars - colStars[startCol] - delta;
    if (lineNeeded <= 0) continue;

    const touchedRegions = colToRegions.get(startCol);
    if (!touchedRegions || touchedRegions.size === 0) continue;

    const confinedCols = new Set<number>();
    for (let col = 0; col < size; col++) {
      const colRegs = colToRegions.get(col);
      if (!colRegs || colRegs.size === 0) continue;
      if ([...colRegs].every((rid) => touchedRegions.has(rid))) {
        confinedCols.add(col);
      }
    }

    let demand = 0;
    for (const col of confinedCols) {
      const d = col === starCol ? 1 : 0;
      demand += board.stars - colStars[col] - d;
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

export default function hypotheticalOvercountingColumn(
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

      if (checkViolation(row, col, board, cells, analysis, markedCells)) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }

  return false;
}
