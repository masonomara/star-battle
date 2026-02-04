/**
 * Rule 12: Finned Counts
 *
 * Marks cells where placing a hypothetical star would create an unsolvable
 * counting constraint. This happens when:
 * - N regions would need more stars than their shared rows can provide
 * - N rows would need more stars than their shared regions can provide
 *
 * Uses delta computation from BoardAnalysis instead of rebuilding metadata.
 * Capacity calculations use the shared tilingCache from BoardAnalysis.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, capacity } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/cellKey";
import { canTileWithMinCount } from "../../helpers/tiling";
import {
  findOneByNConstraints,
  buildMarkedCellSet,
  OneByNConstraint,
} from "../../helpers/oneByN";
import {
  findStarContaining2x2s,
  StarContaining2x2,
} from "../../helpers/starContaining2x2";

type AdjustedRegion = {
  id: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
  unknownCoords: Coord[]; // Track actual coordinates for capacity calculation
};

// Precomputed structures passed to checkViolation
type PrecomputedData = {
  baseAdjusted: AdjustedRegion[];
  baseAdjustedById: Map<number, AdjustedRegion>;
  baseRowToRegions: Map<number, Set<number>>;
  baseColToRegions: Map<number, Set<number>>;
};

/**
 * Check if placing a hypothetical star creates a counting violation.
 * Uses precomputed data structures for efficiency.
 */
function checkViolation(
  board: Board,
  analysis: BoardAnalysis,
  starRow: number,
  starCol: number,
  cells: CellState[][],
  precomputed: PrecomputedData,
): boolean {
  const { size, regions, rowStars, colStars } = analysis;
  const { baseAdjusted, baseAdjustedById } = precomputed;
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

  // Build adjusted region data using precomputed base as starting point
  const adjusted: AdjustedRegion[] = [];
  const adjustedById = new Map<number, AdjustedRegion>();
  const adjRegionStars = new Map<number, number>();

  // Track which regions are affected by the marked cells
  const affectedRegions = new Set<number>();
  affectedRegions.add(starRegion); // Star region always affected
  for (const key of marked) {
    const [rStr, cStr] = key.split(",");
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    affectedRegions.add(board.grid[r][c]);
  }

  for (const [id, meta] of regions) {
    const starsPlaced = meta.starsPlaced + (id === starRegion ? 1 : 0);
    adjRegionStars.set(id, starsPlaced);
    const starsNeeded = board.stars - starsPlaced;

    if (starsNeeded <= 0) continue;

    // Check if we can reuse base data or need to recompute
    const baseRegion = baseAdjustedById.get(id);

    if (baseRegion && !affectedRegions.has(id)) {
      // Region not affected by marked cells - reuse base data with adjusted starsNeeded
      if (id === starRegion) {
        // Star region - starsNeeded changed
        const adjRegion: AdjustedRegion = {
          id,
          starsNeeded,
          unknownRows: baseRegion.unknownRows,
          unknownCols: baseRegion.unknownCols,
          unknownCoords: baseRegion.unknownCoords,
        };
        adjusted.push(adjRegion);
        adjustedById.set(id, adjRegion);
      } else {
        adjusted.push(baseRegion);
        adjustedById.set(id, baseRegion);
      }
    } else {
      // Region affected by marked cells - need to filter unknowns
      const remainingUnknowns = meta.unknownCoords.filter(
        ([r, c]) => !marked.has(cellKey(r, c)),
      );

      // Region needs stars but has no unknowns - immediate violation
      if (remainingUnknowns.length === 0) {
        return true;
      }

      const unknownRows = new Set(remainingUnknowns.map(([r]) => r));
      const unknownCols = new Set(remainingUnknowns.map(([, c]) => c));

      const adjRegion: AdjustedRegion = {
        id,
        starsNeeded,
        unknownRows,
        unknownCols,
        unknownCoords: remainingUnknowns,
      };
      adjusted.push(adjRegion);
      adjustedById.set(id, adjRegion);
    }
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
          const region = adjustedById.get(rid);
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
            capacity(cellsInRange, analysis),
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
          const region = adjustedById.get(rid);
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
            capacity(cellsInRange, analysis),
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

/**
 * Check if placing a star would break row/column quotas given constraints.
 *
 * For each affected row/column:
 * 1. Check if it can still fit its required stars
 * 2. Check if constraints (1×n, 2×2) within that row/col can still be satisfied
 * 3. Check if "free" stars (non-constraint) can fit in remaining non-constraint cells
 */
function checkRowOrColumnViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  markedCells: Set<string>,
  oneByNConstraints: OneByNConstraint[],
  twoByTwoConstraints: StarContaining2x2[],
): boolean {
  const size = board.grid.length;
  const starKey = cellKey(starRow, starCol);

  // Group 1×n constraints by row/column
  const oneByNByRow = new Map<number, OneByNConstraint[]>();
  const oneByNByCol = new Map<number, OneByNConstraint[]>();

  for (const c of oneByNConstraints) {
    if (c.axis === "row") {
      if (!oneByNByRow.has(c.index)) oneByNByRow.set(c.index, []);
      oneByNByRow.get(c.index)!.push(c);
    } else {
      if (!oneByNByCol.has(c.index)) oneByNByCol.set(c.index, []);
      oneByNByCol.get(c.index)!.push(c);
    }
  }

  // Group 2×2 constraints by the rows/cols they touch
  const twoByTwoByRow = new Map<number, StarContaining2x2[]>();
  const twoByTwoByCol = new Map<number, StarContaining2x2[]>();

  for (const c of twoByTwoConstraints) {
    for (const [r, col] of c.cells) {
      if (!twoByTwoByRow.has(r)) twoByTwoByRow.set(r, []);
      if (!twoByTwoByRow.get(r)!.includes(c)) {
        twoByTwoByRow.get(r)!.push(c);
      }
      if (!twoByTwoByCol.has(col)) twoByTwoByCol.set(col, []);
      if (!twoByTwoByCol.get(col)!.includes(c)) {
        twoByTwoByCol.get(col)!.push(c);
      }
    }
  }

  // Check rows affected by this star
  for (
    let row = Math.max(0, starRow - 1);
    row <= Math.min(size - 1, starRow + 1);
    row++
  ) {
    let existingStars = 0;
    const remainingCells: Coord[] = [];
    const constraintCells = new Set<string>();

    // Collect constraint cells for this row
    for (const c of oneByNByRow.get(row) || []) {
      for (const [cr, cc] of c.cells) {
        constraintCells.add(cellKey(cr, cc));
      }
    }
    for (const c of twoByTwoByRow.get(row) || []) {
      for (const [cr, cc] of c.cells) {
        if (cr === row) {
          // Only cells actually in this row
          constraintCells.add(cellKey(cr, cc));
        }
      }
    }

    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = cellKey(row, col);
        if (key === starKey && row === starRow) {
          existingStars++; // The hypothetical star
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    // Basic check
    if (remainingCells.length < needed) {
      return true;
    }

    if (!canTileWithMinCount(remainingCells, size, needed)) {
      return true;
    }

    // Check each constraint in this row
    const rowOneByN = oneByNByRow.get(row) || [];
    const rowTwoByTwo = twoByTwoByRow.get(row) || [];

    // Calculate total guaranteed stars from constraints in this row
    let constraintContribution = 0;

    for (const c of rowOneByN) {
      const starInConstraint = c.cells.some(
        ([r, col]) => r === starRow && col === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? c.starsNeeded - 1 : c.starsNeeded;
      if (adjustedNeed > 0 && remainingInConstraint < adjustedNeed) {
        return true; // Constraint broken
      }
      constraintContribution += adjustedNeed;
    }

    for (const c of rowTwoByTwo) {
      const starInConstraint = c.cells.some(
        ([r, col]) => r === starRow && col === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? 0 : 1; // 2×2 needs exactly 1 star
      if (adjustedNeed > 0 && remainingInConstraint === 0) {
        return true; // Constraint broken
      }
      // Only count contribution if constraint cell is in this row
      if (c.cells.some(([r]) => r === row)) {
        constraintContribution += adjustedNeed;
      }
    }

    // Check if free cells can accommodate non-constraint stars
    const freeNeeded = needed - constraintContribution;
    if (freeNeeded > 0) {
      const freeCells = remainingCells.filter(
        ([r, c]) => !constraintCells.has(cellKey(r, c)),
      );

      if (freeCells.length < freeNeeded) {
        return true;
      }

      if (!canTileWithMinCount(freeCells, size, freeNeeded)) {
        return true;
      }
    }
  }

  // Check columns affected by this star
  for (
    let col = Math.max(0, starCol - 1);
    col <= Math.min(size - 1, starCol + 1);
    col++
  ) {
    let existingStars = 0;
    const remainingCells: Coord[] = [];
    const constraintCells = new Set<string>();

    for (const c of oneByNByCol.get(col) || []) {
      for (const [cr, cc] of c.cells) {
        constraintCells.add(cellKey(cr, cc));
      }
    }
    for (const c of twoByTwoByCol.get(col) || []) {
      for (const [cr, cc] of c.cells) {
        if (cc === col) {
          constraintCells.add(cellKey(cr, cc));
        }
      }
    }

    for (let row = 0; row < size; row++) {
      if (cells[row][col] === "star") {
        existingStars++;
      } else if (cells[row][col] === "unknown") {
        const key = cellKey(row, col);
        if (key === starKey && col === starCol) {
          existingStars++;
        } else if (!markedCells.has(key)) {
          remainingCells.push([row, col]);
        }
      }
    }

    const needed = board.stars - existingStars;
    if (needed <= 0) continue;

    if (remainingCells.length < needed) {
      return true;
    }

    if (!canTileWithMinCount(remainingCells, size, needed)) {
      return true;
    }

    const colOneByN = oneByNByCol.get(col) || [];
    const colTwoByTwo = twoByTwoByCol.get(col) || [];

    let constraintContribution = 0;

    for (const c of colOneByN) {
      const starInConstraint = c.cells.some(
        ([r, cc]) => r === starRow && cc === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? c.starsNeeded - 1 : c.starsNeeded;
      if (adjustedNeed > 0 && remainingInConstraint < adjustedNeed) {
        return true;
      }
      constraintContribution += adjustedNeed;
    }

    for (const c of colTwoByTwo) {
      const starInConstraint = c.cells.some(
        ([r, cc]) => r === starRow && cc === starCol,
      );
      let remainingInConstraint = 0;
      for (const [cr, cc] of c.cells) {
        const key = cellKey(cr, cc);
        if (key !== starKey && !markedCells.has(key)) {
          remainingInConstraint++;
        }
      }
      const adjustedNeed = starInConstraint ? 0 : 1;
      if (adjustedNeed > 0 && remainingInConstraint === 0) {
        return true;
      }
      if (c.cells.some(([, cc]) => cc === col)) {
        constraintContribution += adjustedNeed;
      }
    }

    const freeNeeded = needed - constraintContribution;
    if (freeNeeded > 0) {
      const freeCells = remainingCells.filter(
        ([r, c]) => !constraintCells.has(cellKey(r, c)),
      );

      if (freeCells.length < freeNeeded) {
        return true;
      }

      if (!canTileWithMinCount(freeCells, size, freeNeeded)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if placing a star would break any adjacent region's capacity.
 *
 * For each region adjacent to the candidate cell (but not containing it):
 * 1. Simulate placing a star at the candidate
 * 2. Mark all cells adjacent to the star as unavailable
 * 3. Check if the region can still fit its required stars
 */
function checkAdjacentRegionViolation(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const size = board.grid.length;
  const starRegionId = board.grid[starRow][starCol];
  const starKey = cellKey(starRow, starCol);

  // Find all regions that have cells adjacent to the star position
  const affectedRegions = new Set<number>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = starRow + dr;
      const nc = starCol + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const regionId = board.grid[nr][nc];
        if (regionId !== starRegionId) {
          affectedRegions.add(regionId);
        }
      }
    }
  }

  // Check each affected region
  for (const regionId of affectedRegions) {
    const region = analysis.regions.get(regionId);
    if (!region || region.starsNeeded <= 0) continue;

    // Collect remaining cells after placing star at (starRow, starCol)
    const remainingCells: Coord[] = [];
    for (const [r, c] of region.unknownCoords) {
      const key = cellKey(r, c);
      // Skip if this cell is adjacent to the hypothetical star
      const isAdjacent =
        Math.abs(r - starRow) <= 1 && Math.abs(c - starCol) <= 1;
      if (!isAdjacent && key !== starKey) {
        remainingCells.push([r, c]);
      }
    }

    // Check if region can still fit its stars
    if (remainingCells.length < region.starsNeeded) {
      return true;
    }

    if (!canTileWithMinCount(remainingCells, size, region.starsNeeded)) {
      return true;
    }
  }

  return false;
}

export default function finnedCounts(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions } = analysis;
  if (size === 0) return false;

  // === PRECOMPUTATION PHASE ===
  // Compute constraints once (for row/column checks)
  const oneByNConstraints = findOneByNConstraints(board, cells, analysis);
  const twoByTwoConstraints = findStarContaining2x2s(board, cells);

  // Build base adjusted regions (without any hypothetical star)
  const baseAdjusted: AdjustedRegion[] = [];
  const baseAdjustedById = new Map<number, AdjustedRegion>();

  for (const [id, meta] of regions) {
    const starsNeeded = board.stars - meta.starsPlaced;
    if (starsNeeded <= 0) continue;

    const unknownRows = new Set(meta.unknownCoords.map(([r]) => r));
    const unknownCols = new Set(meta.unknownCoords.map(([, c]) => c));

    const region: AdjustedRegion = {
      id,
      starsNeeded,
      unknownRows,
      unknownCols,
      unknownCoords: meta.unknownCoords,
    };
    baseAdjusted.push(region);
    baseAdjustedById.set(id, region);
  }

  // Build row/col to region mappings
  const baseRowToRegions = new Map<number, Set<number>>();
  const baseColToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    baseRowToRegions.set(i, new Set());
    baseColToRegions.set(i, new Set());
  }

  for (const region of baseAdjusted) {
    for (const row of region.unknownRows) {
      baseRowToRegions.get(row)!.add(region.id);
    }
    for (const col of region.unknownCols) {
      baseColToRegions.get(col)!.add(region.id);
    }
  }

  const precomputed: PrecomputedData = {
    baseAdjusted,
    baseAdjustedById,
    baseRowToRegions,
    baseColToRegions,
  };

  // === MAIN LOOP ===
  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      // Check 1: Region vs row/col counting (existing)
      if (checkViolation(board, analysis, row, col, cells, precomputed)) {
        cells[row][col] = "marked";
        changed = true;
        continue;
      }

      // Check 2: Row/column quota with constraints (moved from pressuredExclusion)
      const markedCells = buildMarkedCellSet(row, col, size);
      if (
        checkRowOrColumnViolation(
          row,
          col,
          board,
          cells,
          markedCells,
          oneByNConstraints,
          twoByTwoConstraints,
        )
      ) {
        cells[row][col] = "marked";
        changed = true;
        continue;
      }

      // Check 3: Adjacent region capacity (moved from pressuredExclusion)
      if (checkAdjacentRegionViolation(row, col, board, cells, analysis)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
