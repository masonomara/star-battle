/**
 * Rule 12: Finned Counts
 *
 * Marks cells where placing a hypothetical star would create an unsolvable
 * counting constraint. This happens when:
 * - N regions would need more stars than their shared rows can provide
 * - N rows would need more stars than their shared regions can provide
 *
 * Uses delta computation from BoardAnalysis instead of rebuilding metadata.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/cellKey";
import { maxIndependentSetSize } from "../../helpers/tiling";

type AdjustedRegion = {
  id: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
  unknownCoords: Coord[]; // Track actual coordinates for capacity calculation
};

/**
 * Check if placing a hypothetical star creates a counting violation.
 */
function checkViolation(
  board: Board,
  analysis: BoardAnalysis,
  starRow: number,
  starCol: number,
  cells: CellState[][],
): boolean {
  const { size, regions, rowStars, colStars } = analysis;
  const starRegion = board.grid[starRow][starCol];

  // Build set of cells that would be marked (star + 8 neighbors)
  const marked = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = starRow + dr;
      const nc = starCol + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        marked.add(cellKey(nr, nc));
      }
    }
  }

  // Adjusted star counts (base + 1 for the hypothetical star)
  const adjRowStars = [...rowStars];
  const adjColStars = [...colStars];
  adjRowStars[starRow]++;
  adjColStars[starCol]++;

  // Build adjusted region data
  const adjusted: AdjustedRegion[] = [];
  const adjRegionStars = new Map<number, number>();

  for (const [id, meta] of regions) {
    const starsPlaced = meta.starsPlaced + (id === starRegion ? 1 : 0);
    adjRegionStars.set(id, starsPlaced);
    const starsNeeded = board.stars - starsPlaced;

    if (starsNeeded <= 0) continue;

    // Filter unknowns, excluding marked cells
    const remainingUnknowns = meta.unknownCoords.filter(
      ([r, c]) => !marked.has(cellKey(r, c)),
    );

    // Region needs stars but has no unknowns - immediate violation
    if (remainingUnknowns.length === 0) {
      return true;
    }

    const unknownRows = new Set(remainingUnknowns.map(([r]) => r));
    const unknownCols = new Set(remainingUnknowns.map(([, c]) => c));

    adjusted.push({ id, starsNeeded, unknownRows, unknownCols, unknownCoords: remainingUnknowns });
  }

  // --- Undercounting check ---
  // N regions confined to M rows need more stars than M rows can give

  // Check rows
  for (const region of adjusted) {
    const rows = region.unknownRows;

    const contained = adjusted.filter((r) =>
      [...r.unknownRows].every((row) => rows.has(row)),
    );

    let starsNeeded = 0;
    for (const r of contained) {
      starsNeeded += r.starsNeeded;
    }

    let starsAvailable = 0;
    for (const row of rows) {
      starsAvailable += board.stars - adjRowStars[row];
    }

    if (starsNeeded > starsAvailable) {
      return true;
    }
  }

  // Check columns
  for (const region of adjusted) {
    const cols = region.unknownCols;

    const contained = adjusted.filter((r) =>
      [...r.unknownCols].every((col) => cols.has(col)),
    );

    let starsNeeded = 0;
    for (const r of contained) {
      starsNeeded += r.starsNeeded;
    }

    let starsAvailable = 0;
    for (const col of cols) {
      starsAvailable += board.stars - adjColStars[col];
    }

    if (starsNeeded > starsAvailable) {
      return true;
    }
  }

  // --- Overcounting check ---
  // M rows confined to N regions need more stars than N regions can give

  // Build row -> regions with unknowns in that row
  const rowToRegions = new Map<number, Set<number>>();
  const colToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    rowToRegions.set(i, new Set());
    colToRegions.set(i, new Set());
  }

  for (const region of adjusted) {
    for (const row of region.unknownRows) {
      rowToRegions.get(row)!.add(region.id);
    }
    for (const col of region.unknownCols) {
      colToRegions.get(col)!.add(region.id);
    }
  }

  // Active rows/cols that still need stars
  const activeRows = [...rowToRegions.keys()].filter(
    (row) => adjRowStars[row] < board.stars && rowToRegions.get(row)!.size > 0,
  );
  const activeCols = [...colToRegions.keys()].filter(
    (col) => adjColStars[col] < board.stars && colToRegions.get(col)!.size > 0,
  );

  // Check rows
  for (const startRow of activeRows) {
    const rowSet = new Set<number>();
    const regSet = new Set<number>();

    for (const row of activeRows) {
      if (row < startRow) continue;

      rowSet.add(row);
      for (const id of rowToRegions.get(row)!) {
        regSet.add(id);
      }

      // Check if all unknowns in these rows are in these regions
      let fullyContained = true;
      for (const r of rowSet) {
        for (let col = 0; col < size && fullyContained; col++) {
          if (cells[r][col] === "unknown" && !marked.has(cellKey(r, col))) {
            if (!regSet.has(board.grid[r][col])) {
              fullyContained = false;
            }
          }
        }
      }

      if (fullyContained) {
        let starsNeeded = 0;
        for (const row of rowSet) {
          starsNeeded += board.stars - adjRowStars[row];
        }

        // Compute actual max contribution per region, considering column constraints
        let starsAvailable = 0;
        for (const rid of regSet) {
          const region = adjusted.find((r) => r.id === rid);
          if (!region) {
            starsAvailable += board.stars - adjRegionStars.get(rid)!;
            continue;
          }

          // Find cells in the row range where the column isn't full
          const cellsInRange: Coord[] = region.unknownCoords.filter(
            ([r, c]) => rowSet.has(r) && adjColStars[c] < board.stars,
          );

          // Max contribution = min(region's remaining stars, capacity in range)
          const maxContribution = Math.min(
            region.starsNeeded,
            cellsInRange.length > 0 ? maxIndependentSetSize(cellsInRange) : 0,
          );
          starsAvailable += maxContribution;
        }

        if (starsNeeded > starsAvailable) {
          return true;
        }
      }
    }
  }

  // Check columns
  for (const startCol of activeCols) {
    const colSet = new Set<number>();
    const regSet = new Set<number>();

    for (const col of activeCols) {
      if (col < startCol) continue;

      colSet.add(col);
      for (const id of colToRegions.get(col)!) {
        regSet.add(id);
      }

      let fullyContained = true;
      for (const c of colSet) {
        for (let row = 0; row < size && fullyContained; row++) {
          if (cells[row][c] === "unknown" && !marked.has(cellKey(row, c))) {
            if (!regSet.has(board.grid[row][c])) {
              fullyContained = false;
            }
          }
        }
      }

      if (fullyContained) {
        let starsNeeded = 0;
        for (const col of colSet) {
          starsNeeded += board.stars - adjColStars[col];
        }

        // Compute actual max contribution per region, considering row constraints
        let starsAvailable = 0;
        for (const rid of regSet) {
          const region = adjusted.find((r) => r.id === rid);
          if (!region) {
            starsAvailable += board.stars - adjRegionStars.get(rid)!;
            continue;
          }

          // Find cells in the column range where the row isn't full
          const cellsInRange: Coord[] = region.unknownCoords.filter(
            ([r, c]) => colSet.has(c) && adjRowStars[r] < board.stars,
          );

          // Max contribution = min(region's remaining stars, capacity in range)
          const maxContribution = Math.min(
            region.starsNeeded,
            cellsInRange.length > 0 ? maxIndependentSetSize(cellsInRange) : 0,
          );
          starsAvailable += maxContribution;
        }

        if (starsNeeded > starsAvailable) {
          return true;
        }
      }
    }
  }

  return false;
}

export default function finnedCounts(
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

      if (checkViolation(board, analysis, row, col, cells)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
