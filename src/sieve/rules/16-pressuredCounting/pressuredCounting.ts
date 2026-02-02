/**
 * Rule 16: Pressured Counting
 *
 * Key insight (from Kris de Asis): When analyzing a row/column pair,
 * each region's contribution is bounded by its capacity outside that pair.
 *
 * If a region needs N stars but can only fit M outside the pair (M < N),
 * it MUST contribute at least (N - M) stars to the pair.
 *
 * When sum of minimum contributions equals required stars, we know
 * exactly how many stars each region contributes, enabling deductions.
 */

import buildRegions from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";
import { maxIndependentSetSize } from "../../helpers/tiling";

/**
 * Calculate exact capacity: maximum non-adjacent stars that can fit.
 * Uses maxIndependentSetSize for accurate 2D capacity calculation.
 */
function calculateCapacity(cells: Coord[]): number {
  if (cells.length === 0) return 0;
  if (cells.length === 1) return 1;
  return maxIndependentSetSize(cells);
}

type RegionData = {
  id: number;
  starsNeeded: number;
  unknownInside: Coord[];
  unknownOutside: Coord[];
  capacityOutside: number;
  mustContribute: number; // min stars that MUST go inside
  starsOutside: number; // stars that MUST go outside (starsNeeded - mustContribute)
};

/**
 * Analyze a range of consecutive rows or columns.
 */
function analyzeLineRange(
  board: Board,
  cells: CellState[][],
  axis: "row" | "col",
  startLine: number,
  endLine: number,
): boolean {
  const size = board.grid.length;
  const lineCount = endLine - startLine + 1;
  const regions = buildRegions(board.grid);

  // Count stars already in the range
  let starsInRange = 0;
  for (let line = startLine; line <= endLine; line++) {
    for (let i = 0; i < size; i++) {
      const [row, col] = axis === "row" ? [line, i] : [i, line];
      if (cells[row][col] === "star") starsInRange++;
    }
  }

  const starsNeededInRange = board.stars * lineCount - starsInRange;
  if (starsNeededInRange <= 0) return false;

  // Build region data
  const regionDataMap = new Map<number, RegionData>();

  for (const [id, coords] of regions) {
    let starsPlaced = 0;
    for (const [row, col] of coords) {
      if (cells[row][col] === "star") starsPlaced++;
    }
    const starsNeeded = board.stars - starsPlaced;
    if (starsNeeded <= 0) continue;

    const unknownInside: Coord[] = [];
    const unknownOutside: Coord[] = [];

    for (const [row, col] of coords) {
      if (cells[row][col] !== "unknown") continue;
      const lineIdx = axis === "row" ? row : col;
      if (lineIdx >= startLine && lineIdx <= endLine) {
        unknownInside.push([row, col]);
      } else {
        unknownOutside.push([row, col]);
      }
    }

    if (unknownInside.length === 0) continue;

    const capacityOutside = calculateCapacity(unknownOutside);
    const mustContribute = Math.max(0, starsNeeded - capacityOutside);
    const starsOutside = starsNeeded - mustContribute;

    regionDataMap.set(id, {
      id,
      starsNeeded,
      unknownInside,
      unknownOutside,
      capacityOutside,
      mustContribute,
      starsOutside,
    });
  }

  if (regionDataMap.size === 0) return false;

  let totalMustContribute = 0;
  for (const data of regionDataMap.values()) {
    totalMustContribute += data.mustContribute;
  }

  if (totalMustContribute !== starsNeededInRange) return false;

  let changed = false;

  for (const data of regionDataMap.values()) {
    const {
      starsNeeded,
      unknownInside,
      unknownOutside,
      capacityOutside,
      mustContribute,
      starsOutside,
    } = data;

    // All stars inside - mark outside
    if (mustContribute === starsNeeded) {
      for (const [row, col] of unknownOutside) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }

    // No stars inside - mark inside
    if (mustContribute === 0) {
      for (const [row, col] of unknownInside) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }

    // Forced star outside: exactly 1 cell with capacity 1 needed
    if (
      starsOutside === 1 &&
      capacityOutside === 1 &&
      unknownOutside.length === 1
    ) {
      const [row, col] = unknownOutside[0];
      if (cells[row][col] === "unknown") {
        cells[row][col] = "star";
        changed = true;
      }
    }
  }

  return changed;
}

export default function pressuredCounting(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;

  // Try different span sizes (1, 2, 3)
  for (let span = 1; span <= 3; span++) {
    // Analyze row ranges
    for (let start = 0; start <= size - span; start++) {
      if (analyzeLineRange(board, cells, "row", start, start + span - 1)) {
        return true;
      }
    }

    // Analyze column ranges
    for (let start = 0; start <= size - span; start++) {
      if (analyzeLineRange(board, cells, "col", start, start + span - 1)) {
        return true;
      }
    }
  }

  return false;
}
