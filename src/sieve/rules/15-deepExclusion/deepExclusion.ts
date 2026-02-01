/**
 * Rule 15: Deep Exclusion (Bounded Bifurcation)
 *
 * Like exclusion, but propagates forced placements before checking constraints.
 *
 * Algorithm:
 * 1. For each unknown cell X:
 *    a. Hypothetically place star at X, mark neighbors
 *    b. Propagate: find forced placements (row/col/region with unknowns = needed)
 *    c. Apply forced stars, mark their neighbors
 *    d. Repeat propagation up to maxDepth
 *    e. If any constraint breaks or adjacent stars occur → mark X
 *
 * This catches cases where a star placement doesn't immediately break anything,
 * but the cascade of forced placements leads to a contradiction.
 */

import { cellKey } from "../../helpers/cellKey";
import { canTileWithMinCount } from "../../helpers/tiling";
import { Board, CellState, Coord } from "../../helpers/types";

/**
 * Deep copy a 2D cell state array.
 */
function copyCells(cells: CellState[][]): CellState[][] {
  return cells.map((row) => [...row]);
}

/**
 * Mark the 8 neighbors of a cell (and the cell itself if not already a star).
 */
function markNeighbors(
  row: number,
  col: number,
  cells: CellState[][],
  size: number,
): void {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (cells[nr][nc] === "unknown") {
          cells[nr][nc] = "marked";
        }
      }
    }
  }
}

/**
 * Check if placing a star at (row, col) would be adjacent to an existing star.
 */
function wouldBeAdjacentToStar(
  row: number,
  col: number,
  cells: CellState[][],
  size: number,
): boolean {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (cells[nr][nc] === "star") {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Find all forced placements: rows/cols/regions where unknowns === starsNeeded.
 * Returns cells that MUST be stars.
 */
function findForcedPlacements(board: Board, cells: CellState[][]): Coord[] {
  const size = board.grid.length;
  const forced: Coord[] = [];
  const seen = new Set<string>();

  // Check rows
  for (let row = 0; row < size; row++) {
    const unknowns: Coord[] = [];
    let stars = 0;
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }
    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      for (const coord of unknowns) {
        const key = cellKey(coord[0], coord[1]);
        if (!seen.has(key)) {
          seen.add(key);
          forced.push(coord);
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    const unknowns: Coord[] = [];
    let stars = 0;
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }
    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      for (const coord of unknowns) {
        const key = cellKey(coord[0], coord[1]);
        if (!seen.has(key)) {
          seen.add(key);
          forced.push(coord);
        }
      }
    }
  }

  // Check regions
  const regionUnknowns = new Map<number, Coord[]>();
  const regionStars = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (cells[row][col] === "star") {
        regionStars.set(regionId, (regionStars.get(regionId) ?? 0) + 1);
      } else if (cells[row][col] === "unknown") {
        if (!regionUnknowns.has(regionId)) regionUnknowns.set(regionId, []);
        regionUnknowns.get(regionId)!.push([row, col]);
      }
    }
  }

  for (const [regionId, unknowns] of regionUnknowns) {
    const stars = regionStars.get(regionId) ?? 0;
    const needed = board.stars - stars;
    if (needed > 0 && unknowns.length === needed) {
      for (const coord of unknowns) {
        const key = cellKey(coord[0], coord[1]);
        if (!seen.has(key)) {
          seen.add(key);
          forced.push(coord);
        }
      }
    }
  }

  return forced;
}

/**
 * Check if any row, column, or region is broken (can't fit required stars).
 */
function isAnyConstraintBroken(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  // Check rows
  for (let row = 0; row < size; row++) {
    const unknowns: Coord[] = [];
    let stars = 0;
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }
    const needed = board.stars - stars;
    if (needed > 0) {
      if (unknowns.length < needed) return true;
      if (!canTileWithMinCount(unknowns, size, needed)) return true;
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    const unknowns: Coord[] = [];
    let stars = 0;
    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") stars++;
      else if (cells[row][col] === "unknown") unknowns.push([row, col]);
    }
    const needed = board.stars - stars;
    if (needed > 0) {
      if (unknowns.length < needed) return true;
      if (!canTileWithMinCount(unknowns, size, needed)) return true;
    }
  }

  // Check regions
  const regionUnknowns = new Map<number, Coord[]>();
  const regionStars = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const regionId = board.grid[row][col];
      if (cells[row][col] === "star") {
        regionStars.set(regionId, (regionStars.get(regionId) ?? 0) + 1);
      } else if (cells[row][col] === "unknown") {
        if (!regionUnknowns.has(regionId)) regionUnknowns.set(regionId, []);
        regionUnknowns.get(regionId)!.push([row, col]);
      }
    }
  }

  for (const [regionId, unknowns] of regionUnknowns) {
    const stars = regionStars.get(regionId) ?? 0;
    const needed = board.stars - stars;
    if (needed > 0) {
      if (unknowns.length < needed) return true;
      if (!canTileWithMinCount(unknowns, size, needed)) return true;
    }
  }

  return false;
}

export interface DeepExclusionOptions {
  maxDepth?: number;
}

/**
 * Deep Exclusion: Exclusion with forced placement propagation.
 *
 * For each unknown cell, hypothetically place a star there, then propagate
 * forced placements (cascading). If this leads to a contradiction (adjacent
 * stars or broken constraint), mark the original cell.
 *
 * @param maxDepth - Maximum propagation depth (default: 2)
 */
export default function deepExclusion(
  board: Board,
  cells: CellState[][],
  options: DeepExclusionOptions = {},
): boolean {
  const { maxDepth = 2 } = options;
  const size = board.grid.length;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      // Create hypothetical state
      const hypothetical = copyCells(cells);

      // Place star at (row, col)
      hypothetical[row][col] = "star";
      markNeighbors(row, col, hypothetical, size);

      // Propagate forced placements up to maxDepth
      let contradiction = false;

      for (let depth = 0; depth < maxDepth && !contradiction; depth++) {
        const forced = findForcedPlacements(board, hypothetical);
        if (forced.length === 0) break;

        for (const [fr, fc] of forced) {
          // Check if this forced placement would be adjacent to a star
          if (wouldBeAdjacentToStar(fr, fc, hypothetical, size)) {
            contradiction = true;
            break;
          }

          // Apply the forced star
          hypothetical[fr][fc] = "star";
          markNeighbors(fr, fc, hypothetical, size);
        }
      }

      // Check if any constraint is now broken
      if (!contradiction) {
        contradiction = isAnyConstraintBroken(board, hypothetical);
      }

      if (contradiction) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
