# Star Battle Codebase: Research & Technical Report

## Overview

This is a production rule-based **Star Battle puzzle solver and generator** written in TypeScript. Star Battle (also called "Two Not Touch" in its 2-star variant) is a constraint satisfaction puzzle where a player must place exactly N stars per row, column, and region on an N×N grid, with the rule that no two stars may be adjacent — horizontally, vertically, or diagonally.

The system's core premise is that it never guesses or backtracks. Every deduction is a logical inference a human could perform. It achieves a **999/1000 solve rate** on 1000 KrazyDad benchmark puzzles in 21.19 seconds total.

The engine is built to power a mobile puzzle app. Puzzles are pre-generated, validated, rated for difficulty, and stored in Cloudflare R2. Hints run client-side using the same solver engine.

---

## Data Types (`src/helpers/types.ts`)

The type system is minimal and precise.

```
CellState = "unknown" | "star" | "marked"
Board     = { grid: number[][], stars: number }
```

A `Board` contains a 2D grid of integer region IDs (0-indexed), and `stars` — the per-container quota. The grid is always square: `size = grid.length`, and there are exactly `size` distinct regions.

```
SolverResult = { cells: CellState[][], cycles: number, maxLevel: number }
Solution     = SolverResult & { board: Board, seed: number }
Puzzle       = Solution & { difficulty: number }
```

`cycles` counts how many full rule passes the solver took. `maxLevel` tracks the hardest rule level that fired during solve — both feed into difficulty scoring.

```
Coord = [number, number]           // [row, col]
Tile  = { cells: Coord[], coveredCells: Coord[] }
```

A `Tile` represents a 2×2 square. `cells` are all 4 corners; `coveredCells` are only those that fall inside the container being analyzed. This distinction matters: tiles can extend outside a region, and the overhang is semantically different from the interior.

```
TilingResult = { capacity: number, tilings: Tile[][], forcedCells: Coord[] }
```

`capacity` is the minimum number of tiles needed to cover all unknown cells in a container — which equals the upper bound on stars that can be placed there. `tilings` is the list of all minimal tile arrangements. `forcedCells` are cells that appear as a solo-covered cell in every minimal tiling (i.e., must be stars).

---

## Board Analysis (`src/helpers/boardAnalysis.ts`)

### BoardStructure

Built once from the static `Board`. Contains:
- `cellRegionIndex: Int32Array` — flat array indexed by `row * size + col`, returns region ID in O(1)
- `regions: Map<number, { coords: Coord[] }>` — all cells per region

### BoardAnalysis

Mutable state maintained throughout the solve. Built from `BoardStructure` plus the current cell grid:

```
RegionMeta = {
  unknownCoords: Coord[]   // remaining unknown cells in this region
  starsPlaced: number
  starsNeeded: number
  unknownRows: Set<number> // rows that still have unknowns in this region
  unknownCols: Set<number>
}

BoardState = {
  size, stars
  regions: Map<number, RegionMeta>
  rowStars: number[]       // stars placed per row
  colStars: number[]       // stars placed per column
  rowUnknowns: Coord[][]   // unknown cells per row
  colUnknowns: Coord[][]   // unknown cells per column
}
```

`BoardAnalysis` extends `BoardState` with three methods:

**`getTiling(coords: Coord[]): TilingResult`**
Caches tiling results by sorted cell key. The cache key is `coords.map(([r,c]) => r*size+c).sort().join("|")`. The tiling cache persists across the entire solve — once computed for a cell set, it is never recomputed even if other cells change, because tiling is a property of the cell layout, not the cell states.

**`getCountingFlow(axis: "row"|"col"): CountingFlowResult`**
Computes and caches the Dinic's max-flow result for the bipartite counting network. Cache is per-axis and is cleared on every `applyDelta` call (since board state changes invalidate the flow).

**`applyDelta(cells: CellState[][], changed: Coord[]): void`**
Incrementally updates all tracking after a rule fires. For each changed cell:
- If it became a star: increment `rowStars[r]`, `colStars[c]`, `region.starsPlaced`, decrement `region.starsNeeded`
- Remove from `rowUnknowns[r]`, `colUnknowns[c]`, `region.unknownCoords`
- Update `region.unknownRows` and `region.unknownCols` (re-scan if the row/col has no more unknowns in that region)
- Clear `flowCache`

This incremental approach avoids rebuilding the full analysis on every step.

---

## The Solver (`src/solver.ts`)

### Validation

`isValidBoard` checks that the board has exactly `size` distinct regions, each with at least `minRegionSize = stars * 2 - 1` cells. This minimum is enforced because a region with too few cells can't accommodate a valid non-adjacent star arrangement.

### Status Check

`getSolveStatus` checks three conditions in order:
1. **Invalid**: any star has a star neighbor, any row/col/region has fewer remaining unknowns + placed stars than quota
2. **Solved**: every row, column, and region has exactly `stars` placed stars
3. **Valid**: neither of the above (in progress)

### Main Loop

```
while (true):
  cycles++
  status = getSolveStatus(cells, analysis)
  if solved → return { cells, cycles, maxLevel }
  if invalid → return null

  for rule in allRules (L1 → L11):
    if rule(board, cells, analysis):
      applied = rule
      break

  if !applied → return null  // stuck

  maxLevel = max(maxLevel, applied.level)
  changed = diffCells(cells, snapshot)
  analysis.applyDelta(cells, changed)
```

`diffCells` uses a `Uint8Array` snapshot (0=unknown, 1=star, 2=marked) to detect changes efficiently. The solver re-enters from rule L1 after every single rule firing — it never batches multiple deductions within one pass. This ensures maximum constraint propagation before escalating to harder rules.

The `onStep` callback enables step-by-step tracing (used in CLI `--trace` mode) and rule-usage profiling (used in `--file` benchmark mode).

---

## Rule System (`src/rules/index.ts`)

42 rule entries across 11 difficulty levels, cycled in strict priority order. Each `RuleEntry` has `{ rule, level, name }`.

### Level 1 — Star Neighbors (Direct × Inference)

**`starNeighbors`**: Scans all cells. When a star is found, marks all 8 diagonal/orthogonal neighbors that are still unknown. The simplest rule — a pure consequence of the no-adjacency constraint.

### Level 2 — Forced Placements (Direct × Inference)

**`forcedPlacement("row"|"col")`** and **`forcedRegion`**: For each container, if `unknownCount == starsNeeded`, all unknowns must be stars. Places one star at a time (returns after the first placement), letting L1 cascade neighbor marks before the next forced placement. Critically, the rule does NOT batch all containers — a star placement changes neighboring containers, so re-entering from L1 is correct.

### Level 3 — Trivial Marks (Direct × Inference)

**`trivialMarks("row"|"col")`** and **`trivialRegion`**: For each container, if `starsPlaced == stars`, all remaining unknowns are marked. Symmetric to L2 but produces marks instead of placements.

### Level 4 — Tiling Enumeration (Tiling × Enumeration)

The first rule level requiring non-trivial reasoning. Uses the tiling system.

**`tilingForcedLine("row"|"col")`**: For each row/column, if tiling capacity == starsNeeded, the arrangement is tight. Places the first forced cell (a cell that appears solo-covered in every minimal tiling).

**`tilingForcedRegion`**: Same logic applied per region.

**`tilingAdjacencyMarks`**: For each region where capacity == starsNeeded, enumerates all valid star assignments across all minimal tilings. Any unknown cell that never appears as a star in any valid assignment is marked.

**`tilingOverhangMarks`**: For each region where capacity == starsNeeded and active tilings have overhang (tiles extending outside the region), finds cells outside the region that are covered by tiles in every active tiling. Those external cells are marked — they cannot be stars because they'd be inside a tile that already has a star inside the region.

### Level 5 — Counting Enumeration (Counting × Enumeration)

**`countingMark("row"|"col")`**: Runs the counting flow analysis. Finds "tight sets" — groups of lines where total star demand exactly equals total region supply. For each tight set, if a region's maximum contribution to those lines equals its `starsNeeded`, then ALL remaining stars must go inside the tight set's lines, so cells outside those lines are marked.

### Level 6 — Tiling Pairs (Tiling × Enumeration)

**`squeezePairLoop`** is the shared helper (in `tilingPairs.ts`). It iterates all adjacent line pairs (i, i+1). For a pair needing `stars * 2` total stars, it collects all unknowns in both lines and runs tiling on the combined cell set. If `capacity == starsNeeded`, the pair is tight.

**`tilingPairForced`**: Places forced cells from tight pairs.

**`tilingPairAdjacency`**: Marks cells from tight pairs that never appear as stars in any valid assignment.

**`tilingPairOverhang`**: Marks overhang cells from tight pairs.

### Level 7 — Tiling Counting (Tiling + Counting × Enumeration)

**`tilingCountingLoop`** (in `tilingCounting.ts`) is the shared helper. For each group of lines (size 1 to `maxGroup`), for each region intersecting those lines, computes:

```
capacityOutside = tiling capacity of region's unknowns NOT in the line group
minContrib = max(0, starsNeeded - capacityOutside)
```

If `sum(minContrib) == totalNeeded` for the line group, it's a tight constraint.

**`tilingCountingMark("row"|"col", minGroup=1, maxGroup=1)`**: When tight, marks cells in the line group for regions where `minContrib == 0` (these regions contribute zero stars to the line group, so their cells inside it can't be stars).

**`tilingCountingForced`**: When tight, for regions where the outside cells have exactly `capacityOutside` remaining cells equal to their forced count, those outside cells must be stars.

**Group Tiling Counting**: Same rules but with `minGroup=2, maxGroup=4`, checking groups of 2–4 lines. This subsumes single-line tiling counting logically, but they are separated for execution order: single-line fires first (cheaper), groups fire only when needed.

### Level 8 — Direct Hypotheticals (Direct × Hypothetical)

These rules assume a star at each unknown cell in turn (no propagation), mark its 8 neighbors, then check for immediate violations.

**`hypotheticalCount("row"|"col")`**: If any row (star's row or adjacent rows) or column runs out of unknowns to satisfy its quota after the assumption, contradiction → mark the cell.

**`hypotheticalRegionCount`**: If any region loses enough unknowns to become impossible.

All three use `hypotheticalLoop(..., propagate=false, check)` where `check` inspects `state.violation`.

### Level 9 — Tiling Hypotheticals (Tiling × Hypothetical)

**`hypotheticalCapacity("row"|"col")`** and **`hypotheticalRegionCapacity`**: Same single-assumption approach, but the check additionally runs tiling on the remaining unknowns of affected containers. If tiling capacity < starsNeeded → contradiction.

### Level 10 — Counting Hypotheticals (Counting × Hypothetical)

**`hypotheticalCounting("row"|"col")`**: Uses `propagate=true`, meaning `propagateHypothetical` runs first (cascading forced placements). Then calls `propagatedCountingViolation` — builds a counting flow network using the hypothetical's propagated state and checks if max-flow < total demand. This detects violations that only appear at the counting level, not in simple cell counts.

### Level 11 — Propagated Hypotheticals (All × Hypothetical)

Combines full propagation with all three violation types:

**`propagatedCount`**: Full propagation + check for row/col count violation (or adjacency).

**`propagatedRegionCount`**: Full propagation + region count violation.

**`propagatedCapacity`**: Full propagation + row/col tiling capacity violation.

**`propagatedRegionCapacity`**: Full propagation + region tiling capacity violation.

**`propagatedCounting`**: Full propagation + counting flow violation.

---

## Tiling System

### `computeTiling` (`src/helpers/tiling.ts`)

Given a list of unknown cells in a container, finds all minimal 2×2 tile covers using DLX:

1. **Generate candidate tiles**: For each cell, try all 4 possible 2×2 anchors (offsets (-1,-1), (-1,0), (0,-1), (0,0) relative to the cell). Deduplicate anchors. Each tile has `cells` (all 4 corners) and `coveredCells` (those inside the target set).

2. **Build DLX matrix**:
   - Primary columns: one per target cell (must be covered exactly once)
   - Secondary columns: one per external cell touched by any tile (can be covered but not required)
   - Rows: one per candidate tile

3. **Solve**: Find all exact covers. The DLX solver tracks `minLen` and prunes any solution path that exceeds it, so it returns only minimal solutions (smallest tile count).

4. **Post-process**:
   - `capacity = minLen` (number of tiles in minimal solutions)
   - `tilings = minimalSolutions.map(sol => sol.map(i => tiles[i]))`
   - `forcedCells = cells where every minimal tiling covers them solo` — these cells are in a tile by themselves in every tiling arrangement, meaning they must each contribute exactly one star

**Edge case**: If no exact cover exists (e.g., L-shaped regions where tiles can't partition cleanly), returns `capacity = cells.length` (a safe upper bound) and empty tilings/forcedCells. This prevents false tight-constraint deductions.

**Single-cell shortcut**: If `cells.length === 1`, returns `capacity=1, forcedCells=[cells[0]]` immediately.

### `tilingEnumeration.ts`

Three exported functions used by tiling rules:

**`enumerateStarAssignments(tiling, insideSet, cells, size)`**: Given one specific tiling (a set of tiles), enumerates all valid star placements within it. Fixed stars (already placed) are carried forward. For unfixed tiles, each covered unknown cell inside the region is a candidate. Builds assignments by cartesian product, filtering out adjacent pairs. Returns all valid assignments.

**`collectValidStarCells(allTilings, insideSet, cells, size)`**: Unions the results of `enumerateStarAssignments` across all minimal tilings. Returns the set of all cells that could ever be a star in any valid arrangement. Cells NOT in this set can be safely marked.

**`findForcedOverhangCells(activeTilings, insideSet, size)`**: For each tiling, collects the set of external cells (outside the region) touched by tiles. Returns the intersection across all active tilings — cells that every tiling's tiles touch externally. These cells are always adjacent to a tile's interior star, so they cannot be stars themselves.

**`filterActiveTilings(allTilings, insideSet, cells, size)`**: Filters to tilings where at least one tile touches an external unknown cell. Only these tilings can produce overhang marks.

---

## Counting System (`src/helpers/counting.ts`)

### Flow Network Construction

The bipartite counting network has `2 + size + R` nodes:
- Node 0: source
- Nodes 1..size: one per line (row or column)
- Nodes size+1..size+R: one per region (only active regions, i.e., `starsNeeded > 0`)
- Node size+R+1: sink

Edges:
- `source → line_i`: capacity = `stars - rowStars[i]` (stars still needed in that line)
- `line_i → region_j`: capacity = `region_j.unknownCoords` where `axis_idx == i` (unknowns in the intersection)
- `region_j → sink`: capacity = `region_j.starsNeeded`

### Dinic's Max-Flow

Standard Dinic's: BFS builds level graph, DFS pushes blocking flow. Repeats until no augmenting path. O(V²E) worst case, effectively linear for the small sparse graphs used here.

### Violation Check (`hasCountingViolation`)

Quick pre-check: if any region has `starsNeeded > totalUnknowns`, immediate violation.

Otherwise: if `maxFlow < totalDemand`, violation. Used by L9 hypothetical rules to detect counting-level contradictions.

### Tight Set Extraction (`computeCountingFlow` + `extractTightSets`)

After finding max flow, extracts tight sets using a **Dulmage-Mendelsohn decomposition** via iterative Tarjan's SCC on the residual graph.

**Iterative Tarjan's**: Avoids recursion stack overflows. Uses an explicit call stack with `{ node, edgeIdx, isRoot }` frames. Produces SCC IDs in reverse topological order (SCC 0 is last in topological order).

**Condensation Walk**: SCCs are walked in topological order (from `sccCount-1` down to 0, skipping source/sink SCCs). Accumulates:
- `cumDemand`: sum of `axisNeeded[line]` for all lines in SCCs so far
- `cumSupply`: sum of `starsNeeded[region]` for all regions in SCCs so far

When `cumDemand == cumSupply > 0`, a tight set boundary is found. The lines and regions accumulated since the last boundary form a tight set.

**TightSetInfo**:
```
{
  mask: number              // bitmask of line indices in this tight set
  regionContribs: [{
    maxContrib: number      // min(starsNeeded, unknowns inside the tight lines)
    starsNeeded: number
    unknownCoords: Coord[]
  }]
}
```

When `maxContrib == starsNeeded`, the region must place ALL its remaining stars inside the tight lines, so cells outside those lines can be marked (L5 counting mark rule).

---

## Hypotheticals System (`src/helpers/hypotheticals.ts`)

### `propagateHypothetical(board, cells, row, col, analysis): PropagatedState`

Assumes a star at `(row, col)`. Runs deterministic consequences in a loop:

1. Initialize `starKeys = {key(row,col)}`, `marked = 8-neighbors + self`
2. Call `scanBoard` — sweeps all rows, columns, and regions under the hypothetical state
3. `scanBoard` computes per-container star count (real + hypothetical) and unknown count (real unknowns not in `marked`)
   - `needed < 0` → violation
   - `needed == 0` → mark remaining unknowns (trivial)
   - `unknowns < needed` → violation
   - `unknowns == needed` → all unknowns are forced stars
4. For each forced cell: check adjacency against existing hypothetical stars (adjacency violation), then add to `starKeys`, add all 8 neighbors to `marked`
5. Repeat until stable or violation found

Max rounds is `size * stars` — a theoretical upper bound on how many cascading placements can occur.

**`PropagatedState`**: `{ violation: null|"adjacency"|"row"|"col"|"region", starKeys, marked }`

### `hypotheticalLoop(board, cells, analysis, propagate, check): boolean`

Outer loop over all unknown cells. For each:
- If `propagate=false`: creates a shallow `PropagatedState` with just the assumed star + neighbor marks
- If `propagate=true`: calls `propagateHypothetical` for full cascaded state

Passes state to `check(row, col, state)`. If check returns true, marks the cell and sets `changed = true`. Returns `changed`.

### `propagatedCountingViolation(board, cells, starKeys, marked, analysis, axis): boolean`

Builds a counting flow network incorporating hypothetical state:
- Adjusts `axisNeeded[i]` by subtracting hypothetical stars in that line
- Adjusts each region's `starsNeeded` by subtracting hypothetical stars in that region
- Excludes from unknowns any cells in `starKeys` or `marked`
- Runs `hasCountingViolation` on this adjusted network

---

## DLX Implementation (`src/helpers/dlx.ts`)

Classic Dancing Links (Algorithm X by Knuth) for exact cover. Node types:

```
DLXNode     = { left, right, up, down, column, rowIndex }
ColumnHeader extends DLXNode { size: number, isPrimary: boolean }
RootHeader  = { left: ColumnHeader|RootHeader, right: ColumnHeader|RootHeader }
```

Primary columns are in the root's circular list; secondary columns have `left = right = self` (disconnected from the header list but still linked in rows).

**Cover**: Removes a column from the header list and removes all rows containing that column from other columns' lists.

**Uncover**: Exact reverse of cover (must be done in reverse order).

**Search heuristic**: Always branch on the primary column with minimum `size`. This minimizes the branching factor.

**Minimal solution optimization**: Tracks `minLen = { value: Infinity }`. Prunes any branch where `solution.length >= minLen.value`. When a solution is found shorter than the current minimum, clears `solutions` and resets `minLen`. This means only minimal-size exact covers are returned.

`dlxSolve(numPrimary, numSecondary, rows): number[][]` returns arrays of row indices (tile indices in the tiling context).

---

## Generator (`src/generator.ts`)

### Input validation

- `size`: 4–25 (integer)
- `stars`: 1–6 (integer), must be ≤ `size / 2`
- `minRegionSize = stars * 2 - 1`

### RNG

Linear congruential generator seeded with a 32-bit integer:
```
s = (s * 1103515245 + 12345) | 0
rng = () => (s >>> 0) / 0x100000000
```

### Algorithm

1. **Place seeds**: Randomly place `size` seed cells (one per region), assigning unique region IDs 0..size-1.

2. **Grow balanced**: While any region has fewer than `minRegionSize` cells:
   - Find all regions needing growth with non-empty frontiers
   - Pick one at random, pick a random frontier cell, assign it to that region
   - Add the newly assigned cell's empty neighbors to the region's frontier
   - Balanced: only regions below minimum are eligible, so growth is equalized

3. **Fill remaining**: Scan all unfilled cells. For each, if it has filled neighbors, assign it to one at random. Repeat until no unfilled cells remain. Max iterations = `size * size * 100` before throwing `GeneratorError("generator_stuck")`.

The generator retries up to 100,000 attempts (default), each with a different seed derived from `(baseSeed + attempt) | 0` where `baseSeed = Date.now() ^ (random * 0x100000000)`.

---

## Sieve (`src/sieve.ts`)

Coordinates generation and solving in a loop:

```
while puzzles.length < count && attempts < maxAttempts:
  generate layout
  solve layout
  if solved: compute difficulty, check difficulty filter, push to puzzles
  else: solverFailed++
```

Default parameters: `size=10, stars=2, count=1`. Max attempts: 100,000,000.

Difficulty filtering via `minDifficulty` and `maxDifficulty` (both optional). The `onProgress` callback reports `{ attempts, solved, solverFailed }` for live CLI output.

---

## Difficulty Rating (`src/helpers/difficulty.ts`)

```
raw = maxLevel * 4 + cycles / 4
t = (raw - 20) / (60 - 20)
difficulty = clamp(round(t * 99 + 1), 1, 100)
```

- `RAW_MIN = 20`, `RAW_MAX = 60` — empirically calibrated on 1000 KrazyDad puzzles
- `maxLevel` is weighted 4× because deeper rule levels represent qualitatively harder reasoning
- `cycles` contributes 1/4 per cycle — more passes means more iterative refinement needed
- Output is a 1–100 integer; the formula normalizes the [20,60] raw range to [1,100]

Puzzles solved with only L1–L3 rules (~raw=20) get difficulty 1. Puzzles requiring L11 propagated hypotheticals with many cycles (~raw=60) get difficulty 100.

---

## Notation (`src/helpers/notation.ts`)

### SBN Format

Full puzzle string: `{size}x{stars}.{layout}.s{seed}d{difficulty}l{maxLevel}c{cycles}v1`

- Header: `NxM` where N=size, M=stars per container
- Layout: `N*N` uppercase letters (A–Z), left-to-right, top-to-bottom, mapping each cell to its region
- Metadata segment (optional): key-value pairs `s{seed}d{difficulty}l{maxLevel}c{cycles}v1`

**Example**: `10x2.AAAABBBBBCDDDDB....c245v1`

**Encoding**: `REGION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"` maps region IDs (0–25) to letters.

**Decoding**: Validates size (1–26), star count, layout length, all letters are valid region letters, and exactly `size` distinct regions appear.

**Metadata parsing**: Regex `/([sdlcv])(\d+)/g` extracts all key-value pairs. Unrecognized keys are silently ignored. Missing keys leave metadata fields undefined.

---

## CLI (`src/cli.ts`)

Three modes:

**Stdin solve** (pipe grid): Reads a space-separated region letter grid, parses it, runs `traceBoard` which solves with step-by-step output. Highlights changed cells in yellow using ANSI escape codes.

**File benchmark** (`--file`): Reads a `.sbn` file line by line. Tracks per-rule firing counts and puzzle coverage. Computes difficulty distribution. Reports solve rate. `--verbose` shows per-puzzle results. `--unsolved` outputs only failed puzzles (useful for piping back to re-process). `--trace` shows full step-by-step for each puzzle.

**Generate** (default): Calls `sieve(...)` with the given parameters, prints encoded puzzle strings. Live progress counter via `\r` overwrite.

CLI arguments are parsed as `--key value` pairs. Boolean flags (`--verbose`, `--trace`) are set to `"true"` string.

Cell display symbols: `.` (unknown), `X` (marked), `★` (star U+2605).

---

## Performance Characteristics

### Benchmark Results (1000 KrazyDad 10×10, 2-star puzzles)

| Level | Rules | Firings | Time |
|-------|-------|---------|------|
| L1 | Star Neighbors | 12,708 | 0.17s |
| L2 | Forced (rows/cols/regions) | 12,084 | 0.03s |
| L3 | Trivial (rows/cols/regions) | 4,407 | 0.03s |
| L4 | Tiling Enumeration (5 rules) | 9,624 | 2.63s |
| L5 | Counting Marks (2 rules) | 3,924 | 0.46s |
| L6 | Tiling Pairs (6 rules) | 2,131 | 2.00s |
| L7 | Tiling Counting (6 rules) | 1,119 | 10.80s |
| L8 | Direct Hypotheticals (3 rules) | 833 | 0.66s |
| L9 | Tiling Hypotheticals (3 rules) | 505 | 0.59s |
| L10 | Counting Hypotheticals (2 rules) | 237 | 0.32s |
| L11 | Propagated Hypotheticals (8 rules) | 25 | 0.07s |

**Total**: 21.19s for 1000 puzzles, 999/1000 solved.

### Hotspots

**L7 Group Tiling Counting** is the dominant cost: 5.04s (rows) + 4.35s (cols) = 9.39s total for only 440 firings across 18% of puzzles. This is because it iterates `C(size, k)` combinations for `k` in `[2,4]` and runs tiling per combination, multiplied across all regions touching each group.

**L4 Tiling Forced** is second: ~2.58s for ~1423 firings across 51%/53% of puzzles. DLX runs are the cost here.

### Caching Strategy

- **Tiling cache**: Persistent across entire solve, keyed by sorted cell index list. Once a tiling is computed for a set of cells, it is reused even if those cells are later marked (the computation stands because tiling is a pure function of the cell set geometry, not the current cell states).
- **Flow cache**: Per-axis, cleared on every `applyDelta`. Board state changes invalidate the counting network entirely.

### Memory Layout

- `cellRegionIndex: Int32Array(size*size)` — O(1) region lookup, cache-friendly
- `rowUnknowns[r]: Coord[]` — splice-based removal on `applyDelta`
- `region.unknownCoords: Coord[]` — same

The incremental delta design means the full board state is never rebuilt — only the affected cells are touched.

---

## Architecture for Mobile App

Per `docs/specs/GEN-architecture.md`, the engine feeds a React Native mobile app:

| Concern | Technology |
|---------|-----------|
| API / Auth / Sync | Cloudflare Workers |
| Database (user state) | Cloudflare D1 (SQLite) |
| Puzzle storage | Cloudflare R2 |
| Purchases | RevenueCat |
| Client storage | MMKV (React Native) |
| Hints (client-side) | This solver engine + explanation templates |

**Puzzle delivery**: Free packs downloaded on first launch; paid packs on purchase (gated by RevenueCat webhook → D1). Pack sizes are ~9KB, dailies ~300 bytes — everything is cached offline.

**Hints**: Run entirely client-side using the solver with `onStep` callbacks. No server endpoint needed. Hint explanations are template strings mapped from rule names.

**Puzzle versioning**: SBN strings encode seed, difficulty, maxLevel, cycles, and format version. Packs use a version number for cache invalidation.

---

## Key Design Decisions

### No Backtracking

The solver commits to deductions — once a cell is marked or a star is placed, it never reverses. L8–L11 hypotheticals do single-depth bifurcation (assume one cell, check contradiction, mark if yes) but do NOT recursively branch. This is a deliberate human-aligned constraint: the solver emulates what a human can reason about, not what a computer can brute-force.

### Rule Re-entry on Every Firing

After any rule fires (even a single cell mark), the solver restarts from L1. This is correct because:
- A star placement triggers L1 (neighbor marks) → those marks may enable L2 (forced placements) → those stars may enable more L1 marks → cascade
- Any attempt to batch deductions or continue from the same rule level risks missing cascades

### Minimal Tilings Only

The DLX solver prunes to only minimal-size solutions (fewest tiles). This is correct for capacity bounds: the minimum number of tiles needed is the maximum number of stars possible (since each tile holds at most one star). Non-minimal solutions are never semantically useful.

### Tiling Cache Persistence

Tiling results are cached even after cells change. This is valid because `computeTiling` is a pure function of the input cell set — the same set of coordinates always produces the same tiling result regardless of what other cells have been marked or starred. Rules always call `getTiling` with current unknown coordinates, so they always pass the right input.

### Conservative Capacity on No-Cover

When DLX finds no exact cover (rare, for irregular shapes), `computeTiling` returns `capacity = cells.length` — a safe upper bound that can never trigger a false tight constraint. This prevents incorrect deductions at the cost of missing some tiling-based opportunities on pathological shapes.

### Propagated Hypotheticals Subsume All Others

L11 propagated hypotheticals logically subsume L8–L10: full propagation + all violation types. They are kept separate in the rule list for performance: L8 (cheapest) fires first and handles the easy cases; L11 (most expensive) only fires when all simpler hypotheticals are exhausted.

---

## Source Reference Map

| File | Purpose |
|------|---------|
| `src/helpers/types.ts` | All shared types |
| `src/helpers/boardAnalysis.ts` | Mutable solving state + tiling/counting cache |
| `src/helpers/tiling.ts` | DLX-based 2×2 tile cover computation |
| `src/helpers/tilingEnumeration.ts` | Star assignment enumeration within tilings |
| `src/helpers/tilingPairs.ts` | Shared loop for adjacent-line-pair tiling |
| `src/helpers/tilingCounting.ts` | Shared loop for tiling+counting hybrid |
| `src/helpers/counting.ts` | Dinic's max-flow + Dulmage-Mendelsohn decomposition |
| `src/helpers/hypotheticals.ts` | Assumption propagation + violation checks |
| `src/helpers/dlx.ts` | Dancing Links exact cover solver |
| `src/helpers/neighbors.ts` | `cellKey`, `neighbors`, adjacency, marked cell set |
| `src/helpers/difficulty.ts` | 1–100 difficulty formula |
| `src/helpers/notation.ts` | SBN encode/decode |
| `src/solver.ts` | Main solve loop + status check |
| `src/generator.ts` | Randomized region layout generation |
| `src/sieve.ts` | Generate→solve→filter→rate pipeline |
| `src/cli.ts` | CLI entry point (generate, solve, benchmark) |
| `src/rules/index.ts` | All 42 rule entries in priority order |
| `src/rules/01-starNeighbors/` | L1 |
| `src/rules/02-forcedPlacements/` | L2 |
| `src/rules/03-trivialMarks/` | L3 |
| `src/rules/04-tilingEnumeration/` | L4 |
| `src/rules/05-countingEnumeration/` | L5 |
| `src/rules/06-tilingPairs/` | L6 |
| `src/rules/07-tilingCounting/` | L7 |
| `src/rules/08-directHypotheticals/` | L8 |
| `src/rules/09-tilingHypotheticals/` | L9 |
| `src/rules/10-countingHypotheticals/` | L10 |
| `src/rules/11-propagatedHypotheticals/` | L11 |
