/**
 * After a hypothetical star is placed at (starRow, starCol) and its neighbors
 * are in markedCells, find cells that are now forced — cells in a row,
 * column, or region where unknowns == starsNeeded.
 */

import { Board, CellState, Coord } from "./types";
import { BoardAnalysis } from "./boardAnalysis";

export function findForcedStars(
  board: Board,
  cells: CellState[][],
  starRow: number,
  starCol: number,
  markedCells: Set<string>,
  analysis: BoardAnalysis,
): Coord[] {
  const size = board.grid.length;
  const starKey = `${starRow},${starCol}`;
  const forced: Coord[] = [];
  const seen = new Set<string>();
  seen.add(starKey);

  // Check rows
  for (let row = 0; row < size; row++) {
    let stars = 0;
    const unknowns: Coord[] = [];

    for (let col = 0; col < size; col++) {
      const key = `${row},${col}`;
      if (cells[row][col] === "star") {
        stars++;
      } else if (cells[row][col] === "unknown") {
        if (key === starKey) {
          stars++;
        } else if (!markedCells.has(key)) {
          unknowns.push([row, col]);
        }
      }
    }

    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      for (const coord of unknowns) {
        const key = `${coord[0]},${coord[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          forced.push(coord);
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    let stars = 0;
    const unknowns: Coord[] = [];

    for (let row = 0; row < size; row++) {
      const key = `${row},${col}`;
      if (cells[row][col] === "star") {
        stars++;
      } else if (cells[row][col] === "unknown") {
        if (key === starKey) {
          stars++;
        } else if (!markedCells.has(key)) {
          unknowns.push([row, col]);
        }
      }
    }

    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      for (const coord of unknowns) {
        const key = `${coord[0]},${coord[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          forced.push(coord);
        }
      }
    }
  }

  // Check regions
  for (const [, region] of analysis.regions) {
    let extraStars = 0;
    const unknowns: Coord[] = [];

    for (const [r, c] of region.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (key === starKey) {
        extraStars = 1;
      } else if (!markedCells.has(key)) {
        unknowns.push([r, c]);
      }
    }

    const needed = region.starsNeeded - extraStars;
    if (needed > 0 && unknowns.length === needed) {
      for (const coord of unknowns) {
        const key = `${coord[0]},${coord[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          forced.push(coord);
        }
      }
    }
  }

  return forced;
}
