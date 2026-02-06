/**
 * Hypothetical Binded Placement
 *
 * If a hypothetical star binds another placement (forces a container's
 * stars into specific positions), and that bound placement causes a
 * stuck state, eliminate the hypothetical.
 *
 * The "binding" happens when the hypothesis squeezes a container
 * (region, row, or column) so tight that its star positions become
 * determined. Those positions are bound to the hypothesis — any
 * contradiction they cause is a contradiction of the hypothesis itself.
 *
 * 1. Hypothesize a star at cell C, mark adjacents
 * 2. Find containers (regions, rows, columns) that became tight
 *    (capacity == starsNeeded)
 * 3. Enumerate tight containers' valid placements, find forced positions
 * 4. Propagate forced stars' adjacency marks
 * 5. Check if any container is now unsolvable
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, capacity } from "../../helpers/boardAnalysis";
import { buildMarkedCellSet } from "../../helpers/oneByN";
import { neighbors } from "../../helpers/neighbors";

/**
 * Enumerate valid star placements for a set of cells needing N stars.
 * Enforces non-adjacency only. Used for region binding where all cells
 * share the same region (no cross-region quota concern).
 */
function enumeratePlacements(
  cells: Coord[],
  starsNeeded: number,
  size: number,
): Coord[][] {
  if (cells.length < starsNeeded) return [];
  if (starsNeeded === 0) return [[]];

  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < cells.length; i++) {
    coordToIdx.set(`${cells[i][0]},${cells[i][1]}`, i);
  }

  const adjacent: Set<number>[] = cells.map(() => new Set());
  for (let i = 0; i < cells.length; i++) {
    const [r, c] = cells[i];
    for (const [nr, nc] of neighbors(r, c, size)) {
      const j = coordToIdx.get(`${nr},${nc}`);
      if (j !== undefined && j !== i) {
        adjacent[i].add(j);
      }
    }
  }

  const results: Coord[][] = [];
  const MAX_RESULTS = 50;

  function backtrack(start: number, current: number[], forbidden: Set<number>) {
    if (results.length >= MAX_RESULTS) return;

    if (current.length === starsNeeded) {
      results.push(current.map((i) => cells[i]));
      return;
    }

    const remaining = cells.length - start;
    const needed = starsNeeded - current.length;
    if (remaining < needed) return;

    for (let i = start; i < cells.length && results.length < MAX_RESULTS; i++) {
      if (forbidden.has(i)) continue;

      const newForbidden = new Set(forbidden);
      for (const adj of adjacent[i]) {
        newForbidden.add(adj);
      }

      current.push(i);
      backtrack(i + 1, current, newForbidden);
      current.pop();
    }
  }

  backtrack(0, [], new Set());
  return results;
}

/**
 * Enumerate valid star placements for a row or column.
 * Enforces non-adjacency AND region quotas — a star can't land in
 * a region that's already at its limit.
 */
function enumerateLinePlacements(
  cells: Coord[],
  starsNeeded: number,
  size: number,
  board: Board,
  regionQuotas: Map<number, number>,
): Coord[][] {
  if (cells.length < starsNeeded) return [];
  if (starsNeeded === 0) return [[]];

  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < cells.length; i++) {
    coordToIdx.set(`${cells[i][0]},${cells[i][1]}`, i);
  }

  const adjacent: Set<number>[] = cells.map(() => new Set());
  for (let i = 0; i < cells.length; i++) {
    const [r, c] = cells[i];
    for (const [nr, nc] of neighbors(r, c, size)) {
      const j = coordToIdx.get(`${nr},${nc}`);
      if (j !== undefined && j !== i) {
        adjacent[i].add(j);
      }
    }
  }

  const cellRegion = cells.map(([r, c]) => board.grid[r][c]);
  const regionCounts = new Map<number, number>();

  const results: Coord[][] = [];
  const MAX_RESULTS = 50;

  function backtrack(start: number, current: number[], forbidden: Set<number>) {
    if (results.length >= MAX_RESULTS) return;

    if (current.length === starsNeeded) {
      results.push(current.map((i) => cells[i]));
      return;
    }

    const remaining = cells.length - start;
    const needed = starsNeeded - current.length;
    if (remaining < needed) return;

    for (let i = start; i < cells.length && results.length < MAX_RESULTS; i++) {
      if (forbidden.has(i)) continue;

      // Check region quota
      const rid = cellRegion[i];
      const maxForRegion = regionQuotas.get(rid) ?? 0;
      const currentForRegion = regionCounts.get(rid) ?? 0;
      if (currentForRegion >= maxForRegion) continue;

      const newForbidden = new Set(forbidden);
      for (const adj of adjacent[i]) {
        newForbidden.add(adj);
      }

      regionCounts.set(rid, currentForRegion + 1);
      current.push(i);
      backtrack(i + 1, current, newForbidden);
      current.pop();
      regionCounts.set(rid, currentForRegion);
    }
  }

  backtrack(0, [], new Set());
  return results;
}

/**
 * Extract forced cells from a list of valid placements:
 * cells that appear as stars in EVERY valid placement.
 */
function findForcedCells(placements: Coord[][]): Coord[] {
  if (placements.length === 0) return [];

  const forced = new Set(
    placements[0].map((c) => `${c[0]},${c[1]}`),
  );
  for (let p = 1; p < placements.length; p++) {
    const pKeys = new Set(placements[p].map((c) => `${c[0]},${c[1]}`));
    for (const key of forced) {
      if (!pKeys.has(key)) forced.delete(key);
    }
  }

  return [...forced].map((key) => {
    const [r, c] = key.split(",").map(Number);
    return [r, c] as Coord;
  });
}

/**
 * Check if hypothesizing a star at (starRow, starCol) leads to a
 * contradiction through binded placements in any container type.
 */
function checkBindedContradiction(
  starRow: number,
  starCol: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowStars, colStars } = analysis;

  // Step 1: Build the set of cells blocked by the hypothetical star
  const blocked = buildMarkedCellSet(starRow, starCol, size);

  // Build region quotas for line enumeration:
  // how many more stars each region can accept
  const regionQuotas = new Map<number, number>();
  for (const [regionId, region] of regions) {
    let quota = region.starsNeeded;
    if (board.grid[starRow][starCol] === regionId) quota--;
    if (quota > 0) regionQuotas.set(regionId, quota);
  }

  // Step 2: Find binded placements from tight containers
  const allForcedStars: Coord[] = [];

  // --- Check regions ---
  const affectedRegionIds = new Set<number>();
  for (const key of blocked) {
    const [r, c] = key.split(",").map(Number);
    if (cells[r]?.[c] === "unknown") {
      affectedRegionIds.add(board.grid[r][c]);
    }
  }

  for (const regionId of affectedRegionIds) {
    const region = regions.get(regionId);
    if (!region) continue;

    let adjustedNeeded = region.starsNeeded;
    const remaining: Coord[] = [];

    for (const [r, c] of region.unknownCoords) {
      if (r === starRow && c === starCol) {
        adjustedNeeded--;
      } else if (!blocked.has(`${r},${c}`)) {
        remaining.push([r, c]);
      }
    }

    if (adjustedNeeded <= 0) continue;
    if (remaining.length < adjustedNeeded) return true;

    const cap = capacity(remaining, analysis);
    if (cap < adjustedNeeded) return true;
    if (cap > adjustedNeeded) continue;

    // Tight — enumerate and find binded positions
    const placements = enumeratePlacements(remaining, adjustedNeeded, size);
    if (placements.length === 0) return true;

    allForcedStars.push(...findForcedCells(placements));
  }

  // --- Check rows ---
  // Only check rows within the blast radius (starRow-1 to starRow+1)
  for (let dr = -1; dr <= 1; dr++) {
    const row = starRow + dr;
    if (row < 0 || row >= size) continue;

    let adjustedNeeded = board.stars - rowStars[row];
    if (row === starRow) adjustedNeeded--;
    if (adjustedNeeded <= 0) continue;

    const remaining: Coord[] = [];
    for (let c = 0; c < size; c++) {
      if (cells[row][c] === "unknown" && !blocked.has(`${row},${c}`)) {
        remaining.push([row, c]);
      }
    }

    if (remaining.length < adjustedNeeded) return true;

    const cap = capacity(remaining, analysis);
    if (cap < adjustedNeeded) return true;
    if (cap > adjustedNeeded) continue;

    // Tight — enumerate with region quotas
    const placements = enumerateLinePlacements(
      remaining,
      adjustedNeeded,
      size,
      board,
      regionQuotas,
    );
    if (placements.length === 0) return true;

    allForcedStars.push(...findForcedCells(placements));
  }

  // --- Check columns ---
  // Only check columns within the blast radius (starCol-1 to starCol+1)
  for (let dc = -1; dc <= 1; dc++) {
    const col = starCol + dc;
    if (col < 0 || col >= size) continue;

    let adjustedNeeded = board.stars - colStars[col];
    if (col === starCol) adjustedNeeded--;
    if (adjustedNeeded <= 0) continue;

    const remaining: Coord[] = [];
    for (let r = 0; r < size; r++) {
      if (cells[r][col] === "unknown" && !blocked.has(`${r},${col}`)) {
        remaining.push([r, col]);
      }
    }

    if (remaining.length < adjustedNeeded) return true;

    const cap = capacity(remaining, analysis);
    if (cap < adjustedNeeded) return true;
    if (cap > adjustedNeeded) continue;

    // Tight — enumerate with region quotas
    const placements = enumerateLinePlacements(
      remaining,
      adjustedNeeded,
      size,
      board,
      regionQuotas,
    );
    if (placements.length === 0) return true;

    allForcedStars.push(...findForcedCells(placements));
  }

  if (allForcedStars.length === 0) return false;

  // Step 3: Propagate binded stars — expand the blocked set
  const extraBlocked = new Set(blocked);
  for (const [fr, fc] of allForcedStars) {
    extraBlocked.add(`${fr},${fc}`);
    for (const [nr, nc] of neighbors(fr, fc, size)) {
      extraBlocked.add(`${nr},${nc}`);
    }
  }

  // Step 4: Check all regions for capacity violations
  for (const [, region] of regions) {
    if (region.starsNeeded <= 0) continue;

    let adjustedNeeded = region.starsNeeded;
    const remaining: Coord[] = [];

    for (const [r, c] of region.unknownCoords) {
      if (r === starRow && c === starCol) {
        adjustedNeeded--;
        continue;
      }

      let isForced = false;
      for (const [fr, fc] of allForcedStars) {
        if (r === fr && c === fc) {
          adjustedNeeded--;
          isForced = true;
          break;
        }
      }
      if (isForced) continue;

      if (!extraBlocked.has(`${r},${c}`)) {
        remaining.push([r, c]);
      }
    }

    if (adjustedNeeded <= 0) continue;
    if (remaining.length < adjustedNeeded) return true;
    if (capacity(remaining, analysis) < adjustedNeeded) return true;
  }

  // Step 5: Check rows and columns for capacity violations
  for (let line = 0; line < size; line++) {
    // Check row
    let rowAdded = 0;
    if (starRow === line) rowAdded++;
    for (const [fr] of allForcedStars) {
      if (fr === line) rowAdded++;
    }

    const rowNeeded = board.stars - rowStars[line] - rowAdded;
    if (rowNeeded < 0) return true;
    if (rowNeeded > 0) {
      const rowRemaining: Coord[] = [];
      for (let c = 0; c < size; c++) {
        if (cells[line][c] !== "unknown" || extraBlocked.has(`${line},${c}`))
          continue;
        if (line === starRow && c === starCol) continue;

        let isForced = false;
        for (const [fr, fc] of allForcedStars) {
          if (fr === line && fc === c) {
            isForced = true;
            break;
          }
        }
        if (!isForced) rowRemaining.push([line, c]);
      }
      if (rowRemaining.length < rowNeeded) return true;
      if (capacity(rowRemaining, analysis) < rowNeeded) return true;
    }

    // Check column
    let colAdded = 0;
    if (starCol === line) colAdded++;
    for (const [, fc] of allForcedStars) {
      if (fc === line) colAdded++;
    }

    const colNeeded = board.stars - colStars[line] - colAdded;
    if (colNeeded < 0) return true;
    if (colNeeded > 0) {
      const colRemaining: Coord[] = [];
      for (let r = 0; r < size; r++) {
        if (cells[r][line] !== "unknown" || extraBlocked.has(`${r},${line}`))
          continue;
        if (r === starRow && line === starCol) continue;

        let isForced = false;
        for (const [fr, fc] of allForcedStars) {
          if (fr === r && fc === line) {
            isForced = true;
            break;
          }
        }
        if (!isForced) colRemaining.push([r, line]);
      }
      if (colRemaining.length < colNeeded) return true;
      if (capacity(colRemaining, analysis) < colNeeded) return true;
    }
  }

  return false;
}

export default function hypotheticalBindedPlacement(
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

      if (checkBindedContradiction(row, col, board, cells, analysis)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
