/**
 * Rule 14: Composite Regions
 *
 * Identifies virtual composite regions from:
 * 1. Counting surplus: N regions in M rows (M > N) → leftover has (M-N)×stars stars
 * 2. Region combination: Adjacent regions merged → combined star count
 *
 * When a composite has tight tiling (minTiles === starsNeeded), we deduce
 * forced placements and exclusions.
 */

import {
  findAllMinimalTilings,
  canTileWithMinCount,
  maxIndependentSetSize,
} from "../../helpers/tiling";
import { Board, CellState, Coord, Tile } from "../../helpers/types";
import { coordKey } from "../../helpers/cellKey";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";

type Composite = {
  id: string;
  source: "counting" | "combination";
  cells: Coord[];
  unknownCells: Coord[];
  starsNeeded: number;
  regionIds: Set<number>;
};

/**
 * Extended composite type for adjacent line analysis with per-line quotas.
 */
type AdjacentLineComposite = Composite & {
  axis: "row" | "col";
  lineRange: [number, number]; // [start, end] inclusive
  lineQuotas: Map<number, number>; // lineIndex -> exact starsNeeded
};

/**
 * Build adjacency graph (8-connected regions).
 */
function buildAdjacencyGraph(
  board: Board,
  regions: Map<number, RegionMeta>,
): Map<number, Set<number>> {
  const adjacency = new Map<number, Set<number>>();
  const size = board.grid.length;

  for (const [id] of regions) {
    adjacency.set(id, new Set());
  }

  const deltas: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [-1, 1],
  ];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = board.grid[row][col];
      if (!regions.has(id)) continue;

      for (const [drow, dcol] of deltas) {
        const nrow = row + drow;
        const ncol = col + dcol;
        if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
          const neighborId = board.grid[nrow][ncol];
          if (neighborId !== id && regions.has(neighborId)) {
            adjacency.get(id)!.add(neighborId);
          }
        }
      }
    }
  }

  return adjacency;
}

/**
 * Find connected components of coordinates (8-connected).
 */
function findConnectedComponents(coords: Coord[]): Coord[][] {
  if (coords.length === 0) return [];

  const coordSet = new Set(coords.map(coordKey));
  const visited = new Set<string>();
  const components: Coord[][] = [];

  for (const coord of coords) {
    const key = coordKey(coord);
    if (visited.has(key)) continue;

    const component: Coord[] = [];
    const queue: Coord[] = [coord];
    visited.add(key);

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      component.push([row, col]);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nKey = coordKey([row + dr, col + dc]);
          if (coordSet.has(nKey) && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push([row + dr, col + dc]);
          }
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Find composites from undercounting surplus.
 * When N regions fit in M rows (M > N), leftover forms composite.
 */
function findUndercountingComposites(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
  axis: "row" | "col",
): Composite[] {
  const composites: Composite[] = [];
  const size = board.grid.length;
  const activeRegions = [...regions.values()].filter(
    (r) => r.starsNeeded > 0,
  );

  if (activeRegions.length === 0) return composites;

  for (const seedRegion of activeRegions) {
    // Use allRows/allCols for the seed lines (full region extent)
    const lines = axis === "row" ? seedRegion.rows : seedRegion.cols;
    if (lines.size === 0) continue;

    // Find all regions fully contained in these lines (using full extent)
    const contained = activeRegions.filter((r) => {
      const rLines = axis === "row" ? r.rows : r.cols;
      if (rLines.size === 0) return false;
      return [...rLines].every((l) => lines.has(l));
    });

    const M = lines.size;
    const N = contained.length;

    // Surplus case: more lines than regions
    if (M > N && M <= N + 2) {
      // Limit surplus to avoid huge composites
      const containedIds = new Set(contained.map((r) => r.id));
      const leftoverCells: Coord[] = [];

      for (const lineIdx of lines) {
        for (let i = 0; i < size; i++) {
          const [row, col] = axis === "row" ? [lineIdx, i] : [i, lineIdx];
          if (!containedIds.has(board.grid[row][col])) {
            leftoverCells.push([row, col]);
          }
        }
      }

      // Count stars already placed in leftover cells
      const leftoverStarsPlaced = leftoverCells.filter(
        ([row, col]) => cells[row][col] === "star",
      ).length;
      const leftoverStarsNeeded = (M - N) * board.stars - leftoverStarsPlaced;

      if (leftoverStarsNeeded <= 0) continue;

      const unknownCells = leftoverCells.filter(
        ([row, col]) => cells[row][col] === "unknown",
      );

      // Pre-filter: need enough unknowns and not too many
      // Use higher multiplier for larger star counts
      const maxSlackMultiplier = Math.max(4, board.stars);
      if (
        unknownCells.length >= leftoverStarsNeeded &&
        unknownCells.length <= leftoverStarsNeeded * maxSlackMultiplier
      ) {
        composites.push({
          id: `undercount-${axis}-${[...lines].sort().join(",")}`,
          source: "counting",
          cells: leftoverCells,
          unknownCells,
          starsNeeded: leftoverStarsNeeded,
          regionIds: new Set(),
        });
      }
    }
  }

  return composites;
}

/**
 * Find composites from overcounting surplus.
 * When M rows are fully contained in N regions (N > M), leftover forms composite.
 * - M rows need M × stars
 * - N regions need N × stars
 * - Leftover (region cells outside the M rows) needs (N - M) × stars
 */
function findOvercountingComposites(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
  axis: "row" | "col",
): Composite[] {
  const composites: Composite[] = [];
  const size = board.grid.length;
  const activeRegions = [...regions.values()].filter(
    (r) => r.starsNeeded > 0,
  );

  if (activeRegions.length === 0) return composites;

  // Build line -> regions mapping using full region extent
  const lineToRegions = new Map<number, Set<number>>();
  const lineHasUnknown = new Array(size).fill(false);

  for (let i = 0; i < size; i++) {
    lineToRegions.set(i, new Set());
  }

  for (const region of activeRegions) {
    // Use allRows/allCols for complete coverage
    const allLines = axis === "row" ? region.rows : region.cols;
    const unknownLines = axis === "row" ? region.unknownRows : region.unknownCols;
    for (const line of allLines) {
      lineToRegions.get(line)!.add(region.id);
    }
    for (const line of unknownLines) {
      lineHasUnknown[line] = true;
    }
  }

  // Find line ranges fully contained in regions with surplus
  // Limit range to board.stars + 2 to avoid huge composites while allowing meaningful surplus
  const maxLineRange = Math.min(board.stars + 2, 8);

  for (let start = 0; start < size; start++) {
    if (!lineHasUnknown[start]) continue;

    const lineSet = new Set<number>();
    const regSet = new Set<number>();

    for (let end = start; end < size && end < start + maxLineRange; end++) {
      if (!lineHasUnknown[end]) continue;

      lineSet.add(end);
      for (const id of lineToRegions.get(end)!) {
        regSet.add(id);
      }

      const M = lineSet.size; // rows
      const N = regSet.size; // regions

      // Overcounting surplus: more regions than rows (N > M)
      // Regions collectively need more stars than rows can provide
      // Leftover = region cells outside these rows
      if (N > M && N <= M + 2) {
        // Verify lines are fully contained in these regions
        let fullyContained = true;
        for (const line of lineSet) {
          for (let i = 0; i < size && fullyContained; i++) {
            const [row, col] = axis === "row" ? [line, i] : [i, line];
            if (cells[row][col] === "unknown" && !regSet.has(board.grid[row][col])) {
              fullyContained = false;
            }
          }
        }

        if (fullyContained) {
          // Leftover = region cells outside these lines
          const leftoverCells: Coord[] = [];
          for (const regId of regSet) {
            const region = regions.get(regId)!;
            for (const [row, col] of region.coords) {
              const lineIdx = axis === "row" ? row : col;
              if (!lineSet.has(lineIdx)) {
                leftoverCells.push([row, col]);
              }
            }
          }

          // Count stars already placed in leftover cells
          const leftoverStarsPlaced = leftoverCells.filter(
            ([row, col]) => cells[row][col] === "star",
          ).length;
          const leftoverStarsNeeded =
            (N - M) * board.stars - leftoverStarsPlaced;

          if (leftoverStarsNeeded <= 0) continue;

          const unknownCells = leftoverCells.filter(
            ([row, col]) => cells[row][col] === "unknown",
          );

          // Pre-filter: need enough unknowns and not too many
          // Use higher multiplier for larger star counts
          const maxSlackMultiplier = Math.max(4, board.stars);
          if (
            unknownCells.length >= leftoverStarsNeeded &&
            unknownCells.length <= leftoverStarsNeeded * maxSlackMultiplier
          ) {
            composites.push({
              id: `overcount-${axis}-${[...lineSet].sort().join(",")}`,
              source: "counting",
              cells: leftoverCells,
              unknownCells,
              starsNeeded: leftoverStarsNeeded,
              regionIds: regSet,
            });
          }
        }
      }
    }
  }

  return composites;
}

/**
 * Find composites from combining adjacent regions.
 */
function findCombinationComposites(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
  adjacency: Map<number, Set<number>>,
): Composite[] {
  const composites: Composite[] = [];
  const processed = new Set<string>();
  const activeRegions = [...regions.values()].filter(
    (r) => r.starsNeeded > 0,
  );

  // Generate single-region composites for tight ratios (for direct enumeration)
  for (const r of activeRegions) {
    if (r.unknownCoords.length < r.starsNeeded) continue;
    // Only include if ratio is tight enough for direct enumeration
    if (r.unknownCoords.length < r.starsNeeded * 8) {
      composites.push({
        id: `single-${r.id}`,
        source: "combination",
        cells: r.coords,
        unknownCells: r.unknownCoords,
        starsNeeded: r.starsNeeded,
        regionIds: new Set([r.id]),
      });
    }
  }

  // Generate pairs
  for (const r1 of activeRegions) {
    const neighbors1 = adjacency.get(r1.id);
    if (!neighbors1) continue;

    for (const id2 of neighbors1) {
      if (id2 <= r1.id) continue; // Avoid duplicates

      const r2 = regions.get(id2);
      if (!r2 || r2.starsNeeded <= 0) continue;

      const key = `${r1.id}-${id2}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const combinedUnknowns = [...r1.unknownCoords, ...r2.unknownCoords];
      const combinedNeed = r1.starsNeeded + r2.starsNeeded;

      // Pre-filter: skip if combined slack is too high
      const maxSlackMultiplier = Math.max(4, board.stars);
      if (combinedUnknowns.length > combinedNeed * maxSlackMultiplier) continue;
      if (combinedUnknowns.length < combinedNeed) continue;

      composites.push({
        id: `combo-${r1.id}-${id2}`,
        source: "combination",
        cells: [...r1.coords, ...r2.coords],
        unknownCells: combinedUnknowns,
        starsNeeded: combinedNeed,
        regionIds: new Set([r1.id, id2]),
      });
    }
  }

  // Generate triplets (three connected regions)
  for (const r1 of activeRegions) {
    const neighbors1 = adjacency.get(r1.id);
    if (!neighbors1) continue;

    for (const id2 of neighbors1) {
      if (id2 <= r1.id) continue;

      const r2 = regions.get(id2);
      if (!r2 || r2.starsNeeded <= 0) continue;

      const neighbors2 = adjacency.get(id2);
      if (!neighbors2) continue;

      // Find third region adjacent to r2 (and optionally to r1)
      for (const id3 of neighbors2) {
        if (id3 <= id2) continue; // Avoid duplicates via sorted order

        const r3 = regions.get(id3);
        if (!r3 || r3.starsNeeded <= 0) continue;

        const tripletKey = `${r1.id}-${id2}-${id3}`;
        if (processed.has(tripletKey)) continue;
        processed.add(tripletKey);

        const combinedUnknowns = [
          ...r1.unknownCoords,
          ...r2.unknownCoords,
          ...r3.unknownCoords,
        ];
        const combinedNeed = r1.starsNeeded + r2.starsNeeded + r3.starsNeeded;

        // Pre-filter: skip if combined slack is too high or too low
        const maxSlackMultiplier = Math.max(4, board.stars);
        if (combinedUnknowns.length > combinedNeed * maxSlackMultiplier)
          continue;
        if (combinedUnknowns.length < combinedNeed) continue;

        composites.push({
          id: `combo-${r1.id}-${id2}-${id3}`,
          source: "combination",
          cells: [...r1.coords, ...r2.coords, ...r3.coords],
          unknownCells: combinedUnknowns,
          starsNeeded: combinedNeed,
          regionIds: new Set([r1.id, id2, id3]),
        });
      }

      // Also check r1's other neighbors that are adjacent to r2
      for (const id3 of neighbors1) {
        if (id3 <= id2) continue;
        if (!neighbors2.has(id3)) continue; // Must also be adjacent to r2

        const r3 = regions.get(id3);
        if (!r3 || r3.starsNeeded <= 0) continue;

        const tripletKey = `${r1.id}-${id2}-${id3}`;
        if (processed.has(tripletKey)) continue;
        processed.add(tripletKey);

        const combinedUnknowns = [
          ...r1.unknownCoords,
          ...r2.unknownCoords,
          ...r3.unknownCoords,
        ];
        const combinedNeed = r1.starsNeeded + r2.starsNeeded + r3.starsNeeded;

        const maxSlackMultiplier = Math.max(4, board.stars);
        if (combinedUnknowns.length > combinedNeed * maxSlackMultiplier)
          continue;
        if (combinedUnknowns.length < combinedNeed) continue;

        composites.push({
          id: `combo-${r1.id}-${id2}-${id3}`,
          source: "combination",
          cells: [...r1.coords, ...r2.coords, ...r3.coords],
          unknownCells: combinedUnknowns,
          starsNeeded: combinedNeed,
          regionIds: new Set([r1.id, id2, id3]),
        });
      }
    }
  }

  return composites;
}

/**
 * Find composites from partitioned regions.
 * When marked cells split a region into disconnected components,
 * each component may have a minimum star requirement.
 */
function findPartitionedRegionComposites(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
): Composite[] {
  const composites: Composite[] = [];

  for (const [regionId, region] of regions) {
    if (region.starsNeeded <= 0) continue;
    if (region.unknownCoords.length < 2) continue;

    const components = findConnectedComponents(region.unknownCoords);
    if (components.length <= 1) continue;

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const otherCells = components.filter((_, j) => j !== i).flat();

      const maxFromOthers = maxIndependentSetSize(otherCells);
      const minFromThis = Math.max(0, region.starsNeeded - maxFromOthers);

      if (minFromThis > 0) {
        composites.push({
          id: `partition-${regionId}-comp${i}`,
          source: "counting",
          cells: component,
          unknownCells: component,
          starsNeeded: minFromThis,
          regionIds: new Set([regionId]),
        });
      }
    }
  }
  return composites;
}

/**
 * Enumerate all valid star placements for a set of unknown cells.
 * Returns all subsets of size `starsNeeded` where no two stars are adjacent
 * and row/column quotas are not exceeded.
 */
function enumerateValidPlacements(
  unknowns: Coord[],
  starsNeeded: number,
  board: Board,
  analysis: BoardAnalysis,
): Coord[][] {
  if (unknowns.length < starsNeeded) return [];
  if (starsNeeded === 0) return [[]];

  const { size, rowStars, colStars } = analysis;

  // Build adjacency between unknown cells
  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < unknowns.length; i++) {
    coordToIdx.set(coordKey(unknowns[i]), i);
  }

  // For each unknown, which other unknowns are adjacent (can't both be stars)
  const adjacent: Set<number>[] = unknowns.map(() => new Set());

  for (let i = 0; i < unknowns.length; i++) {
    const [row, col] = unknowns[i];
    for (let drow = -1; drow <= 1; drow++) {
      for (let dcol = -1; dcol <= 1; dcol++) {
        if (drow === 0 && dcol === 0) continue;
        const key = coordKey([row + drow, col + dcol] as Coord);
        const j = coordToIdx.get(key);
        if (j !== undefined && j !== i) {
          adjacent[i].add(j);
        }
      }
    }
  }

  const results: Coord[][] = [];
  const MAX_RESULTS = 1000; // Limit enumeration

  // Track accumulated row/column star counts during backtracking
  const rowCounts = new Array(size).fill(0);
  const colCounts = new Array(size).fill(0);

  function backtrack(start: number, current: number[], forbidden: Set<number>) {
    if (results.length >= MAX_RESULTS) return;

    if (current.length === starsNeeded) {
      results.push(current.map((i) => unknowns[i]));
      return;
    }

    // Prune: not enough cells left
    const remaining = unknowns.length - start;
    const needed = starsNeeded - current.length;
    if (remaining < needed) return;

    for (
      let i = start;
      i < unknowns.length && results.length < MAX_RESULTS;
      i++
    ) {
      if (forbidden.has(i)) continue;

      const [row, col] = unknowns[i];

      // Check row/column quotas before selecting this cell
      if (rowStars[row] + rowCounts[row] + 1 > board.stars) continue;
      if (colStars[col] + colCounts[col] + 1 > board.stars) continue;

      const newForbidden = new Set(forbidden);
      for (const adj of adjacent[i]) {
        newForbidden.add(adj);
      }

      // Update counts for recursive call
      rowCounts[row]++;
      colCounts[col]++;

      current.push(i);
      backtrack(i + 1, current, newForbidden);
      current.pop();

      // Restore counts
      rowCounts[row]--;
      colCounts[col]--;
    }
  }

  backtrack(0, [], new Set());
  return results;
}

/**
 * Enumerate valid star placements with EXACT per-line quotas.
 * Used for adjacent line composites where each row/column must get
 * exactly its required number of stars.
 *
 * Also enforces region quotas to ensure valid placements.
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
    cellToLine.set(coordKey([row, col]), lineIdx);

    if (!lineToCells.has(lineIdx)) lineToCells.set(lineIdx, []);
    lineToCells.get(lineIdx)!.push([row, col]);
  }

  // Build adjacency between unknown cells
  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < unknowns.length; i++) {
    coordToIdx.set(coordKey(unknowns[i]), i);
  }

  const adjacent: Set<number>[] = unknowns.map(() => new Set());
  for (let i = 0; i < unknowns.length; i++) {
    const [row, col] = unknowns[i];
    for (let drow = -1; drow <= 1; drow++) {
      for (let dcol = -1; dcol <= 1; dcol++) {
        if (drow === 0 && dcol === 0) continue;
        const key = coordKey([row + drow, col + dcol] as Coord);
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
      if (allMet) {
        results.push(current.map((i) => unknowns[i]));
      }
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
        const idx = coordToIdx.get(coordKey(cell))!;
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
  const allKeys = new Set(unknowns.map(coordKey));
  const inAllPlacements = new Set<string>();
  const inAnyPlacement = new Set<string>();

  for (let p = 0; p < validPlacements.length; p++) {
    const placementKeys = new Set(validPlacements[p].map(coordKey));

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
 * Find cells outside the composite that are covered by ALL tilings.
 * These cells cannot have stars.
 */
function findExternalForcedCells(
  allMinimalTilings: Tile[][],
  compositeSet: Set<string>,
): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  // For each tiling, find cells covered by tiles but outside composite
  const outsideSets: Set<string>[] = allMinimalTilings.map((tiling) => {
    const outside = new Set<string>();
    for (const tile of tiling) {
      for (const [row, col] of tile.cells) {
        const key = coordKey([row, col]);
        if (!compositeSet.has(key)) {
          outside.add(key);
        }
      }
    }
    return outside;
  });

  // Intersection: cells that appear in ALL tilings' outside sets
  if (outsideSets.length === 0) return [];

  const intersection = new Set(outsideSets[0]);
  for (let i = 1; i < outsideSets.length; i++) {
    for (const key of intersection) {
      if (!outsideSets[i].has(key)) {
        intersection.delete(key);
      }
    }
  }

  return [...intersection].map((key) => {
    const [row, col] = key.split(",").map(Number);
    return [row, col] as Coord;
  });
}

/**
 * Analyze a composite via direct adjacency enumeration.
 * Used when 2×2 tiling has slack but ratio is tight.
 */
function analyzeViaDirectEnumeration(
  currentUnknowns: Coord[],
  currentStarsNeeded: number,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  const validPlacements = enumerateValidPlacements(
    currentUnknowns,
    currentStarsNeeded,
    board,
    analysis,
  );

  // No valid placements or too many to analyze
  if (validPlacements.length === 0 || validPlacements.length >= 1000) {
    return false;
  }

  // Find cells in ALL placements (forced stars) and cells in NO placements (forced marks)
  const allKeys = new Set(currentUnknowns.map(coordKey));
  const inAllPlacements = new Set<string>();
  const inAnyPlacement = new Set<string>();

  for (let p = 0; p < validPlacements.length; p++) {
    const placementKeys = new Set(validPlacements[p].map(coordKey));

    if (p === 0) {
      // First placement initializes inAllPlacements
      for (const key of placementKeys) {
        inAllPlacements.add(key);
      }
    } else {
      // Subsequent placements intersect
      for (const key of inAllPlacements) {
        if (!placementKeys.has(key)) {
          inAllPlacements.delete(key);
        }
      }
    }

    // Track cells that appear in any placement
    for (const key of placementKeys) {
      inAnyPlacement.add(key);
    }
  }

  // Cells in NO placements = all unknowns - cells in any placement
  const inNoPlacements = new Set<string>();
  for (const key of allKeys) {
    if (!inAnyPlacement.has(key)) {
      inNoPlacements.add(key);
    }
  }

  let changed = false;

  // Place forced stars (with validation)
  for (const key of inAllPlacements) {
    const [row, col] = key.split(",").map(Number);
    if (cells[row][col] !== "unknown") continue;

    // Check no adjacent star exists
    let hasAdjacentStar = false;
    for (let drow = -1; drow <= 1 && !hasAdjacentStar; drow++) {
      for (let dcol = -1; dcol <= 1 && !hasAdjacentStar; dcol++) {
        if (drow === 0 && dcol === 0) continue;
        const nrow = row + drow;
        const ncol = col + dcol;
        if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
          if (cells[nrow][ncol] === "star") {
            hasAdjacentStar = true;
          }
        }
      }
    }
    if (hasAdjacentStar) continue;

    // Check row/col/region quotas
    let rowStars = 0;
    let colStars = 0;
    for (let i = 0; i < size; i++) {
      if (cells[row][i] === "star") rowStars++;
      if (cells[i][col] === "star") colStars++;
    }
    if (rowStars >= board.stars || colStars >= board.stars) continue;

    const regionId = board.grid[row][col];
    let regionStars = 0;
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (board.grid[rr][cc] === regionId && cells[rr][cc] === "star") {
          regionStars++;
        }
      }
    }
    if (regionStars >= board.stars) continue;

    cells[row][col] = "star";
    changed = true;
  }

  // Mark cells that appear in no valid placement
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
 * Analyze a composite for tight tiling deductions.
 */
function analyzeComposite(
  composite: Composite,
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size } = analysis;
  // Refresh unknownCells to current state (in case of stale composite)
  const currentUnknowns = composite.unknownCells.filter(
    ([row, col]) => cells[row][col] === "unknown",
  );

  // Count stars placed in composite since creation
  const starsPlacedInComposite = composite.unknownCells.filter(
    ([row, col]) => cells[row][col] === "star",
  ).length;

  const currentStarsNeeded = composite.starsNeeded - starsPlacedInComposite;

  if (currentUnknowns.length === 0) return false;
  if (currentStarsNeeded <= 0) return false;

  // Quick feasibility check
  if (!canTileWithMinCount(currentUnknowns, size, currentStarsNeeded)) {
    return false;
  }

  // Quick non-tight check via 2×2 tiling
  if (canTileWithMinCount(currentUnknowns, size, currentStarsNeeded + 1)) {
    // Has slack via 2×2 tiling, but try direct enumeration for tight ratios
    if (currentUnknowns.length < currentStarsNeeded * 8) {
      const result = analyzeViaDirectEnumeration(
        currentUnknowns,
        currentStarsNeeded,
        board,
        cells,
        analysis,
      );
      if (result) return true;
    }
    return false; // Has slack, not tight
  }

  const tiling = findAllMinimalTilings(currentUnknowns, cells, size);

  if (tiling.minTileCount !== currentStarsNeeded) {
    return false;
  }

  let changed = false;

  // Forced placements (single-coverage in all tilings)
  // Must verify adjacency - composite cells may be disconnected
  // Also check that forced cells aren't adjacent to each other (invalid analysis)
  const forcedSet = new Set(
    tiling.forcedCells.map(([row, col]) => coordKey([row, col])),
  );

  for (const [frow, fcol] of tiling.forcedCells) {
    if (cells[frow][fcol] !== "unknown") continue;

    // Check no adjacent star exists AND no adjacent forced cell
    let hasAdjacentConflict = false;
    for (let drow = -1; drow <= 1 && !hasAdjacentConflict; drow++) {
      for (let dcol = -1; dcol <= 1 && !hasAdjacentConflict; dcol++) {
        if (drow === 0 && dcol === 0) continue;
        const nrow = frow + drow;
        const ncol = fcol + dcol;
        if (nrow >= 0 && nrow < size && ncol >= 0 && ncol < size) {
          // Adjacent to existing star
          if (cells[nrow][ncol] === "star") {
            hasAdjacentConflict = true;
          }
          // Adjacent to another forced cell (would create adjacent stars)
          if (forcedSet.has(coordKey([nrow, ncol]))) {
            hasAdjacentConflict = true;
          }
        }
      }
    }

    if (hasAdjacentConflict) continue;

    // Global constraint validation: check row/col/region quotas
    let rowStars = 0;
    let colStars = 0;
    for (let i = 0; i < size; i++) {
      if (cells[frow][i] === "star") rowStars++;
      if (cells[i][fcol] === "star") colStars++;
    }

    if (rowStars >= board.stars || colStars >= board.stars) continue;

    // Check region quota
    const regionId = board.grid[frow][fcol];
    let regionStars = 0;
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (board.grid[rr][cc] === regionId && cells[rr][cc] === "star") {
          regionStars++;
        }
      }
    }

    if (regionStars >= board.stars) continue;

    cells[frow][fcol] = "star";
    changed = true;
  }

  // External exclusions
  const compositeSet = new Set(composite.cells.map((coord) => coordKey(coord)));
  const externalForced = findExternalForcedCells(
    tiling.allMinimalTilings,
    compositeSet,
  );

  for (const [erow, ecol] of externalForced) {
    if (cells[erow][ecol] === "unknown") {
      cells[erow][ecol] = "marked";
      changed = true;
    }
  }

  return changed;
}

/**
 * Find composites from adjacent columns.
 * When multiple adjacent columns have cells that interact via adjacency,
 * analyzing them together can reveal forced placements.
 *
 * This handles the KrazyDad step 49 scenario where columns G, H, I together
 * constrain each other such that H3 must be a star.
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

/**
 * Apply reserved area exclusions for rows or columns.
 *
 * For each line (row/column), compute the minimum number of stars each
 * intersecting region MUST contribute to that line. If the sum of minimums
 * equals the line's star requirement, cells from regions with min=0 can be excluded.
 *
 * This implements the "reserved area" pattern: when certain regions are forced
 * to provide all stars for a line (because their cells outside the line can't
 * hold enough stars), cells from non-forced regions can be excluded.
 */
function applyReservedAreaExclusions(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
  analysis: BoardAnalysis,
  axis: "row" | "col",
): boolean {
  let changed = false;
  const size = board.grid.length;
  const lineStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  for (let lineIdx = 0; lineIdx < size; lineIdx++) {
    const starsNeeded = board.stars - lineStars[lineIdx];
    if (starsNeeded <= 0) continue;

    // Gather regions intersecting this line with their cells inside/outside
    const regionData = new Map<number, { inLine: Coord[]; outside: Coord[] }>();

    for (const [regionId, meta] of regions) {
      if (meta.starsNeeded <= 0) continue;

      const inLine: Coord[] = [];
      const outside: Coord[] = [];

      for (const [r, c] of meta.unknownCoords) {
        const isInLine = axis === "row" ? r === lineIdx : c === lineIdx;
        (isInLine ? inLine : outside).push([r, c]);
      }

      if (inLine.length > 0) {
        regionData.set(regionId, { inLine, outside });
      }
    }

    // Compute min contribution per region
    let totalMin = 0;
    const forcedRegions = new Set<number>();

    for (const [regionId, { outside }] of regionData) {
      const meta = regions.get(regionId)!;
      const maxOutside = maxIndependentSetSize(outside);
      const minContrib = Math.max(0, meta.starsNeeded - maxOutside);

      totalMin += minContrib;
      if (minContrib > 0) {
        forcedRegions.add(regionId);
      }
    }

    // If forced regions exactly cover the line's need, exclude others
    if (totalMin === starsNeeded && forcedRegions.size > 0) {
      for (let i = 0; i < size; i++) {
        const [row, col] = axis === "row" ? [lineIdx, i] : [i, lineIdx];
        if (cells[row][col] !== "unknown") continue;

        const regionId = board.grid[row][col];
        if (!forcedRegions.has(regionId)) {
          cells[row][col] = "marked";
          changed = true;
        }
      }
    }
  }

  return changed;
}

export default function compositeRegions(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions } = analysis;
  if (size === 0) return false;

  // Reserved area exclusions (run first, simpler deductions)
  if (applyReservedAreaExclusions(board, cells, regions, analysis, "row")) {
    return true;
  }
  if (applyReservedAreaExclusions(board, cells, regions, analysis, "col")) {
    return true;
  }

  // Try adjacent line composites with exact per-line quota analysis first
  // This handles cases like KrazyDad step 18 where per-row constraints force stars
  const adjacentLineComposites = [
    ...findAdjacentLineComposites(board, cells, analysis, "row"),
    ...findAdjacentLineComposites(board, cells, analysis, "col"),
  ];

  const seenSigs = new Set<string>();
  for (const alc of adjacentLineComposites) {
    const currentUnknowns = alc.unknownCells.filter(
      ([row, col]) => cells[row][col] === "unknown",
    );
    const sig = currentUnknowns.map(coordKey).sort().join("|");

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

  const adjacency = buildAdjacencyGraph(board, regions);

  // Collect standard composites (excluding adjacent line composites which were handled above)
  const composites: Composite[] = [
    ...findUndercountingComposites(board, cells, regions, "row"),
    ...findUndercountingComposites(board, cells, regions, "col"),
    ...findOvercountingComposites(board, cells, regions, "row"),
    ...findOvercountingComposites(board, cells, regions, "col"),
    ...findCombinationComposites(board, cells, regions, adjacency),
    ...findPartitionedRegionComposites(board, cells, regions),
  ];

  if (composites.length === 0) return false;

  // Deduplicate by unknown cell signature
  const seen = new Set<string>();

  for (const composite of composites) {
    // Refresh signature based on current unknowns
    const currentUnknowns = composite.unknownCells.filter(
      ([row, col]) => cells[row][col] === "unknown",
    );
    const sig = currentUnknowns.map(coordKey).sort().join("|");

    if (sig === "" || seen.has(sig)) continue;
    seen.add(sig);

    if (analyzeComposite(composite, board, cells, analysis)) {
      return true;
    }
  }

  return false;
}
