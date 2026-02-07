/**
 * Rule: Hypothetical Undercounting Column (Level 9 — Confinement + Hypothetical)
 *
 * For each unknown cell, hypothesize placing a star there, then check
 * if regions confined to the same columns need more stars than those columns
 * can provide. If so, mark the cell.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/neighbors";

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
  const { regions, colStars } = analysis;
  const starRegionId = board.grid[starRow][starCol];

  for (const region of regions.values()) {
    const needed = region.starsNeeded - (region.id === starRegionId ? 1 : 0);
    if (needed <= 0) continue;

    const cols = adjustedCols(region.unknownCoords, cells, markedCells);
    if (cols.size === 0) return true;

    let demand = 0;
    for (const r of regions.values()) {
      const rNeeded = r.starsNeeded - (r.id === starRegionId ? 1 : 0);
      if (rNeeded <= 0) continue;
      const rCols = adjustedCols(r.unknownCoords, cells, markedCells);
      if (rCols.size === 0) continue;
      if ([...rCols].every((col) => cols.has(col))) {
        demand += rNeeded;
      }
    }

    let supply = 0;
    for (const col of cols) {
      const delta = col === starCol ? 1 : 0;
      supply += board.stars - colStars[col] - delta;
    }

    if (demand > supply) return true;
  }

  return false;
}

export default function hypotheticalUndercountingColumn(
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
