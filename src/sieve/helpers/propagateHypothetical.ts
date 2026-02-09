/**
 * Propagate a hypothetical star placement to a stable state.
 *
 * Places a hypothetical star, then deterministically cascades:
 *   forced placements (unknowns == needed) and trivial marks (quota met).
 * Repeats until stable or a basic violation is found.
 */

import { Board, CellState, Coord } from "./types";
import { BoardAnalysis } from "./boardAnalysis";
import { buildMarkedCellSet, cellKey } from "./neighbors";

export type ViolationType = null | "adjacency" | "row" | "col" | "region";

export type PropagatedState = {
  violation: ViolationType;
  starKeys: Set<number>;
  marked: Set<number>;
};

export function propagateHypothetical(
  board: Board,
  cells: CellState[][],
  row: number,
  col: number,
  analysis: BoardAnalysis,
): PropagatedState {
  const { size } = analysis;
  const starKeys = new Set([cellKey(row, col, size)]);
  const marked = new Set(buildMarkedCellSet(row, col, size));
  const maxRounds = size * board.stars;

  for (let round = 0; round < maxRounds; round++) {
    const { violation, forced } = scanBoard(board, cells, starKeys, marked, size, analysis);
    if (violation !== null) return { violation, starKeys, marked };
    if (forced.length === 0) break;

    for (const [fr, fc] of forced) {
      starKeys.add(cellKey(fr, fc, size));
      for (const key of buildMarkedCellSet(fr, fc, size)) {
        marked.add(key);
      }
    }
  }

  return { violation: null, starKeys, marked };
}

/**
 * Single pass over rows, columns, and regions under hypothetical state.
 *
 * For each container, counts stars and remaining unknowns, then:
 *   needed <= 0        → mark remaining unknowns (trivial)
 *   remaining < needed → violation
 *   remaining == needed → forced placements
 */
function scanBoard(
  board: Board,
  cells: CellState[][],
  starKeys: Set<number>,
  marked: Set<number>,
  size: number,
  analysis: BoardAnalysis,
): { violation: ViolationType; forced: Coord[] } {
  // Adjacency check
  const starCoords: [number, number][] = [];
  for (const key of starKeys) {
    starCoords.push([Math.floor(key / size), key % size]);
  }
  for (let i = 0; i < starCoords.length; i++) {
    for (let j = i + 1; j < starCoords.length; j++) {
      if (
        Math.abs(starCoords[i][0] - starCoords[j][0]) <= 1 &&
        Math.abs(starCoords[i][1] - starCoords[j][1]) <= 1
      ) {
        return { violation: "adjacency", forced: [] };
      }
    }
  }

  const forced: Coord[] = [];
  const seen = new Set(starKeys);

  // Rows
  for (let r = 0; r < size; r++) {
    let stars = 0;
    const unknowns: number[] = [];
    for (let c = 0; c < size; c++) {
      const key = r * size + c;
      if (cells[r][c] === "star" || starKeys.has(key)) stars++;
      else if (cells[r][c] === "unknown" && !marked.has(key)) unknowns.push(key);
    }
    const needed = board.stars - stars;
    if (needed < 0) return { violation: "row", forced: [] };
    if (needed === 0) {
      for (const key of unknowns) marked.add(key);
    } else if (unknowns.length < needed) {
      return { violation: "row", forced: [] };
    } else if (unknowns.length === needed) {
      for (const key of unknowns) {
        if (!seen.has(key)) {
          seen.add(key);
          forced.push([Math.floor(key / size), key % size]);
        }
      }
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    let stars = 0;
    const unknowns: number[] = [];
    for (let r = 0; r < size; r++) {
      const key = r * size + c;
      if (cells[r][c] === "star" || starKeys.has(key)) stars++;
      else if (cells[r][c] === "unknown" && !marked.has(key)) unknowns.push(key);
    }
    const needed = board.stars - stars;
    if (needed < 0) return { violation: "col", forced: [] };
    if (needed === 0) {
      for (const key of unknowns) marked.add(key);
    } else if (unknowns.length < needed) {
      return { violation: "col", forced: [] };
    } else if (unknowns.length === needed) {
      for (const key of unknowns) {
        if (!seen.has(key)) {
          seen.add(key);
          forced.push([Math.floor(key / size), key % size]);
        }
      }
    }
  }

  // Regions
  for (const [, region] of analysis.regions) {
    let extraStars = 0;
    const unknowns: number[] = [];
    for (const [r, c] of region.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = r * size + c;
      if (starKeys.has(key)) extraStars++;
      else if (!marked.has(key)) unknowns.push(key);
    }
    const needed = region.starsNeeded - extraStars;
    if (needed < 0) return { violation: "region", forced: [] };
    if (needed === 0) {
      for (const key of unknowns) marked.add(key);
    } else if (unknowns.length < needed) {
      return { violation: "region", forced: [] };
    } else if (unknowns.length === needed) {
      for (const key of unknowns) {
        if (!seen.has(key)) {
          seen.add(key);
          forced.push([Math.floor(key / size), key % size]);
        }
      }
    }
  }

  return { violation: null, forced };
}
