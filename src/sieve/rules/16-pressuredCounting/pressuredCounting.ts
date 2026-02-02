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
  capacityInside: number;
  capacityOutside: number;
  mustContribute: number; // min stars that MUST go inside
  starsOutside: number; // stars that MUST go outside (starsNeeded - mustContribute)
};

/**
 * Analyze a pair of consecutive rows or columns.
 */
function analyzeLinePair(
  board: Board,
  cells: CellState[][],
  axis: "row" | "col",
  line1: number,
  line2: number,
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  // Count stars already in the pair
  let starsInPair = 0;
  for (const line of [line1, line2]) {
    for (let i = 0; i < size; i++) {
      const [row, col] = axis === "row" ? [line, i] : [i, line];
      if (cells[row][col] === "star") starsInPair++;
    }
  }

  const starsNeededInPair = board.stars * 2 - starsInPair;
  if (starsNeededInPair <= 0) return false;

  // Build region data
  const regionDataMap = new Map<number, RegionData>();

  for (const [id, coords] of regions) {
    // Count stars already placed in this region
    let starsPlaced = 0;
    for (const [row, col] of coords) {
      if (cells[row][col] === "star") starsPlaced++;
    }
    const starsNeeded = board.stars - starsPlaced;
    if (starsNeeded <= 0) continue;

    // Partition unknown cells into inside/outside the pair
    const unknownInside: Coord[] = [];
    const unknownOutside: Coord[] = [];

    for (const [row, col] of coords) {
      if (cells[row][col] !== "unknown") continue;
      const lineIdx = axis === "row" ? row : col;
      if (lineIdx === line1 || lineIdx === line2) {
        unknownInside.push([row, col]);
      } else {
        unknownOutside.push([row, col]);
      }
    }

    // Skip regions with no unknowns inside the pair
    if (unknownInside.length === 0) continue;

    // Calculate capacities (using simple estimate)
    const capacityInside = calculateCapacity(unknownInside);
    const capacityOutside = calculateCapacity(unknownOutside);

    // Must contribute: stars that cannot fit outside
    const mustContribute = Math.max(0, starsNeeded - capacityOutside);

    // Stars that must go outside
    const starsOutside = starsNeeded - mustContribute;

    regionDataMap.set(id, {
      id,
      starsNeeded,
      unknownInside,
      unknownOutside,
      capacityInside,
      capacityOutside,
      mustContribute,
      starsOutside,
    });
  }

  if (regionDataMap.size === 0) return false;

  // Calculate totals
  let totalMustContribute = 0;
  for (const data of regionDataMap.values()) {
    totalMustContribute += data.mustContribute;
  }

  // Key condition: when minimum contributions exactly equal required stars
  if (totalMustContribute !== starsNeededInPair) return false;

  let changed = false;

  // Each region contributes exactly mustContribute inside, starsOutside outside
  for (const data of regionDataMap.values()) {
    const {
      starsNeeded,
      unknownInside,
      unknownOutside,
      capacityOutside,
      mustContribute,
      starsOutside,
    } = data;

    // Case 1: Region contributes ALL stars inside (none outside)
    // Mark all outside cells
    if (mustContribute === starsNeeded) {
      for (const [row, col] of unknownOutside) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }

    // Case 2: Region contributes NO stars inside (all outside)
    // Mark all inside cells
    if (mustContribute === 0) {
      for (const [row, col] of unknownInside) {
        if (cells[row][col] === "unknown") {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }

    // Case 3: Outside is tight - exactly starsOutside cells with capacity starsOutside
    // If there's exactly 1 cell and 1 star needed outside, it's forced
    if (starsOutside > 0 && starsOutside === capacityOutside) {
      if (unknownOutside.length === 1) {
        const [row, col] = unknownOutside[0];
        if (cells[row][col] === "unknown") {
          cells[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  return changed;
}

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

    const capacityInside = calculateCapacity(unknownInside);
    const capacityOutside = calculateCapacity(unknownOutside);
    const mustContribute = Math.max(0, starsNeeded - capacityOutside);
    const starsOutside = starsNeeded - mustContribute;

    regionDataMap.set(id, {
      id,
      starsNeeded,
      unknownInside,
      unknownOutside,
      capacityInside,
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
    const { starsNeeded, unknownInside, unknownOutside, capacityOutside, mustContribute, starsOutside } = data;

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
    if (starsOutside === 1 && capacityOutside === 1 && unknownOutside.length === 1) {
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
      if (span === 2) {
        // Use the pair-specific logic for span 2
        if (analyzeLinePair(board, cells, "row", start, start + 1)) {
          return true;
        }
      } else {
        if (analyzeLineRange(board, cells, "row", start, start + span - 1)) {
          return true;
        }
      }
    }

    // Analyze column ranges
    for (let start = 0; start <= size - span; start++) {
      if (span === 2) {
        if (analyzeLinePair(board, cells, "col", start, start + 1)) {
          return true;
        }
      } else {
        if (analyzeLineRange(board, cells, "col", start, start + span - 1)) {
          return true;
        }
      }
    }
  }

  return false;
}
