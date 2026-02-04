/**
 * Rule 15: Adjacent Line Analysis
 *
 * Analyzes adjacent rows or columns together with exact per-line star quotas.
 * When multiple adjacent columns have cells that interact via adjacency,
 * analyzing them together can reveal forced placements.
 *
 * This handles cases like KrazyDad step 49 where columns G, H, I together
 * constrain each other such that H3 must be a star.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, capacity } from "../../helpers/boardAnalysis";
import { Composite } from "../../helpers/compositeAnalysis";

/**
 * Extended composite type for adjacent line analysis with per-line quotas.
 */
type AdjacentLineComposite = Composite & {
  axis: "row" | "col";
  lineRange: [number, number]; // [start, end] inclusive
  lineQuotas: Map<number, number>; // lineIndex -> exact starsNeeded
};

/**
 * Enumerate valid star placements with EXACT per-line quotas.
 * Used for adjacent line composites where each row/column must get
 * exactly its required number of stars.
 *
 * Also enforces region quotas to ensure valid placements.
 * Critically, this also enforces MINIMUM region contributions for regions
 * that have all their cells inside the composite (they must receive their
 * full quota from within the composite).
 */
function enumerateWithExactLineQuotas(
  unknowns: Coord[],
  axis: "row" | "col",
  lineQuotas: Map<number, number>,
  board: Board,
  analysis: BoardAnalysis,
): Coord[][] {
  const totalStarsNeeded = [...lineQuotas.values()].reduce((a, b) => a + b, 0);
  if (unknowns.length < totalStarsNeeded) return [];
  if (totalStarsNeeded === 0) return [[]];

  const { size, rowStars, colStars, regions } = analysis;

  // Build cell -> line index mapping and line -> cells mapping
  const cellToLine = new Map<string, number>();
  const lineToCells = new Map<number, Coord[]>();

  for (const [row, col] of unknowns) {
    const lineIdx = axis === "row" ? row : col;
    cellToLine.set(`${row},${col}`, lineIdx);

    if (!lineToCells.has(lineIdx)) lineToCells.set(lineIdx, []);
    lineToCells.get(lineIdx)!.push([row, col]);
  }

  // Build adjacency between unknown cells
  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < unknowns.length; i++) {
    coordToIdx.set(`${unknowns[i][0]},${unknowns[i][1]}`, i);
  }

  const adjacent: Set<number>[] = unknowns.map(() => new Set());
  for (let i = 0; i < unknowns.length; i++) {
    const [row, col] = unknowns[i];
    for (let drow = -1; drow <= 1; drow++) {
      for (let dcol = -1; dcol <= 1; dcol++) {
        if (drow === 0 && dcol === 0) continue;
        const key = `${row + drow},${col + dcol}`;
        const j = coordToIdx.get(key);
        if (j !== undefined && j !== i) {
          adjacent[i].add(j);
        }
      }
    }
  }

  // Build cell -> region mapping and track region quotas
  const cellToRegion: number[] = unknowns.map(([row, col]) => board.grid[row][col]);
  const regionStarsNeeded = new Map<number, number>();
  for (const [regionId, meta] of regions) {
    if (meta.starsNeeded > 0) {
      regionStarsNeeded.set(regionId, meta.starsNeeded);
    }
  }

  // Compute minimum contribution required from inside the composite for each region.
  // This handles regions whose cells are entirely or mostly inside the composite.
  const unknownSet = new Set(unknowns.map((c) => `${c[0]},${c[1]}`));
  const regionMinContrib = new Map<number, number>();
  const regionCellsInside = new Map<number, Coord[]>();

  for (const [regionId, meta] of regions) {
    if (meta.starsNeeded <= 0) continue;

    // Partition region's unknown cells into inside/outside composite
    const inside: Coord[] = [];
    const outside: Coord[] = [];
    for (const coord of meta.unknownCoords) {
      if (unknownSet.has(`${coord[0]},${coord[1]}`)) {
        inside.push(coord);
      } else {
        outside.push(coord);
      }
    }

    if (inside.length === 0) continue;

    regionCellsInside.set(regionId, inside);

    // Max stars region can get from outside the composite
    const maxFromOutside = capacity(outside, analysis);
    // Min stars region must get from inside the composite
    const minFromInside = Math.max(0, meta.starsNeeded - maxFromOutside);

    if (minFromInside > 0) {
      regionMinContrib.set(regionId, minFromInside);
    }
  }

  const results: Coord[][] = [];
  const MAX_RESULTS = 1000;

  // Track stars per analyzed line
  const lineCounts = new Map<number, number>();
  for (const lineIdx of lineQuotas.keys()) {
    lineCounts.set(lineIdx, 0);
  }

  // Track perpendicular line counts for global quotas
  const perpCounts = new Array(size).fill(0);

  // Track region counts for region quotas
  const regionCounts = new Map<number, number>();
  for (const regionId of regionStarsNeeded.keys()) {
    regionCounts.set(regionId, 0);
  }

  function backtrack(start: number, current: number[], forbidden: Set<number>) {
    if (results.length >= MAX_RESULTS) return;

    if (current.length === totalStarsNeeded) {
      // Verify all line quotas exactly met
      let allMet = true;
      for (const [lineIdx, quota] of lineQuotas) {
        if (lineCounts.get(lineIdx) !== quota) {
          allMet = false;
          break;
        }
      }
      if (!allMet) return;

      // Verify all region minimum contributions are met
      for (const [regionId, minContrib] of regionMinContrib) {
        const placed = regionCounts.get(regionId) || 0;
        if (placed < minContrib) {
          return; // Region can't be satisfied
        }
      }

      results.push(current.map((i) => unknowns[i]));
      return;
    }

    // Early termination: not enough cells left
    const remaining = unknowns.length - start;
    const needed = totalStarsNeeded - current.length;
    if (remaining < needed) return;

    // Check if any line is impossible to satisfy
    for (const [lineIdx, quota] of lineQuotas) {
      const placed = lineCounts.get(lineIdx)!;
      if (placed > quota) return; // Exceeded

      // Count remaining available cells in this line
      const cellsInLine = lineToCells.get(lineIdx) || [];
      let availableInLine = 0;
      for (const cell of cellsInLine) {
        const idx = coordToIdx.get(`${cell[0]},${cell[1]}`)!;
        if (idx >= start && !forbidden.has(idx)) {
          // Also check if cell's region is already full
          const regionId = cellToRegion[idx];
          const regionQuota = regionStarsNeeded.get(regionId);
          if (regionQuota === undefined || regionCounts.get(regionId)! < regionQuota) {
            availableInLine++;
          }
        }
      }

      if (placed + availableInLine < quota) return; // Can't reach quota
    }

    // Early termination: check if region minimums can still be satisfied
    for (const [regionId, minContrib] of regionMinContrib) {
      const placed = regionCounts.get(regionId) || 0;
      const stillNeeded = minContrib - placed;
      if (stillNeeded <= 0) continue;

      // Count remaining available cells for this region inside the composite
      const cellsInside = regionCellsInside.get(regionId) || [];
      let availableForRegion = 0;
      for (const cell of cellsInside) {
        const idx = coordToIdx.get(`${cell[0]},${cell[1]}`);
        if (idx !== undefined && idx >= start && !forbidden.has(idx)) {
          availableForRegion++;
        }
      }

      if (availableForRegion < stillNeeded) return; // Can't meet region minimum
    }

    for (
      let i = start;
      i < unknowns.length && results.length < MAX_RESULTS;
      i++
    ) {
      if (forbidden.has(i)) continue;

      const [row, col] = unknowns[i];
      const lineIdx = axis === "row" ? row : col;
      const perpIdx = axis === "row" ? col : row;
      const regionId = cellToRegion[i];

      // Check line quota not exceeded
      const lineQuota = lineQuotas.get(lineIdx);
      if (lineQuota !== undefined && lineCounts.get(lineIdx)! >= lineQuota) {
        continue; // This line already has enough stars
      }

      // Check perpendicular global quota
      const perpBase = axis === "row" ? colStars[perpIdx] : rowStars[perpIdx];
      if (perpBase + perpCounts[perpIdx] + 1 > board.stars) continue;

      // Check region quota not exceeded
      const regionQuota = regionStarsNeeded.get(regionId);
      if (regionQuota !== undefined && regionCounts.get(regionId)! >= regionQuota) {
        continue; // This region already has enough stars
      }

      // Add cell
      const newForbidden = new Set(forbidden);
      for (const adj of adjacent[i]) {
        newForbidden.add(adj);
      }

      if (lineQuota !== undefined) {
        lineCounts.set(lineIdx, lineCounts.get(lineIdx)! + 1);
      }
      perpCounts[perpIdx]++;
      if (regionQuota !== undefined) {
        regionCounts.set(regionId, regionCounts.get(regionId)! + 1);
      }

      current.push(i);
      backtrack(i + 1, current, newForbidden);
      current.pop();

      if (regionQuota !== undefined) {
        regionCounts.set(regionId, regionCounts.get(regionId)! - 1);
      }
      perpCounts[perpIdx]--;
      if (lineQuota !== undefined) {
        lineCounts.set(lineIdx, lineCounts.get(lineIdx)! - 1);
      }
    }
  }

  backtrack(0, [], new Set());
  return results;
}

/**
 * Analyze an adjacent line composite using exact per-line quotas.
 * This finds forced stars and impossible cells by enumerating all valid
 * placements where each line gets exactly its required stars.
 */
function analyzeAdjacentLineComposite(
  unknowns: Coord[],
  axis: "row" | "col",
  lineRange: [number, number],
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, rowStars, colStars } = analysis;
  const [start, end] = lineRange;

  // Compute per-line quotas
  const lineQuotas = new Map<number, number>();
  for (let lineIdx = start; lineIdx <= end; lineIdx++) {
    const currentStars = axis === "row" ? rowStars[lineIdx] : colStars[lineIdx];
    const needed = board.stars - currentStars;
    if (needed > 0) {
      lineQuotas.set(lineIdx, needed);
    }
  }

  if (lineQuotas.size === 0) return false;

  // Pre-filter: check if enumeration is worthwhile
  const totalNeeded = [...lineQuotas.values()].reduce((a, b) => a + b, 0);
  if (unknowns.length < totalNeeded) return false;

  // Skip if ratio is too high (too many possibilities)
  const maxSlackMultiplier = Math.max(3, board.stars);
  if (unknowns.length > totalNeeded * maxSlackMultiplier) return false;

  // Enumerate with exact quotas
  const validPlacements = enumerateWithExactLineQuotas(
    unknowns,
    axis,
    lineQuotas,
    board,
    analysis,
  );

  if (validPlacements.length === 0 || validPlacements.length >= 1000) {
    return false;
  }

  // Find cells in ALL placements (forced) and cells in ANY placement
  const allKeys = new Set(unknowns.map((c) => `${c[0]},${c[1]}`));
  const inAllPlacements = new Set<string>();
  const inAnyPlacement = new Set<string>();

  for (let p = 0; p < validPlacements.length; p++) {
    const placementKeys = new Set(
      validPlacements[p].map((c) => `${c[0]},${c[1]}`),
    );

    if (p === 0) {
      for (const key of placementKeys) {
        inAllPlacements.add(key);
      }
    } else {
      for (const key of inAllPlacements) {
        if (!placementKeys.has(key)) {
          inAllPlacements.delete(key);
        }
      }
    }

    for (const key of placementKeys) {
      inAnyPlacement.add(key);
    }
  }

  // Cells in NO placements = can be marked
  const inNoPlacements = new Set<string>();
  for (const key of allKeys) {
    if (!inAnyPlacement.has(key)) {
      inNoPlacements.add(key);
    }
  }

  let changed = false;

  // Place forced stars (with full validation)
  for (const key of inAllPlacements) {
    const [row, col] = key.split(",").map(Number);
    if (cells[row][col] !== "unknown") continue;

    // Validate no adjacent star exists
    let hasAdjacentStar = false;
    for (let dr = -1; dr <= 1 && !hasAdjacentStar; dr++) {
      for (let dc = -1; dc <= 1 && !hasAdjacentStar; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (cells[nr][nc] === "star") hasAdjacentStar = true;
        }
      }
    }
    if (hasAdjacentStar) continue;

    // Validate row/col quotas
    let rowCount = 0;
    let colCount = 0;
    for (let i = 0; i < size; i++) {
      if (cells[row][i] === "star") rowCount++;
      if (cells[i][col] === "star") colCount++;
    }
    if (rowCount >= board.stars || colCount >= board.stars) continue;

    // Validate region quota
    const regionId = board.grid[row][col];
    let regionCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board.grid[r][c] === regionId && cells[r][c] === "star") {
          regionCount++;
        }
      }
    }
    if (regionCount >= board.stars) continue;

    cells[row][col] = "star";
    changed = true;
  }

  // Mark impossible cells
  for (const key of inNoPlacements) {
    const [row, col] = key.split(",").map(Number);
    if (cells[row][col] === "unknown") {
      cells[row][col] = "marked";
      changed = true;
    }
  }

  return changed;
}

/**
 * Find composites from adjacent columns.
 * When multiple adjacent columns have cells that interact via adjacency,
 * analyzing them together can reveal forced placements.
 */
function findAdjacentLineComposites(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
): AdjacentLineComposite[] {
  const composites: AdjacentLineComposite[] = [];
  const size = board.grid.length;
  const { rowStars, colStars } = analysis;

  // Try combining 2-4 adjacent lines
  for (let start = 0; start < size; start++) {
    for (let span = 2; span <= Math.min(4, size - start); span++) {
      const end = start + span - 1;

      // Collect unknown cells and compute stars needed (total and per-line)
      const unknownCells: Coord[] = [];
      let starsNeeded = 0;
      const lineQuotas = new Map<number, number>();

      for (let lineIdx = start; lineIdx <= end; lineIdx++) {
        const lineStars = axis === "col" ? colStars[lineIdx] : rowStars[lineIdx];
        const lineNeeded = board.stars - lineStars;
        starsNeeded += lineNeeded;

        if (lineNeeded > 0) {
          lineQuotas.set(lineIdx, lineNeeded);
        }

        for (let i = 0; i < size; i++) {
          const [row, col] =
            axis === "col" ? [i, lineIdx] : [lineIdx, i];
          if (cells[row][col] === "unknown") {
            unknownCells.push([row, col]);
          }
        }
      }

      if (starsNeeded <= 0) continue;
      if (unknownCells.length < starsNeeded) continue;

      // Pre-filter for tight ratios - use tighter ratio for line composites
      // as they tend to be more productive when tight
      const maxSlackMultiplier = Math.max(3, board.stars);
      if (unknownCells.length > starsNeeded * maxSlackMultiplier) continue;

      composites.push({
        id: `${axis}-combo-${start}-${end}`,
        source: "combination",
        cells: unknownCells,
        unknownCells,
        starsNeeded,
        regionIds: new Set(),
        axis,
        lineRange: [start, end],
        lineQuotas,
      });
    }
  }

  return composites;
}

export default function adjacentLineAnalysis(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  // Try adjacent line composites with exact per-line quota analysis
  const adjacentLineComposites = [
    ...findAdjacentLineComposites(board, cells, analysis, "row"),
    ...findAdjacentLineComposites(board, cells, analysis, "col"),
  ];

  const seenSigs = new Set<string>();
  for (const alc of adjacentLineComposites) {
    const currentUnknowns = alc.unknownCells.filter(
      ([row, col]) => cells[row][col] === "unknown",
    );
    const sig = currentUnknowns.map((c) => `${c[0]},${c[1]}`).sort().join("|");

    if (sig === "" || seenSigs.has(sig)) continue;
    seenSigs.add(sig);

    // Try specialized analysis with exact per-line quotas
    if (
      analyzeAdjacentLineComposite(
        currentUnknowns,
        alc.axis,
        alc.lineRange,
        board,
        cells,
        analysis,
      )
    ) {
      return true;
    }
  }

  return false;
}
