/**
 * Propagate a hypothetical star placement to a stable state.
 *
 * Infrastructure helper (like getTiling or buildBoardAnalysis).
 * Places a hypothetical star, then deterministically cascades:
 *   forced placements (unknowns == needed) and trivial marks (quota met).
 * Repeats until stable or a basic violation is found.
 *
 * Returns the propagated state for rules to check against.
 */

import { Board, CellState } from "./types";
import { BoardAnalysis } from "./boardAnalysis";
import { buildMarkedCellSet } from "./neighbors";
import { findForcedStars } from "./findForcedStars";

export type ViolationType = null | "adjacency" | "row" | "col" | "region";

export type PropagatedState = {
  violation: ViolationType;
  starKeys: Set<string>;
  marked: Set<string>;
};

export function propagateHypothetical(
  board: Board,
  cells: CellState[][],
  row: number,
  col: number,
  analysis: BoardAnalysis,
): PropagatedState {
  const { size } = analysis;
  const starKeys = new Set([`${row},${col}`]);
  const marked = new Set(buildMarkedCellSet(row, col, size));
  const maxRounds = size * board.stars;

  for (let round = 0; round < maxRounds; round++) {
    applyTrivialMarks(board, cells, starKeys, marked, size, analysis);

    const violation = findViolation(board, cells, starKeys, marked, size, analysis);
    if (violation !== null) {
      return { violation, starKeys, marked };
    }

    const newForced = findForcedStars(board, cells, starKeys, marked, analysis);
    if (newForced.length === 0) break;

    for (const [fr, fc] of newForced) {
      starKeys.add(`${fr},${fc}`);
      for (const key of buildMarkedCellSet(fr, fc, size)) {
        marked.add(key);
      }
    }
  }

  return { violation: null, starKeys, marked };
}

/** Mark remaining unknowns in any row/col/region that has reached its star quota. */
function applyTrivialMarks(
  board: Board,
  cells: CellState[][],
  starKeys: Set<string>,
  marked: Set<string>,
  size: number,
  analysis: BoardAnalysis,
): void {
  for (let r = 0; r < size; r++) {
    let stars = 0;
    const unknowns: string[] = [];
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      if (cells[r][c] === "star" || starKeys.has(key)) stars++;
      else if (cells[r][c] === "unknown" && !marked.has(key))
        unknowns.push(key);
    }
    if (stars >= board.stars) {
      for (const key of unknowns) marked.add(key);
    }
  }

  for (let c = 0; c < size; c++) {
    let stars = 0;
    const unknowns: string[] = [];
    for (let r = 0; r < size; r++) {
      const key = `${r},${c}`;
      if (cells[r][c] === "star" || starKeys.has(key)) stars++;
      else if (cells[r][c] === "unknown" && !marked.has(key))
        unknowns.push(key);
    }
    if (stars >= board.stars) {
      for (const key of unknowns) marked.add(key);
    }
  }

  for (const [, region] of analysis.regions) {
    let extraStars = 0;
    const unknowns: string[] = [];
    for (const [r, c] of region.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (starKeys.has(key)) extraStars++;
      else if (!marked.has(key)) unknowns.push(key);
    }
    if (extraStars >= region.starsNeeded) {
      for (const key of unknowns) marked.add(key);
    }
  }
}

/** Find the first violated constraint, or null if none. */
function findViolation(
  board: Board,
  cells: CellState[][],
  starKeys: Set<string>,
  marked: Set<string>,
  size: number,
  analysis: BoardAnalysis,
): ViolationType {
  const stars: [number, number][] = [];
  for (const key of starKeys) {
    const [r, c] = key.split(",").map(Number);
    stars.push([r, c]);
  }
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      if (
        Math.abs(stars[i][0] - stars[j][0]) <= 1 &&
        Math.abs(stars[i][1] - stars[j][1]) <= 1
      ) {
        return "adjacency";
      }
    }
  }

  for (let r = 0; r < size; r++) {
    let starCount = 0;
    let remaining = 0;
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      if (cells[r][c] === "star" || starKeys.has(key)) starCount++;
      else if (cells[r][c] === "unknown" && !marked.has(key)) remaining++;
    }
    const needed = board.stars - starCount;
    if (needed < 0 || (needed > 0 && remaining < needed)) return "row";
  }

  for (let c = 0; c < size; c++) {
    let starCount = 0;
    let remaining = 0;
    for (let r = 0; r < size; r++) {
      const key = `${r},${c}`;
      if (cells[r][c] === "star" || starKeys.has(key)) starCount++;
      else if (cells[r][c] === "unknown" && !marked.has(key)) remaining++;
    }
    const needed = board.stars - starCount;
    if (needed < 0 || (needed > 0 && remaining < needed)) return "col";
  }

  for (const [, region] of analysis.regions) {
    let extraStars = 0;
    let remaining = 0;
    for (const [r, c] of region.unknownCoords) {
      if (cells[r][c] !== "unknown") continue;
      const key = `${r},${c}`;
      if (starKeys.has(key)) extraStars++;
      else if (!marked.has(key)) remaining++;
    }
    const needed = region.starsNeeded - extraStars;
    if (needed < 0 || (needed > 0 && remaining < needed)) return "region";
  }

  return null;
}
