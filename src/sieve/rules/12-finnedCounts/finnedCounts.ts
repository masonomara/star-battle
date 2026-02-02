/**
 * Rule 12: Finned Counts
 *
 * Marks cells where placing a hypothetical star would create an unsolvable
 * counting constraint. This happens when:
 * - N regions would need more stars than their shared rows can provide
 * - N rows would need more stars than their shared regions can provide
 *
 * More conservative than original - only flags definite violations.
 */

import buildRegions from "../../helpers/regions";
import { Board, CellState } from "../../helpers/types";

/**
 * Check if placing stars creates an unsolvable undercounting situation.
 * Violation: N regions share M rows, but need more stars than M rows can give.
 */
function detectUndercountingViolation(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;

  // Build region info: which rows/cols have unknowns, how many stars placed
  const regionUnknownRows = new Map<number, Set<number>>();
  const regionUnknownCols = new Map<number, Set<number>>();
  const regionStars = new Map<number, number>();
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = board.grid[row][col];
      if (!regionUnknownRows.has(id)) {
        regionUnknownRows.set(id, new Set());
        regionUnknownCols.set(id, new Set());
        regionStars.set(id, 0);
      }
      if (cells[row][col] === "unknown") {
        regionUnknownRows.get(id)!.add(row);
        regionUnknownCols.get(id)!.add(col);
      } else if (cells[row][col] === "star") {
        regionStars.set(id, regionStars.get(id)! + 1);
        rowStars[row]++;
        colStars[col]++;
      }
    }
  }

  // Quick check: any region needs stars but has no unknowns? Immediate violation.
  for (const [id, stars] of regionStars) {
    if (stars < board.stars && regionUnknownRows.get(id)!.size === 0) {
      return true;
    }
  }

  // Active regions: still need stars AND have unknowns
  const active = [...regionUnknownRows.keys()].filter((id) => {
    const needed = board.stars - regionStars.get(id)!;
    const hasUnknowns = regionUnknownRows.get(id)!.size > 0;
    return needed > 0 && hasUnknowns;
  });

  // Check rows: for each subset of rows, do contained regions need too many stars?
  // Simplified: check each region's row span
  for (const id of active) {
    const rows = regionUnknownRows.get(id)!;
    if (rows.size === 0) continue;

    // Find all active regions fully contained in these rows
    const contained = active.filter((otherId) => {
      const otherRows = regionUnknownRows.get(otherId)!;
      if (otherRows.size === 0) return false;
      return [...otherRows].every((row) => rows.has(row));
    });

    // Calculate total stars needed by contained regions
    let starsNeeded = 0;
    for (const rid of contained) {
      starsNeeded += board.stars - regionStars.get(rid)!;
    }

    // Calculate stars available in these rows
    let starsAvailable = 0;
    for (const row of rows) {
      starsAvailable += board.stars - rowStars[row];
    }

    // Violation: need more stars than rows can provide
    if (starsNeeded > starsAvailable) {
      return true;
    }
  }

  // Check columns similarly
  for (const id of active) {
    const cols = regionUnknownCols.get(id)!;
    if (cols.size === 0) continue;

    const contained = active.filter((otherId) => {
      const otherCols = regionUnknownCols.get(otherId)!;
      if (otherCols.size === 0) return false;
      return [...otherCols].every((col) => cols.has(col));
    });

    let starsNeeded = 0;
    for (const rid of contained) {
      starsNeeded += board.stars - regionStars.get(rid)!;
    }

    let starsAvailable = 0;
    for (const col of cols) {
      starsAvailable += board.stars - colStars[col];
    }

    if (starsNeeded > starsAvailable) {
      return true;
    }
  }

  return false;
}

/**
 * Check if placing stars creates an unsolvable overcounting situation.
 * Violation: N rows share M regions, but need more stars than M regions can give.
 */
function detectOvercountingViolation(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  // Count stars per region
  const regionStars = new Map<number, number>();
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);

  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [row, col] of coords) {
      if (cells[row][col] === "star") stars++;
    }
    regionStars.set(id, stars);
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        rowStars[row]++;
        colStars[col]++;
      }
    }
  }

  // Active regions (still need stars)
  const activeRegions = new Set(
    [...regions.keys()].filter((id) => regionStars.get(id)! < board.stars),
  );

  // Build row -> active regions with unknowns in that row
  const rowToRegions = new Map<number, Set<number>>();
  const colToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    rowToRegions.set(i, new Set());
    colToRegions.set(i, new Set());
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = board.grid[row][col];
      if (activeRegions.has(id) && cells[row][col] === "unknown") {
        rowToRegions.get(row)!.add(id);
        colToRegions.get(col)!.add(id);
      }
    }
  }

  // Quick check: any row/col needs stars but has no unknowns? Immediate violation.
  for (let i = 0; i < size; i++) {
    if (rowStars[i] < board.stars && rowToRegions.get(i)!.size === 0) {
      // Row needs stars but has no active regions with unknowns
      // Check if there are ANY unknowns in this row
      let hasUnknown = false;
      for (let col = 0; col < size; col++) {
        if (cells[i][col] === "unknown") hasUnknown = true;
      }
      if (!hasUnknown) return true;
    }
    if (colStars[i] < board.stars && colToRegions.get(i)!.size === 0) {
      let hasUnknown = false;
      for (let row = 0; row < size; row++) {
        if (cells[row][i] === "unknown") hasUnknown = true;
      }
      if (!hasUnknown) return true;
    }
  }

  // Active rows: still need stars AND have unknowns
  const activeRows: number[] = [];
  const activeCols: number[] = [];
  for (let i = 0; i < size; i++) {
    if (rowStars[i] < board.stars && rowToRegions.get(i)!.size > 0) {
      activeRows.push(i);
    }
    if (colStars[i] < board.stars && colToRegions.get(i)!.size > 0) {
      activeCols.push(i);
    }
  }

  // Check if any set of rows is contained in too few regions
  for (const startRow of activeRows) {
    const rowSet = new Set<number>();
    const regSet = new Set<number>();

    for (const row of activeRows) {
      if (row < startRow) continue;

      rowSet.add(row);
      for (const id of rowToRegions.get(row)!) {
        regSet.add(id);
      }

      // Check if rows are fully contained in these regions
      let fullyContained = true;
      for (const row of rowSet) {
        for (let col = 0; col < size && fullyContained; col++) {
          if (cells[row][col] === "unknown" && !regSet.has(board.grid[row][col])) {
            fullyContained = false;
          }
        }
      }

      if (fullyContained) {
        // Calculate stars needed by rows vs available in regions
        let starsNeeded = 0;
        for (const row of rowSet) {
          starsNeeded += board.stars - rowStars[row];
        }

        let starsAvailable = 0;
        for (const rid of regSet) {
          starsAvailable += board.stars - regionStars.get(rid)!;
        }

        if (starsNeeded > starsAvailable) {
          return true;
        }
      }
    }
  }

  // Check columns similarly
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
      for (const col of colSet) {
        for (let row = 0; row < size && fullyContained; row++) {
          if (cells[row][col] === "unknown" && !regSet.has(board.grid[row][col])) {
            fullyContained = false;
          }
        }
      }

      if (fullyContained) {
        let starsNeeded = 0;
        for (const col of colSet) {
          starsNeeded += board.stars - colStars[col];
        }

        let starsAvailable = 0;
        for (const rid of regSet) {
          starsAvailable += board.stars - regionStars.get(rid)!;
        }

        if (starsNeeded > starsAvailable) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Apply hypothetical star at (row, col) and return modified cells copy.
 */
function applyHypotheticalStar(
  cells: CellState[][],
  row: number,
  col: number,
  size: number,
): CellState[][] {
  const copy: CellState[][] = cells.map((cellRow) => [...cellRow]);
  copy[row][col] = "star";

  // Mark all 8 neighbors
  for (let drow = -1; drow <= 1; drow++) {
    for (let dcol = -1; dcol <= 1; dcol++) {
      if (drow === 0 && dcol === 0) continue;
      const nrow = row + drow;
      const ncol = col + dcol;
      if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
        if (copy[nrow][ncol] === "unknown") {
          copy[nrow][ncol] = "marked";
        }
      }
    }
  }

  return copy;
}

export default function finnedCounts(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      const hypothetical = applyHypotheticalStar(cells, row, col, size);

      if (
        detectUndercountingViolation(board, hypothetical) ||
        detectOvercountingViolation(board, hypothetical)
      ) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
