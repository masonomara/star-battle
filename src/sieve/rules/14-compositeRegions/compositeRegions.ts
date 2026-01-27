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

import buildRegions from "../../helpers/regions";
import {
  findAllMinimalTilings,
  canTileWithMinCount,
} from "../../helpers/tiling";
import { Board, CellState, Coord, Tile } from "../../helpers/types";
import { coordKey } from "../../helpers/cellKey";

type RegionMeta = {
  id: number;
  coords: Coord[];
  unknownCoords: Coord[];
  rows: Set<number>;
  cols: Set<number>;
  allRows: Set<number>;
  allCols: Set<number>;
  starsPlaced: number;
  starsNeeded: number;
};

type Composite = {
  id: string;
  source: "counting" | "combination";
  cells: Coord[];
  unknownCells: Coord[];
  starsNeeded: number;
  regionIds: Set<number>;
};

/**
 * Build metadata for all regions.
 */
function buildRegionMetas(
  board: Board,
  cells: CellState[][],
  regions: Map<number, Coord[]>,
): Map<number, RegionMeta> {
  const metas = new Map<number, RegionMeta>();

  for (const [id, coords] of regions) {
    const unknownCoords: Coord[] = [];
    const rows = new Set<number>();
    const cols = new Set<number>();
    const allRows = new Set<number>();
    const allCols = new Set<number>();
    let starsPlaced = 0;

    for (const [r, c] of coords) {
      allRows.add(r);
      allCols.add(c);
      if (cells[r][c] === "unknown") {
        unknownCoords.push([r, c]);
        rows.add(r);
        cols.add(c);
      } else if (cells[r][c] === "star") {
        starsPlaced++;
      }
    }

    const starsNeeded = board.stars - starsPlaced;

    metas.set(id, {
      id,
      coords,
      unknownCoords,
      rows,
      cols,
      allRows,
      allCols,
      starsPlaced,
      starsNeeded,
    });
  }

  return metas;
}

/**
 * Build adjacency graph (8-connected regions).
 */
function buildAdjacencyGraph(
  board: Board,
  regionMetas: Map<number, RegionMeta>,
): Map<number, Set<number>> {
  const adjacency = new Map<number, Set<number>>();
  const size = board.grid.length;

  for (const [id] of regionMetas) {
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

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!regionMetas.has(id)) continue;

      for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const neighborId = board.grid[nr][nc];
          if (neighborId !== id && regionMetas.has(neighborId)) {
            adjacency.get(id)!.add(neighborId);
          }
        }
      }
    }
  }

  return adjacency;
}

/**
 * Find composites from undercounting surplus.
 * When N regions fit in M rows (M > N), leftover forms composite.
 */
function findUndercountingComposites(
  board: Board,
  cells: CellState[][],
  regionMetas: Map<number, RegionMeta>,
  axis: "row" | "col",
): Composite[] {
  const composites: Composite[] = [];
  const size = board.grid.length;
  const activeRegions = [...regionMetas.values()].filter(
    (r) => r.starsNeeded > 0,
  );

  if (activeRegions.length === 0) return composites;

  for (const seedRegion of activeRegions) {
    // Use allRows/allCols for the seed lines (full region extent)
    const lines = axis === "row" ? seedRegion.allRows : seedRegion.allCols;
    if (lines.size === 0) continue;

    // Find all regions fully contained in these lines (using full extent)
    const contained = activeRegions.filter((r) => {
      const rLines = axis === "row" ? r.allRows : r.allCols;
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
          const [r, c] = axis === "row" ? [lineIdx, i] : [i, lineIdx];
          if (!containedIds.has(board.grid[r][c])) {
            leftoverCells.push([r, c]);
          }
        }
      }

      // Count stars already placed in leftover cells
      const leftoverStarsPlaced = leftoverCells.filter(
        ([r, c]) => cells[r][c] === "star",
      ).length;
      const leftoverStarsNeeded = (M - N) * board.stars - leftoverStarsPlaced;

      if (leftoverStarsNeeded <= 0) continue;

      const unknownCells = leftoverCells.filter(
        ([r, c]) => cells[r][c] === "unknown",
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
  regionMetas: Map<number, RegionMeta>,
  axis: "row" | "col",
): Composite[] {
  const composites: Composite[] = [];
  const size = board.grid.length;
  const activeRegions = [...regionMetas.values()].filter(
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
    const allLines = axis === "row" ? region.allRows : region.allCols;
    const unknownLines = axis === "row" ? region.rows : region.cols;
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
            const [r, c] = axis === "row" ? [line, i] : [i, line];
            if (cells[r][c] === "unknown" && !regSet.has(board.grid[r][c])) {
              fullyContained = false;
            }
          }
        }

        if (fullyContained) {
          // Leftover = region cells outside these lines
          const leftoverCells: Coord[] = [];
          for (const regId of regSet) {
            const region = regionMetas.get(regId)!;
            for (const [r, c] of region.coords) {
              const lineIdx = axis === "row" ? r : c;
              if (!lineSet.has(lineIdx)) {
                leftoverCells.push([r, c]);
              }
            }
          }

          // Count stars already placed in leftover cells
          const leftoverStarsPlaced = leftoverCells.filter(
            ([r, c]) => cells[r][c] === "star",
          ).length;
          const leftoverStarsNeeded =
            (N - M) * board.stars - leftoverStarsPlaced;

          if (leftoverStarsNeeded <= 0) continue;

          const unknownCells = leftoverCells.filter(
            ([r, c]) => cells[r][c] === "unknown",
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
  regionMetas: Map<number, RegionMeta>,
  adjacency: Map<number, Set<number>>,
): Composite[] {
  const composites: Composite[] = [];
  const processed = new Set<string>();
  const activeRegions = [...regionMetas.values()].filter(
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

      const r2 = regionMetas.get(id2);
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

      const r2 = regionMetas.get(id2);
      if (!r2 || r2.starsNeeded <= 0) continue;

      const neighbors2 = adjacency.get(id2);
      if (!neighbors2) continue;

      // Find third region adjacent to r2 (and optionally to r1)
      for (const id3 of neighbors2) {
        if (id3 <= id2) continue; // Avoid duplicates via sorted order

        const r3 = regionMetas.get(id3);
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

        const r3 = regionMetas.get(id3);
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
 * Enumerate all valid star placements for a set of unknown cells.
 * Returns all subsets of size `starsNeeded` where no two stars are adjacent.
 */
function enumerateValidPlacements(
  unknowns: Coord[],
  starsNeeded: number,
): Coord[][] {
  if (unknowns.length < starsNeeded) return [];
  if (starsNeeded === 0) return [[]];

  // Build adjacency between unknown cells
  const coordToIdx = new Map<string, number>();
  for (let i = 0; i < unknowns.length; i++) {
    coordToIdx.set(coordKey(unknowns[i]), i);
  }

  // For each unknown, which other unknowns are adjacent (can't both be stars)
  const adjacent: Set<number>[] = unknowns.map(() => new Set());

  for (let i = 0; i < unknowns.length; i++) {
    const [r, c] = unknowns[i];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const key = coordKey([r + dr, c + dc] as Coord);
        const j = coordToIdx.get(key);
        if (j !== undefined && j !== i) {
          adjacent[i].add(j);
        }
      }
    }
  }

  const results: Coord[][] = [];
  const MAX_RESULTS = 1000; // Limit enumeration

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
      for (const [r, c] of tile.cells) {
        const key = coordKey([r, c]);
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
    const [r, c] = key.split(",").map(Number);
    return [r, c] as Coord;
  });
}

/**
 * Analyze a composite via direct adjacency enumeration.
 * Used when 2×2 tiling has slack but ratio is tight.
 */
function analyzeViaDirectEnumeration(
  composite: Composite,
  currentUnknowns: Coord[],
  currentStarsNeeded: number,
  board: Board,
  cells: CellState[][],
  size: number,
  debug: boolean = false,
): boolean {
  const validPlacements = enumerateValidPlacements(
    currentUnknowns,
    currentStarsNeeded,
  );

  if (debug) {
    console.log(
      `    Direct enumeration found ${validPlacements.length} valid placements`,
    );
  }

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

  if (debug) {
    console.log(
      `    Forced stars: ${inAllPlacements.size}, Forced marks: ${inNoPlacements.size}`,
    );
  }

  let changed = false;

  // Place forced stars (with validation)
  for (const key of inAllPlacements) {
    const [r, c] = key.split(",").map(Number);
    if (cells[r][c] !== "unknown") continue;

    // Check no adjacent star exists
    let hasAdjacentStar = false;
    for (let dr = -1; dr <= 1 && !hasAdjacentStar; dr++) {
      for (let dc = -1; dc <= 1 && !hasAdjacentStar; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (cells[nr][nc] === "star") {
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
      if (cells[r][i] === "star") rowStars++;
      if (cells[i][c] === "star") colStars++;
    }
    if (rowStars >= board.stars || colStars >= board.stars) continue;

    const regionId = board.grid[r][c];
    let regionStars = 0;
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (board.grid[rr][cc] === regionId && cells[rr][cc] === "star") {
          regionStars++;
        }
      }
    }
    if (regionStars >= board.stars) continue;

    if (debug) {
      console.log(`    PLACE STAR at (${r},${c}) [direct enum]`);
    }
    cells[r][c] = "star";
    changed = true;
  }

  // Mark cells that appear in no valid placement
  for (const key of inNoPlacements) {
    const [r, c] = key.split(",").map(Number);
    if (cells[r][c] === "unknown") {
      if (debug) {
        console.log(`    MARK (${r},${c}) as excluded [direct enum]`);
      }
      cells[r][c] = "marked";
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
  size: number,
  debug: boolean = false,
): boolean {
  // Refresh unknownCells to current state (in case of stale composite)
  const currentUnknowns = composite.unknownCells.filter(
    ([r, c]) => cells[r][c] === "unknown",
  );

  // Count stars placed in composite since creation
  const starsPlacedInComposite = composite.unknownCells.filter(
    ([r, c]) => cells[r][c] === "star",
  ).length;

  const currentStarsNeeded = composite.starsNeeded - starsPlacedInComposite;

  if (currentUnknowns.length === 0) return false;
  if (currentStarsNeeded <= 0) return false;

  // Quick feasibility check
  if (!canTileWithMinCount(currentUnknowns, size, currentStarsNeeded)) {
    if (debug) {
      console.log(
        `  [${composite.id}] SKIP: can't fit ${currentStarsNeeded} tiles in ${currentUnknowns.length} cells`,
      );
    }
    return false;
  }

  // Quick non-tight check via 2×2 tiling
  if (canTileWithMinCount(currentUnknowns, size, currentStarsNeeded + 1)) {
    // Has slack via 2×2 tiling, but try direct enumeration for tight ratios
    if (currentUnknowns.length < currentStarsNeeded * 8) {
      if (debug) {
        console.log(
          `  [${composite.id}] SLACK via tiling, trying direct enumeration (${currentUnknowns.length} cells, need ${currentStarsNeeded})`,
        );
      }
      const result = analyzeViaDirectEnumeration(
        composite,
        currentUnknowns,
        currentStarsNeeded,
        board,
        cells,
        size,
        debug,
      );
      if (result) return true;
    }
    if (debug) {
      console.log(
        `  [${composite.id}] SKIP: has slack (can fit ${currentStarsNeeded + 1})`,
      );
    }
    return false; // Has slack, not tight
  }

  if (debug) {
    console.log(
      `  [${composite.id}] TIGHT: ${currentUnknowns.length} cells, need ${currentStarsNeeded} stars`,
    );
  }

  const tiling = findAllMinimalTilings(currentUnknowns, cells, size);

  if (debug) {
    console.log(
      `    minTileCount=${tiling.minTileCount}, tilings=${tiling.allMinimalTilings.length}, forced=${tiling.forcedCells.length}`,
    );
  }

  if (tiling.minTileCount !== currentStarsNeeded) {
    if (debug) {
      console.log(
        `    SKIP: minTileCount ${tiling.minTileCount} !== needed ${currentStarsNeeded}`,
      );
    }
    return false;
  }

  let changed = false;

  // Forced placements (single-coverage in all tilings)
  // Must verify adjacency - composite cells may be disconnected
  // Also check that forced cells aren't adjacent to each other (invalid analysis)
  const forcedSet = new Set(
    tiling.forcedCells.map(([r, c]) => coordKey([r, c])),
  );

  for (const [r, c] of tiling.forcedCells) {
    if (cells[r][c] !== "unknown") continue;

    // Check no adjacent star exists AND no adjacent forced cell
    let hasAdjacentConflict = false;
    for (let dr = -1; dr <= 1 && !hasAdjacentConflict; dr++) {
      for (let dc = -1; dc <= 1 && !hasAdjacentConflict; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          // Adjacent to existing star
          if (cells[nr][nc] === "star") {
            hasAdjacentConflict = true;
          }
          // Adjacent to another forced cell (would create adjacent stars)
          if (forcedSet.has(coordKey([nr, nc]))) {
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
      if (cells[r][i] === "star") rowStars++;
      if (cells[i][c] === "star") colStars++;
    }

    if (rowStars >= board.stars || colStars >= board.stars) continue;

    // Check region quota
    const regionId = board.grid[r][c];
    let regionStars = 0;
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (board.grid[rr][cc] === regionId && cells[rr][cc] === "star") {
          regionStars++;
        }
      }
    }

    if (regionStars >= board.stars) continue;

    if (debug) {
      console.log(`    PLACE STAR at (${r},${c})`);
    }
    cells[r][c] = "star";
    changed = true;
  }

  // External exclusions
  const compositeSet = new Set(composite.cells.map((coord) => coordKey(coord)));
  const externalForced = findExternalForcedCells(
    tiling.allMinimalTilings,
    compositeSet,
  );

  for (const [r, c] of externalForced) {
    if (cells[r][c] === "unknown") {
      if (debug) {
        console.log(`    MARK (${r},${c}) as excluded`);
      }
      cells[r][c] = "marked";
      changed = true;
    }
  }

  return changed;
}

export default function compositeRegions(
  board: Board,
  cells: CellState[][],
  debug: boolean = false,
): boolean {
  const size = board.grid.length;
  if (size === 0) return false;

  const regions = buildRegions(board.grid);
  const regionMetas = buildRegionMetas(board, cells, regions);
  const adjacency = buildAdjacencyGraph(board, regionMetas);

  // Collect all composites
  const composites: Composite[] = [
    ...findUndercountingComposites(board, cells, regionMetas, "row"),
    ...findUndercountingComposites(board, cells, regionMetas, "col"),
    ...findOvercountingComposites(board, cells, regionMetas, "row"),
    ...findOvercountingComposites(board, cells, regionMetas, "col"),
    ...findCombinationComposites(board, cells, regionMetas, adjacency),
  ];

  if (debug) {
    const underRow = findUndercountingComposites(
      board,
      cells,
      regionMetas,
      "row",
    ).length;
    const underCol = findUndercountingComposites(
      board,
      cells,
      regionMetas,
      "col",
    ).length;
    const overRow = findOvercountingComposites(
      board,
      cells,
      regionMetas,
      "row",
    ).length;
    const overCol = findOvercountingComposites(
      board,
      cells,
      regionMetas,
      "col",
    ).length;
    const combos = findCombinationComposites(
      board,
      cells,
      regionMetas,
      adjacency,
    ).length;
    console.log(
      `[compositeRegions] Found ${composites.length} composites: underRow=${underRow}, underCol=${underCol}, overRow=${overRow}, overCol=${overCol}, combos=${combos}`,
    );
  }

  if (composites.length === 0) return false;

  // Deduplicate by unknown cell signature
  const seen = new Set<string>();

  for (const composite of composites) {
    // Refresh signature based on current unknowns
    const currentUnknowns = composite.unknownCells.filter(
      ([r, c]) => cells[r][c] === "unknown",
    );
    const sig = currentUnknowns.map(coordKey).sort().join("|");

    if (sig === "" || seen.has(sig)) continue;
    seen.add(sig);

    if (analyzeComposite(composite, board, cells, size, debug)) {
      return true;
    }
  }

  if (debug) {
    console.log(`[compositeRegions] No composites triggered`);
  }

  return false;
}
