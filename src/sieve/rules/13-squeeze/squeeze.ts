/**
 * Rule 13: The Squeeze
 *
 * From Kris de Asis: "Minimally tile 2×2s across pairs of consecutive rows
 * (or columns) where every star can be accounted for."
 *
 * Two complementary approaches:
 *
 * 1. TILING APPROACH: If we can tile the pair with exactly N non-overlapping
 *    2×2s (where N = stars needed), each tile contains exactly one star.
 *    - Stars: Cells with single-coverage in ALL minimal tilings
 *    - Marks: Cells outside the pair covered by ALL tilings
 *
 * 2. CAPACITY APPROACH: When tiling isn't exact, analyze per-cross-line
 *    capacity. If total capacity = stars needed, each cross-line contributes
 *    exactly its max. Combined with region constraints, this marks cells
 *    that can't possibly contribute to the required count.
 */

import { coordKey, parseKey } from "../../helpers/cellKey";
import { findAllMinimalTilings, maxIndependentSetSize } from "../../helpers/tiling";
import buildRegions from "../../helpers/regions";
import { Board, CellState, Coord, Tile } from "../../helpers/types";

export default function squeeze(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  const starsPerPair = board.stars * 2;

  // Process row pairs
  for (let row = 0; row < size - 1; row++) {
    if (processRowPair(board, row, size, starsPerPair, cells)) {
      return true;
    }
  }

  // Process column pairs
  for (let col = 0; col < size - 1; col++) {
    if (processColPair(board, col, size, starsPerPair, cells)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate capacity: max non-adjacent stars that can fit.
 */
function capacity(cells: Coord[]): number {
  if (cells.length === 0) return 0;
  if (cells.length === 1) return 1;
  return maxIndependentSetSize(cells);
}

/**
 * Group cells by their cross-axis index.
 */
function groupByCrossAxis(
  cells: Coord[],
  axis: "row" | "col",
): Map<number, Coord[]> {
  const groups = new Map<number, Coord[]>();
  for (const [row, col] of cells) {
    const crossIdx = axis === "row" ? col : row;
    if (!groups.has(crossIdx)) {
      groups.set(crossIdx, []);
    }
    groups.get(crossIdx)!.push([row, col]);
  }
  return groups;
}

function processRowPair(
  board: Board,
  row: number,
  size: number,
  starsPerPair: number,
  cells: CellState[][],
): boolean {
  // Collect unknown cells in this row pair
  const pairCells: Coord[] = [];
  for (let col = 0; col < size; col++) {
    if (cells[row][col] === "unknown") pairCells.push([row, col]);
    if (cells[row + 1][col] === "unknown") pairCells.push([row + 1, col]);
  }

  if (pairCells.length === 0) return false;

  // Count existing stars in the pair
  let existingStars = 0;
  for (let col = 0; col < size; col++) {
    if (cells[row][col] === "star") existingStars++;
    if (cells[row + 1][col] === "star") existingStars++;
  }

  const neededStars = starsPerPair - existingStars;
  if (neededStars <= 0) return false;

  // Try tiling approach first
  const tiling = findAllMinimalTilings(pairCells, cells, size);

  if (tiling.minTileCount === neededStars) {
    // Tiling approach: exact match
    const result = applyTilingDeductions(tiling, pairCells, cells, size);
    if (result) return true;
  }

  // Try capacity approach (cross-line analysis)
  return applyCapacityDeductions(board, pairCells, row, row + 1, "row", cells, size, neededStars);
}

function processColPair(
  board: Board,
  col: number,
  size: number,
  starsPerPair: number,
  cells: CellState[][],
): boolean {
  // Collect unknown cells in this column pair
  const pairCells: Coord[] = [];
  for (let row = 0; row < size; row++) {
    if (cells[row][col] === "unknown") pairCells.push([row, col]);
    if (cells[row][col + 1] === "unknown") pairCells.push([row, col + 1]);
  }

  if (pairCells.length === 0) return false;

  // Count existing stars in the pair
  let existingStars = 0;
  for (let row = 0; row < size; row++) {
    if (cells[row][col] === "star") existingStars++;
    if (cells[row][col + 1] === "star") existingStars++;
  }

  const neededStars = starsPerPair - existingStars;
  if (neededStars <= 0) return false;

  // Try tiling approach first
  const tiling = findAllMinimalTilings(pairCells, cells, size);

  if (tiling.minTileCount === neededStars) {
    const result = applyTilingDeductions(tiling, pairCells, cells, size);
    if (result) return true;
  }

  // Try capacity approach
  return applyCapacityDeductions(board, pairCells, col, col + 1, "col", cells, size, neededStars);
}

/**
 * Apply deductions from tiling analysis.
 */
function applyTilingDeductions(
  tiling: { minTileCount: number; allMinimalTilings: Tile[][]; forcedCells: Coord[] },
  pairCells: Coord[],
  cells: CellState[][],
  size: number,
): boolean {
  let changed = false;

  // Place stars on forced cells (single-coverage in all tilings)
  for (const [frow, fcol] of tiling.forcedCells) {
    if (cells[frow][fcol] === "unknown") {
      cells[frow][fcol] = "star";
      changed = true;
    }
  }

  // Mark cells outside the pair that are covered by ALL tilings
  const forcedOutside = findForcedOutsideCells(tiling.allMinimalTilings);
  for (const [orow, ocol] of forcedOutside) {
    if (cells[orow][ocol] === "unknown") {
      cells[orow][ocol] = "marked";
      changed = true;
    }
  }

  // Mark cells that would block all star candidates via adjacency
  const pairCellSet = new Set(pairCells.map(coordKey));
  const adjacencyBlocked = findAdjacencyBlockedCells(
    tiling.allMinimalTilings,
    pairCellSet,
    cells,
    size,
  );
  for (const [brow, bcol] of adjacencyBlocked) {
    if (cells[brow][bcol] === "unknown") {
      cells[brow][bcol] = "marked";
      changed = true;
    }
  }

  return changed;
}

/**
 * Apply deductions from capacity-based cross-line analysis.
 *
 * When total capacity across cross-lines equals stars needed,
 * each cross-line must contribute exactly its max capacity.
 * Combined with region constraints, we can mark cells that
 * can't possibly be stars.
 */
function applyCapacityDeductions(
  board: Board,
  pairCells: Coord[],
  line1: number,
  line2: number,
  axis: "row" | "col",
  cells: CellState[][],
  size: number,
  neededStars: number,
): boolean {
  const regions = buildRegions(board.grid);

  // Group by cross-axis and calculate capacity per cross-line
  const byCrossLine = groupByCrossAxis(pairCells, axis);
  let totalCapacity = 0;
  const crossLineCapacities = new Map<number, number>();

  for (const [crossIdx, crossCells] of byCrossLine) {
    const cap = capacity(crossCells);
    crossLineCapacities.set(crossIdx, cap);
    totalCapacity += cap;
  }

  // Only proceed if tight: total capacity = stars needed
  if (totalCapacity !== neededStars) return false;

  let changed = false;

  // Each cross-line must contribute exactly its capacity
  // Now check if we can combine with region constraints to mark cells

  for (const [crossIdx, mustContribute] of crossLineCapacities) {
    // Find regions that have their ONLY unknowns in this cross-line (outside the pair)
    // These regions force stars in this cross-line
    let forcedByRegions = 0;

    for (const [, regionCoords] of regions) {
      let regionStars = 0;
      const regionUnknowns: Coord[] = [];

      for (const [r, c] of regionCoords) {
        if (cells[r][c] === "star") regionStars++;
        else if (cells[r][c] === "unknown") regionUnknowns.push([r, c]);
      }

      const regionNeeds = board.stars - regionStars;
      if (regionNeeds <= 0) continue;

      // Check if region's only unknowns are in this cross-line
      const inCrossLine = regionUnknowns.filter(([r, c]) =>
        axis === "row" ? c === crossIdx : r === crossIdx,
      );
      const outsideCrossLine = regionUnknowns.filter(([r, c]) =>
        axis === "row" ? c !== crossIdx : r !== crossIdx,
      );

      // If region is confined to this cross-line
      if (outsideCrossLine.length === 0 && inCrossLine.length > 0) {
        // Separate into "in pair" and "outside pair"
        const inPair = inCrossLine.filter(([r, c]) => {
          const lineIdx = axis === "row" ? r : c;
          return lineIdx === line1 || lineIdx === line2;
        });
        // How many must go outside the pair?
        const pairCap = capacity(inPair);
        const mustGoOutside = Math.max(0, regionNeeds - pairCap);

        if (mustGoOutside > 0) {
          forcedByRegions += mustGoOutside;
        }
      }
    }

    // Cross-line gets: mustContribute from pair + forcedByRegions from outside
    // Count stars and unknowns in this cross-line
    let crossLineStars = 0;
    const crossLineUnknowns: Coord[] = [];

    for (let i = 0; i < size; i++) {
      const [r, c] = axis === "row" ? [i, crossIdx] : [crossIdx, i];
      if (cells[r][c] === "star") crossLineStars++;
      else if (cells[r][c] === "unknown") crossLineUnknowns.push([r, c]);
    }

    const crossLineNeeds = board.stars - crossLineStars;
    if (crossLineNeeds <= 0) continue;

    const accountedFor = mustContribute + forcedByRegions;

    // If accounted for >= cross-line needs, mark unaccounted cells
    if (accountedFor >= crossLineNeeds) {
      const accountedCells = new Set<string>();

      // Cells in pair
      for (const [r, c] of pairCells) {
        const idx = axis === "row" ? c : r;
        if (idx === crossIdx) accountedCells.add(`${r},${c}`);
      }

      // Cells forced by regions (confined to this cross-line)
      for (const [, regionCoords] of regions) {
        let regionStars = 0;
        const regionUnknowns: Coord[] = [];

        for (const [r, c] of regionCoords) {
          if (cells[r][c] === "star") regionStars++;
          else if (cells[r][c] === "unknown") regionUnknowns.push([r, c]);
        }

        const regionNeeds = board.stars - regionStars;
        if (regionNeeds <= 0) continue;

        const outsideCrossLine = regionUnknowns.filter(([r, c]) =>
          axis === "row" ? c !== crossIdx : r !== crossIdx,
        );

        if (outsideCrossLine.length === 0) {
          // Region confined to this cross-line - all unknowns are accounted
          for (const [r, c] of regionUnknowns) {
            const idx = axis === "row" ? c : r;
            if (idx === crossIdx) accountedCells.add(`${r},${c}`);
          }
        }
      }

      // Mark unaccounted cells in this cross-line
      for (const [r, c] of crossLineUnknowns) {
        const key = `${r},${c}`;
        if (!accountedCells.has(key) && cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * Find cells outside the target area that are covered by ALL minimal tilings.
 */
function findForcedOutsideCells(allMinimalTilings: Tile[][]): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  const outsideSets: Set<string>[] = allMinimalTilings.map((tiling) => {
    const outside = new Set<string>();
    for (const tile of tiling) {
      const coveredKeys = new Set(tile.coveredCells.map(coordKey));
      for (const cell of tile.cells) {
        const key = coordKey(cell);
        if (!coveredKeys.has(key)) {
          outside.add(key);
        }
      }
    }
    return outside;
  });

  const intersection = [...outsideSets[0]].filter((key) =>
    outsideSets.every((set) => set.has(key)),
  );

  return intersection.map((key) => {
    const [row, col] = key.split(",").map(Number);
    return [row, col] as Coord;
  });
}

/**
 * Check if two cells are adjacent (including diagonals).
 */
function isAdjacent(cell1: Coord, cell2: Coord): boolean {
  const [row1, col1] = cell1;
  const [row2, col2] = cell2;
  const drow = Math.abs(row1 - row2);
  const dcol = Math.abs(col1 - col2);
  return drow <= 1 && dcol <= 1 && (drow > 0 || dcol > 0);
}

/**
 * Find cells that would block all star candidates for some tile via adjacency.
 */
function findAdjacencyBlockedCells(
  allMinimalTilings: Tile[][],
  pairCellSet: Set<string>,
  cells: CellState[][],
  size: number,
): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  const adjacentCells = new Set<string>();
  for (const key of pairCellSet) {
    const [row, col] = parseKey(key);
    for (let drow = -1; drow <= 1; drow++) {
      for (let dcol = -1; dcol <= 1; dcol++) {
        if (drow === 0 && dcol === 0) continue;
        const nrow = row + drow;
        const ncol = col + dcol;
        if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
          const nkey = coordKey([nrow, ncol]);
          if (!pairCellSet.has(nkey) && cells[nrow][ncol] === "unknown") {
            adjacentCells.add(nkey);
          }
        }
      }
    }
  }

  const blockedCells: Coord[] = [];

  for (const candidateKey of adjacentCells) {
    const candidate = parseKey(candidateKey);

    const blocksInAllTilings = allMinimalTilings.every((tiling) =>
      tiling.some((tile) =>
        tile.coveredCells.every((covered) => isAdjacent(candidate, covered)),
      ),
    );

    if (blocksInAllTilings) {
      blockedCells.push(candidate);
    }
  }

  return blockedCells;
}
