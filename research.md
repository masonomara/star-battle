# Star Battle — Source Code Research Report

Deep read of `src/` as of May 2026. Purpose: map the system completely before a refactor targeting clarity, zero bloat, and full maintainability.

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [Pipeline Overview](#2-pipeline-overview)
3. [File-by-File Reference](#3-file-by-file-reference)
4. [Interdependency Map](#4-interdependency-map)
5. [The Rule System in Depth](#5-the-rule-system-in-depth)
6. [What Is Working Well](#6-what-is-working-well)
7. [Code Smells and Problems](#7-code-smells-and-problems)
8. [Refactor Roadmap](#8-refactor-roadmap)

---

## 1. What This System Does

A **Star Battle puzzle generator and solver** written in TypeScript. Star Battle is a constraint puzzle where a grid is divided into N regions, and exactly N stars must be placed such that:

- Every row contains exactly N stars
- Every column contains exactly N stars
- Every region contains exactly N stars
- No two stars may touch (including diagonally)

The system generates random boards, attempts to solve them using human-emulatable logic rules, and filters down to valid puzzles. It does not use backtracking — if the rule system gets stuck, the puzzle is rejected.

---

## 2. Pipeline Overview

Two distinct production paths, not one:

**Goal 1 — Build a puzzle library** (generate and filter):

```
generate()           →  Board (grid + stars)
     ↓
solve()              →  SolverResult | null  (null = stuck)
     ↓
computeDifficulty()  →  1–100 integer
     ↓
sieve()              →  Puzzle[]  (wrapper orchestrating the above)
     ↓
cli.ts               →  stdout / serialized library
```

**Goal 2 — Solve a user-provided puzzle** (parse and solve):

```
decodePuzzleString() / parseGridFromStdin()  →  Board
     ↓
solve()              →  SolverResult | null
     ↓
cli.ts               →  stdout  (step trace or benchmark stats)
```

`sieve()` is only involved in goal 1. Goal 2 calls `solve()` directly — `generate()` and `sieve()` are never touched.

### `Board`

The fundamental puzzle definition: a 2D grid of region IDs (integers 0..N-1), plus the star count per container. For a 10×10 2-star puzzle, `grid` is 10×10 with integers 0–9.

### `SolverResult`

What the solver returns when it succeeds: the final cell states, how many rule-application cycles it took, and the highest rule level used. These feed directly into difficulty scoring.

---

## 3. File-by-File Reference

### Entry Points

#### `cli.ts`

The command-line interface. Handles four modes:

1. **Stdin pipe** ✅ production: parse a text grid, trace the solve step by step (goal 2)
2. **File mode** (`--file`) ❌ debug only: batch-process a `.sbn` puzzle file, emit rule usage stats and timing — a developer benchmarking tool, not a user feature
3. **Generate mode** (default) ✅ production: run `sieve()` with options and print results (goal 1)
4. **Trace with seed** (`--trace --seed N`) ❌ debug only: solves one layout deterministically and shows each step — developer inspection tool

Key helpers defined locally:

- `printBoard` ✅ production
- `printCellStateWithDiff` ✅ production (used by stdin solve trace)
- `traceBoard` ✅ production (goal 2 user path)
- `benchmark` ❌ debug only — remove for alpha
- `parseGridFromStdin` ✅ production
- `parseArgs` ✅ production
- `readStdin` ✅ production

Notable: `const LETTERS = REGION_LETTERS` — immediately aliases the imported constant for no reason.

---

#### `sieve.ts`

Orchestrates the generate → solve → filter loop. This is the **puzzle library production path** — you run it once, collect `Puzzle[]`, serialize to disk. It is not involved in solving user-provided puzzles (that path calls `solve()` directly).

Has two internal modes, but only one serves production:

- **Non-deterministic** (default) ✅ production: calls `generate()` which retries generator failures internally. Sieve only sees boards that successfully laid out. This is the correct mode for building a puzzle library.
- **Deterministic** (`seed` option) ❌ debug only — remove for alpha: calls `layout()` with incrementing seeds. Surfaces all failure types in `stats.failures`. Exists so developers can reproduce a specific puzzle or measure failure rates. Has no role in either production goal.

The two modes have silently different semantics: `maxAttempts` counts raw `layout()` calls in deterministic mode but counts successful board attempts in non-deterministic mode. Stats from the two modes are not comparable.

`SieveOptions` fields to remove with the deterministic mode: `seed`. Everything else (`size`, `stars`, `count`, `maxAttempts`, `minDifficulty`, `maxDifficulty`, `onProgress`) is production.

Accepts difficulty bounds (`minDifficulty`, `maxDifficulty`) and an `onProgress` callback. Returns an array of `Puzzle` objects.

---

#### `generator.ts`

Generates a random `Board` from a seed. Two exported functions:

- `generate(size, stars, options)` ✅ production — wraps `layoutWithSeed` in a retry loop using a base seed derived from `Date.now() ^ random`. Returns on first success.
- `layout(size, stars, seed)` ❌ debug only — remove for alpha. Deterministic, single attempt. Only exists to support the deterministic sieve mode and `--trace --seed N` in the CLI — both debug paths. Once those are removed, `layout()` has no callers and can be deleted. The real implementation is the private `layoutWithSeed`.

**Algorithm:**

1. Place N random seed cells (one per region)
2. Grow each region to `minRegionSize = stars * 2 - 1` using `growRegionsBalanced` — balanced frontier expansion
3. Fill remaining empty cells using `fillRemaining` — assigns each cell to a random adjacent region

The `rng` is a [LCG](https://en.wikipedia.org/wiki/Linear_congruential_generator): `s = (Math.imul(s, 1103515245) + 12345) | 0`.

---

#### `solver.ts`

The solver main loop. Exported: `solve()`, `RULE_METADATA`, types `StepInfo` and `SolveOptions`.

**Flow:**

1. `isValidBoard` — validates the board has the right region count, min region sizes, and enough tiling capacity in every row/col/region. (Runs DLX on every container — expensive but happens once.)
2. Initializes cells as all `"unknown"`
3. Loops:
   - `buildBoardAnalysis` from current cells
   - `checkProgress` — returns `"solved"`, `"valid"`, or `"invalid"`
   - Iterates `allRules` in order; applies the first one that fires (`fired === true`)
   - If no rule fires: return `null` (stuck)
4. On each rule application, optionally calls `onStep` callback and accumulates timing.

The `tilingCache` is a `Map<string, TilingResult>` that persists across cycles. Cache key is sorted cell indices joined by `|`. This is the primary performance optimization — tilings for the same cell set are never recomputed.

---

### Helpers

#### `helpers/types.ts`

All shared types. Clean and small. Notably:

- `CellState`: `"unknown" | "star" | "marked"`
- `Board`: `{ grid: number[][], stars: number }`
- `SolverResult`: `{ cells, cycles, maxLevel }`
- `Solution = SolverResult & { board, seed }`
- `Puzzle = Solution & { difficulty }`
- `Coord`: `[number, number]`
- `Tile`: `{ cells: Coord[], coveredCells: Coord[] }` — a 2×2 tile candidate and which cells from the target set it covers
- `TilingResult`: `{ capacity, tilings, forcedCells }` — the DLX output
- `GeneratorError` — typed error class with a `FailureReason` for stats tracking

---

#### `helpers/boardAnalysis.ts`

The most structurally important helper. Builds two layers of derived state from a `Board`:

**`BoardStructure`** (built once per solve): static layout — region coords, which rows/cols each region spans. Never changes during solving.

**`BoardAnalysis`** (rebuilt every cycle): dynamic board state — star counts per row/col, unknown coords per region, `starsNeeded`, `unknownRows`, `unknownCols`, row→regions and col→regions maps. Plus two lazy-cached method accessors:

- `getTiling(coords)` — wraps `computeTiling` with a persistent cache
- `getCountingFlow(axis)` — wraps `computeCountingFlow` with a per-cycle cache

The `RegionMeta` type within `BoardAnalysis.regions` is what most rules operate on — it contains `unknownCoords`, `starsNeeded`, `starsPlaced`, `unknownRows`, `unknownCols`.

---

#### `helpers/tiling.ts`

Computes the tiling of a set of cells: the maximum number of non-overlapping 2×2 tiles that can cover them, plus all minimal tilings and which cells are forced (appear solo in every minimal tiling).

**Algorithm:**

1. Enumerate all candidate 2×2 tile positions that overlap the input cells
2. Build a DLX exact cover instance: primary columns = cells to cover, secondary columns = grid cells outside the set that tiles might use
3. Solve with `dlxSolve` to get all exact covers
4. If no cover exists (boundary L-shapes): return `capacity = cells.length` as a safe upper bound
5. Keep minimal covers (fewest tiles), compute forced cells (solo-covered in all)

The "no cover" fallback is a known approximation. A region shaped like an L might not tile perfectly — the code returns `cells.length` which is always safe but not tight.

---

#### `helpers/dlx.ts`

Dancing Links (Knuth's Algorithm X) for exact cover. Standard implementation with:

- `buildMatrix` — builds the circular doubly-linked list structure
- `cover` / `uncover` — standard DLX column operations
- `search` — recursive backtracking with minimum-size column heuristic
- `dlxSolve(numPrimary, numSecondary, rows)` — public API; returns all solutions as arrays of row indices

Supports both primary (must cover exactly once) and secondary (cover at most once) columns — needed for tiling where tiles can hang outside the target cell set.

---

#### `helpers/counting.ts`

Max-flow based counting constraint analysis using Dinic's algorithm.

**Flow network topology:**

```
Source → Line_i (cap = starsNeeded for line i)
Line_i → Region_j (cap = unknowns of region j in line i)
Region_j → Sink (cap = starsNeeded for region j)
```

Two public functions:

- `hasCountingViolation(input)` — returns true if max-flow < total demand (some line group is impossible to satisfy). Used in direct hypotheticals (level 10).
- `computeCountingFlow(input)` — runs flow + Dulmage-Mendelsohn decomposition on the residual graph to extract "tight sets" (SCCs where demand exactly equals supply). Returns `{ feasible, tightSets }`.

Tight sets are the key output: they identify line groups where regions are forced to place all their stars inside. Used by level 5 counting rules.

The SCC extraction uses iterative Tarjan's algorithm (avoiding stack overflow for large boards).

---

#### `helpers/hypotheticals.ts`

The shared engine for all hypothetical rules (levels 8–11).

**`hypotheticalLoop(board, cells, analysis, propagate, check)`**
Iterates over all unknown cells. For each:

- If `propagate = false`: builds a minimal state (star + neighbors marked)
- If `propagate = true`: calls `propagateHypothetical` which cascades forced placements until stable
- Passes state to `check(row, col, state)` — if true, marks the cell

**`propagateHypothetical`**: Places hypothetical star, then repeatedly calls `scanBoard` which:

- Checks adjacency violations between all hypothetical stars
- For each row/col/region: counts stars+hypothetical stars, computes needed, checks if unknowns (excluding marked) can satisfy it. Triggers forced placements when `unknowns === needed`, marks when `quota met`.

**`propagatedCountingViolation(board, cells, starKeys, marked, analysis, axis)`**: Takes a propagated state and checks if a counting flow violation exists given those hypothetical stars and marks. Used by levels 10 and 11.

---

#### `helpers/tilingEnumeration.ts`

Helpers for enumerating star assignments within a tiling.

- `enumerateStarAssignments(tiling, insideSet, cells, size)` — for a given tiling (set of tiles), enumerate all valid star placements: one star per tile, from inside cells only, no adjacency conflicts
- `collectValidStarCells(allTilings, insideSet, cells, size)` — union of all valid star cells across all tilings
- `filterActiveTilings(allTilings, insideSet, cells, size)` — filter to tilings that contain at least one outside-unknown cell (for overhang detection)
- `findForcedOverhangCells(activeTilings, insideSet, size)` — intersection of outside-cells across all active tilings

---

#### `helpers/tilingCounting.ts`

Shared loop for level 7 (tiling counting) and group variants.

**`tilingCountingLoop(board, cells, analysis, axis, deduct, minGroupSize, maxGroupSize)`**

Iterates over all bitmasks of lines (single or multi-line groups based on `minGroupSize`/`maxGroupSize`). For each group:

1. Compute total stars needed by those lines
2. For each touching region, compute `capacityOutside` (tiling capacity of the region's cells outside the group)
3. `minContrib = max(0, starsNeeded - capacityOutside)`
4. If sum of `minContrib` == `totalNeeded`: tight constraint → call `deduct(cells, mask, regionMeta, minContrib)`

This is O(2^N) in the number of lines. For a 10-row board: 1024 iterations. For 25 rows: ~33M.

---

#### `helpers/tilingPairs.ts`

Shared loop for level 6 (tiling pairs).

**`squeezePairLoop(cells, size, stars, analysis, axis, onTightPair)`**

Iterates over all consecutive pairs (i, i+1). For each pair, collects unknown cells from both lines, checks if `tiling.capacity === neededStars`. If tight, calls `onTightPair(pairCells, tiling)`.

---

#### `helpers/neighbors.ts`

Cell adjacency utilities:

- `cellKey(r, c, size)` — encodes a coord as an integer
- `neighbors(row, col, size)` — generator yielding all 8 neighbors
- `cellsAreAdjacent(c1, c2)` — true if Chebyshev distance ≤ 1
- `buildMarkedCellSet(row, col, size)` — returns a Set containing the cell and all its neighbors (used to initialize hypothetical marked sets)

---

#### `helpers/difficulty.ts`

One function: `computeDifficulty(result)`.

```
raw = maxLevel * 4 + cycles / 4
t   = (raw - 20) / (60 - 20)
out = clamp(round(t * 99 + 1), 1, 100)
```

Raw range 20–60 is calibrated empirically against KrazyDad puzzles. The formula maps that range linearly to 1–100. Values outside 20–60 are clamped.

---

#### `helpers/notation.ts`

Encodes/decodes the puzzle string format: `NxS.LAYOUT[.META]`

- Header: `NxS` (e.g. `10x2`)
- Layout: N² characters, each a letter A–Z representing a region (0-indexed)
- Meta (optional): compact key-value like `s12345d42l7c18` (seed, difficulty, maxLevel, cycles, version)

Only `decodePuzzleString` is implemented (no encoder). Used in the CLI's benchmark/file mode.

---

### Rules (41 total)

Documented in detail in [Section 5](#5-the-rule-system-in-depth). Located in `src/rules/`, organized by level in numbered subdirectories. All exported as default functions matching `Rule = (board, cells, analysis) => boolean`.

---

## 4. Interdependency Map

```
cli.ts
  ├── sieve.ts
  │     ├── generator.ts → types.ts
  │     ├── solver.ts
  │     └── difficulty.ts → types.ts
  ├── generator.ts
  ├── solver.ts
  │     ├── boardAnalysis.ts
  │     │     ├── tiling.ts → dlx.ts
  │     │     └── counting.ts → types.ts
  │     ├── tiling.ts
  │     ├── neighbors.ts
  │     └── rules/index.ts
  │           ├── (all 41 rule files)
  │           │     ├── boardAnalysis.ts
  │           │     ├── neighbors.ts
  │           │     ├── hypotheticals.ts → counting.ts, neighbors.ts
  │           │     ├── tilingEnumeration.ts → neighbors.ts
  │           │     ├── tilingCounting.ts → boardAnalysis.ts
  │           │     └── tilingPairs.ts → boardAnalysis.ts
  └── notation.ts → types.ts
```

**Key observation**: `boardAnalysis.ts` is the hub. Nearly everything in the rules layer receives `BoardAnalysis` and reads from it. The `getTiling` and `getCountingFlow` methods on `BoardAnalysis` mean rules don't import `tiling.ts` or `counting.ts` directly — they go through the analysis object.

**Exceptions**: `hypotheticals.ts` imports `counting.ts` directly (for `hasCountingViolation`), and `tiling.ts` imports `dlx.ts` directly.

---

## 5. The Rule System in Depth

Rules are applied in priority order each cycle. The solver restarts from rule 1 whenever any rule fires. This means cheap rules always preempt expensive ones.

### Level 1 — Star Neighbors (Direct × Inference)

`01-starNeighbors/starNeighbors.ts`

Scans all stars, marks unknown neighbors. The only rule that doesn't use `analysis` at all.

### Level 2 — Forced Placements (Direct × Inference)

`02-forcedPlacements/forced{Row,Column,Region}.ts`

If `unknowns.length === starsNeeded`, place stars. Returns after the first fired container — intentionally fires one-at-a-time to let star neighbors cascade before reapplying. Three files: same logic over different containers (row, column, region).

### Level 3 — Trivial Marks (Direct × Inference)

`03-trivialMarks/trivial{Row,Column,Region}.ts`

If `starsPlaced === board.stars`, mark remaining unknowns. Three files: same logic over different containers.

### Level 4 — Tiling Enumeration (Tiling × Enumeration)

`04-tilingEnumeration/tiling{Forced,AdjacencyMarks,OverhangMarks}.ts` (+ Row/Column/Region variants)

Five files total:

- `tilingForcedRow/Column/Region` — if tiling capacity is tight, place forced cells (appear solo in every minimal tiling)
- `tilingAdjacencyMarks` — if capacity tight, mark cells that don't appear in any valid star assignment across all minimal tilings
- `tilingOverhangMarks` — if capacity tight, filter to active tilings (those touching outside-unknowns), mark cells that appear in all active tiling overhangs

### Level 5 — Counting Enumerations (Counting × Enumeration)

`05-countingEnumeration/countingMark{Row,Column}.ts`

Uses `analysis.getCountingFlow(axis)`. For each tight set (where demand == supply), marks region cells outside the set's line mask when the region must place all its stars inside.

### Level 6 — Tiling Pairs (Tiling × Enumeration)

`06-tilingPairs/tilingPair{Forced,Adjacency,Overhang}{Row,Column}.ts`

Six files. Same logic as level 4 but applied to consecutive row/column pairs. Uses `squeezePairLoop` helper.

### Level 7 — Tiling Counting (Tiling + Counting × Enumeration)

`07-tilingCounting/{tilingCounting,groupTilingCounting}{Mark,Forced}{Row,Column}.ts`

Six files. Uses `tilingCountingLoop`:

- `tilingCountingMark{Row,Column}` — single-line groups, marks region cells inside the line when `minContrib === 0`
- `tilingCountingForced{Row,Column}` — single-line groups, places stars outside the line when outside capacity is exactly met
- `groupTilingCountingMark{Row,Column}` — same mark logic as `tilingCountingMark` but with `minGroupSize=2, maxGroupSize=4`

**Note:** `tilingCountingMarkRow` and `groupTilingCountingMarkRow` have identical `deduct` callbacks — the only difference is group size parameters.

### Level 8 — Direct Hypotheticals (Direct × Hypothetical)

`08-directHypotheticals/hypothetical{Row,Column,Region}Count.ts`

Three files. Uses `hypotheticalLoop(propagate=false)`. For each unknown cell, assume star + mark neighbors, then check the 3 nearest rows (or columns, or affected regions) for count violations.

### Level 9 — Tiling Hypotheticals (Tiling × Hypothetical)

`09-tilingHypotheticals/hypothetical{Row,Column,Region}Capacity.ts`

Three files. Uses `hypotheticalLoop(propagate=false)`. Same as level 8 but checks tiling capacity of affected containers instead of raw cell count.

### Level 10 — Counting Hypotheticals (Counting × Hypothetical)

`10-countingHypotheticals/hypotheticalUndercounting{Row,Column}.ts`

Two files. Uses `hypotheticalLoop(propagate=false)` + `propagatedCountingViolation`. Checks whether the simple hypothetical state (star + neighbor marks) creates a counting flow infeasibility.

### Level 11 — Propagated Hypotheticals (All × Hypothetical)

`11-propagatedHypotheticals/propagated{Row,Column,Region}{Count,Capacity}.ts` + `propagatedCounting{Row,Column}.ts`

Eight files. Uses `hypotheticalLoop(propagate=true)`. Propagation cascades forced placements before checking. Eight check variants: row/col/region × count/capacity, plus row/col counting flow.

---

## 6. What Is Working Well

### Clean pipeline separation

Generator, solver, sieve, and CLI are genuinely independent. The solver doesn't know about generation; the generator doesn't know about rules. This boundary is solid.

### BoardStructure / BoardAnalysis split

Building `BoardStructure` once (static layout) and rebuilding `BoardAnalysis` each cycle (dynamic state) is the right design. The tiling cache on `Map<string, TilingResult>` persists across cycles and is the primary reason the solver is fast in practice — tilings for the same cell set (which stabilize as cells get resolved) are computed once.

### Rule-as-function, sorted list

The `allRules: RuleEntry[]` pattern in `rules/index.ts` is clean. Rules are plain functions, and the priority is just array order. Adding or reordering a rule means one line change. The `level` integer feeds directly into difficulty scoring.

### Algorithmic choices

The use of Dinic's max-flow for counting constraints (level 5) and DLX for tiling enumeration (level 4) are strong algorithmic choices. Both replace exponential approaches with polynomial ones for the cases they handle. The DLX secondary-column support correctly handles tiles that partially hang outside the target set.

### `hypotheticalLoop` / `tilingCountingLoop` / `squeezePairLoop`

These three helper loops do the right thing: they extract the iteration skeleton so rule files become 5–15 line callbacks. The rules in levels 6, 7, 8, 9, 10, 11 are all tiny because the shared logic lives in helpers.

### Iterative Tarjan's in `counting.ts`

Using an explicit call stack instead of recursion in `extractTightSets` is correct for large boards where the default JS call stack would overflow. This is a subtle but important correctness detail.

### `GeneratorError` with typed `FailureReason`

Allows `sieve.ts` to distinguish generator failures from solver failures without string matching, and report clean stats to the caller.

---

## 7. Code Smells and Problems

### 7.1 Massive row/column duplication — ~20 file pairs

Every rule that applies to rows also applies to columns, but they live in separate files. The difference is always exactly one thing: `"row"` vs `"col"`. Examples:

- `forcedRow.ts` / `forcedColumn.ts` — identical except column vs row indexing
- `trivialRow.ts` / `trivialColumn.ts` — identical
- `countingMarkRow.ts` / `countingMarkColumn.ts` — differ only in axis parameter to `getCountingFlow`
- `hypotheticalRowCount.ts` / `hypotheticalColumnCount.ts` — differ only in which adjacent lines to check
- `propagatedRowCount.ts` / `propagatedColumnCount.ts` — differ only in `"row"` vs `"col"` string

There are roughly 20 such pairs across all levels. This is pure structural bloat — the domain is symmetric and the code should reflect that. Each pair should be one function parameterized by axis.

### 7.2 `tilingCountingMarkRow` and `groupTilingCountingMarkRow` are identical in logic

Both files (`tilingCountingMarkRow.ts`, `groupTilingCountingMarkRow.ts`) call `tilingCountingLoop` with the exact same `deduct` callback. The only difference is `minGroupSize`/`maxGroupSize`. Same for the column variants. This is four files whose callbacks are copy-pastes of each other.

```ts
// These two deduct callbacks are character-for-character identical:
(cells, mask, regionMeta, minContrib) => {
  if (minContrib !== 0) return false;
  for (const [r, c] of regionMeta.unknownCoords) {
    if ((mask >> r) & 1 && cells[r][c] === "unknown") {
      cells[r][c] = "marked";
      changed = true;
    }
  }
  return changed;
};
```

### 7.3 `tilingCountingLoop` is O(2^N) for groups

The loop `for (let mask = 1; mask < 1 << size; mask++)` with `minGroupSize/maxGroupSize` still iterates over all 2^N bitmasks. For a 10-row board that's 1024 masks; for 15 rows it's 32768; for 25 rows it's 33 million. The single-line variant (`minGroupSize=1, maxGroupSize=1`) iterates N masks but still loops through all 2^N. The `popcount` guard skips masks with the wrong bit count but the loop structure is wasteful. A correct implementation would enumerate only the masks with the right bit count directly.

### 7.4 `isValidBoard` is over-engineered and partially vacuous ❌ simplify for alpha

`isValidBoard` does three things:

1. **Region count check** — `regionCells.size !== size`. Cheap, O(N²). Worth keeping.
2. **Min region size check** — each region has ≥ `stars * 2 - 1` cells. Cheap, O(N²). Worth keeping.
3. **DLX tiling on all 3N containers** (every row, every column, every region). Expensive. Mostly useless.

The row and column DLX checks are always vacuous: `validateInputs` already enforces `stars ≤ size/2`, and a full row of N cells can always be tiled to hold ⌊N/2⌋ non-adjacent stars. These N×2 DLX calls can never fail and should be deleted.

The region DLX checks only catch pathologically shaped user-provided boards — but `solve()` returns `null` for those anyway (stuck), and the return type makes no distinction between "invalid board" and "solver got stuck." So the region DLX checks provide no actionable signal beyond what the solver already surfaces.

On the generator path, all three DLX calls are pure waste — the generator guarantees the invariants they check, and the computations are thrown away before the tiling cache is initialized (the cache is built after `isValidBoard` returns, so nothing is reused in cycle 1).

**Alpha fix:** strip `isValidBoard` down to the two cheap structural checks (region count + min region size). Delete all DLX calls from it entirely.

### 7.5 `buildBoardAnalysis` rebuilds all maps from scratch every cycle

`buildBoardState` inside `boardAnalysis.ts` rebuilds `rowStars`, `colStars`, `rowUnknowns`, `colUnknowns`, and all the region metadata from scratch on every solver cycle. For a 10×10 board, that's 100 cell reads per cycle. This is not a major bottleneck in practice, but it's architecturally awkward — the analysis is a snapshot, but it's rebuilt even when only 1–2 cells changed.

### 7.24 `BoardState` has two dead fields rebuilt every cycle ❌ remove for alpha

`rowToRegions` and `colToRegions` are built inside `buildBoardState` on every solver cycle — N×2 map initializations plus O(unknowns) set insertions. They are **never read anywhere**: not by any rule, not by any helper, not outside `boardAnalysis.ts`. Remove both fields from `BoardState` and delete their construction from `buildBoardState`.

### 7.25 `BoardStructure` has two dead fields ❌ remove for alpha

`RegionStructure.rows` and `RegionStructure.cols` (the static sets of which rows/cols a region spans) are computed in `buildBoardStructure` but **never read anywhere** — not in `buildBoardState`, not in any rule or helper. `RegionStructure` can be reduced to just `{ coords: Coord[] }` with the id implicit as the map key.

### 7.26 `RegionMeta.id` and `RegionStructure.id` are redundant with map keys

Both `RegionMeta` and `RegionStructure` carry an `id` field, but both are stored in `Map<number, ...>` keyed by that id. No rule or helper ever reads `.id` off either — the id is always available from the map key when iterating `.entries()`. These fields are never read outside `boardAnalysis.ts`. Minor, but clean to remove.

### 7.6 `RULE_METADATA` is a derived constant re-exported unnecessarily

`rules/index.ts` exports `RULE_METADATA` which is just `allRules.map(({name, level}) => ({name, level}))`. The CLI uses it for display. But `allRules` is also exported. Having two exports that represent the same data is noise — callers should use `allRules` directly.

### 7.7 `const LETTERS = REGION_LETTERS` in `cli.ts`

`cli.ts` imports `REGION_LETTERS` from `notation.ts` and immediately aliases it:

```ts
const LETTERS = REGION_LETTERS;
```

Then uses `LETTERS` everywhere. This is pure noise. Use the imported name directly.

### 7.8 Forced vs trivial rule firing design is undocumented ❌ document for alpha

`forcedRow`, `forcedColumn`, `forcedRegion` each return `true` after placing stars in the **first matching container only**. If three rows are all simultaneously forced, this causes 3 cycles instead of 1. This is intentional — each star placement may create new adjacency marks that change what's forced, so re-evaluating from rule 1 after each placement is correct.

`trivialRow`, `trivialColumn`, `trivialRegion` do the **opposite**: they mark all qualifying containers in one pass before returning. This is also correct — marking has no cascading interaction between containers, so batching is safe and more efficient.

Neither design is documented. A future maintainer may "optimize" forced placements to process all containers at once (breaking correctness), or "fix" trivial marks to fire one at a time (adding unnecessary cycles). Both files need a brief comment explaining the intentional asymmetry.

### 7.9 Rule parameter mismatches — unused `board` and unused `analysis`

The `Rule` type is `(board, cells, analysis) => boolean`. Several rules don't use all parameters:

- `starNeighbors` — uses `board` (for `board.grid.length`, should be `analysis.size`) but never uses `analysis`
- `countingMarkRow`, `countingMarkColumn` — never reference `board` at all; starkest example in the codebase
- `tilingAdjacencyMarks`, `tilingOverhangMarks` — use `board.grid.length` only, should be `analysis.size`

TypeScript permits functions with fewer params to satisfy a type with more, so there's no compile error. But the signatures don't reflect actual dependencies, making it unclear what each rule actually needs.

### 7.10 `notation.ts` only decodes, never encodes

The module has `decodePuzzleString` but no `encodePuzzleString`. The CLI's benchmark mode reads `.sbn` files using the decoder. There's no way to produce a puzzle string from a `Puzzle` object — a missing piece if the system ever needs to output its generated puzzles in the format it can read.

### 7.11 `fillRemaining` in generator has a subtle worst-case

The loop in `fillRemaining` rescans all N² cells every iteration. In worst case (a disconnected region seed placement), it may loop many times. The `maxIterations = size * size * 100` guard catches runaway cases and throws `GeneratorError`, but this is an O(N^4) worst case. In practice it terminates in O(N²) iterations.

### 7.12 Seed arithmetic in `generate()` is confusing

```ts
const baseSeed = Date.now() ^ (Math.random() * 0x100000000);
...
const seed = (baseSeed + attempt) | 0;
```

The `| 0` truncates to int32. Adding `attempt` to a large float-derived value then truncating means the sequence of seeds isn't simply `baseSeed, baseSeed+1, ...` — it wraps unpredictably. This is harmless for randomness quality but confusing for debugging ("why does seed 5 produce this board?").

### 7.13 `cli.ts` validates inputs that the library doesn't enforce

The CLI checks `size` between 4–25, `stars` between 1–6, `count` between 1–300. But these constraints aren't in `generator.ts` or `sieve.ts` — they're only CLI-level guards. The library functions will happily accept `size=3, stars=1` or other edge cases that the CLI blocks. Either the constraints belong in the library, or they don't exist.

### 7.14 Large `cli.ts` (365 lines) doing multiple unrelated jobs

Handles: argument parsing, stdin reading, board printing, step tracing, batch benchmarking, progress display. These concerns are independent and the file is long enough to be hard to navigate.

### 7.38 `board.grid.length` used for `size` in multiple rule files instead of `analysis.size`

`tilingAdjacencyMarks`, `tilingOverhangMarks`, and `starNeighbors` all do `const size = board.grid.length` when `analysis.size` is identical and already available. `board` is only needed for this one read in those rules. Affects every file that pulls `size` from `board` — replace with `analysis.size` throughout.

### 7.40 `tilingAdjacencyMarks` missing `tiling.tilings.length === 0` guard present in level 6 equivalents

All four level 6 adjacency/overhang pair rules guard against empty tilings:
```ts
if (tiling.tilings.length === 0) return false;
```

This is necessary for the adjacency case: the DLX L-shape fallback returns `tilings: []` with `capacity = cells.length`. If that capacity equals `neededStars`, `collectValidStarCells([], ...)` returns an empty Set, marking every cell in the container — incorrect.

`tilingAdjacencyMarks` (level 4) has the same logic and the same risk but is missing this guard. In practice `forcedRegion` (level 2) prevents the dangerous case from reaching level 4 (it handles regions where `unknownCoords.length === starsNeeded` first). But the inconsistency is a latent correctness risk. Add `if (tiling.tilings.length === 0) continue;` after the capacity check in `tilingAdjacencyMarks`.

### 7.39 `insideSet` rebuilt independently in `tilingAdjacencyMarks` and `tilingOverhangMarks` for the same data

Both rules iterate all regions and, for tight containers, build an identical `Set<number>` from `meta.unknownCoords` (`r * size + c` keys). Since these are separate rules running in separate cycles, the set is always reconstructed from scratch. Adding `unknownKeySet: Set<number>` to `RegionMeta` in `buildBoardState` would compute it once per region per cycle and let both rules (and any future rules needing the same set) use it directly. The level 6 `pairSet` is different — it's built from a dynamic line pair and can't be precomputed this way.

### 7.37 `trivialRegion` uses `board.stars` when `meta.starsNeeded === 0` is equivalent

`trivialRegion` checks `meta.starsPlaced === board.stars`. But `meta.starsNeeded = stars - starsPlaced` is already precomputed in `buildBoardState`, so `meta.starsNeeded === 0` is identical and doesn't require reading `board`. One-line fix, makes the condition consistent with the rest of the analysis-native patterns.

### 7.34 `difficulty.ts` — nothing to change

13 lines, one function, named constants for calibration bounds, correct clamped linear formula. Leave it alone.

### 7.35 `notation.ts`: metadata is never read by any caller

`decodePuzzleString` returns `{ board, metadata }` but every call site only takes `.board` — `.metadata` is discarded. The regex parsing block, the `switch` statement, and `PuzzleStringMetadata` type are all dead work on the current call path. This is acceptable for now since the encoder (smell 7.10) will eventually need metadata for round-trip. Don't remove it — just note it's unused until then.

More urgently: after alpha removals, `decodePuzzleString` itself loses its only call site (`benchmark()` in `cli.ts`). It will have zero callers in the production alpha. Keep it — it's needed once `encodePuzzleString` is added — but document that it's currently orphaned.

### 7.36 `notation.ts`: two minor inefficiencies in `decodePuzzleString`

1. **`grid.flat()`** at line 63 allocates a full N²-element array just to build a `Set` for the region count check. The Set could be built incrementally inside the grid construction loop already above it — one fewer pass and one fewer allocation.

2. **`char.toUpperCase()`** is called per character inside the loop. Call `layout.toUpperCase()` once before the loop instead.

Neither is a bottleneck (decode runs once per puzzle, not in the solver loop), but both are trivial to fix.

### 7.31 `tilingCounting.ts`: object allocation per region per mask in inner loop

Inside `tilingCountingLoop`, every region that passes the `axisMask` guard pushes `{ meta, minContrib }` into an `entries` array — one object allocation per region per candidate mask. Most are immediately discarded when `totalMin !== totalNeeded`. For a 10-row board with 10 regions: up to 10,240 short-lived object allocations per `tilingCountingLoop` call, all GC pressure.

Fix: replace with two parallel arrays — `const entryMetas: RegionMeta[] = []` and `const entryContribs: number[] = []`. No object literals, same logic. Reset both with `.length = 0` at the start of each mask iteration to avoid re-allocation.

### 7.32 `hypotheticals.ts`: adjacency check re-validates all star pairs every `scanBoard` call

In `scanBoard`, the adjacency check converts all `starKeys` to coords and does an O(stars²) pairwise comparison — every round, for every hypothetical cell. Stars added in previous rounds were already valid; only newly forced stars need checking against existing ones.

Fix: move the adjacency check into `propagateHypothetical` at the point where each new forced star is added — check only the new star against existing `starKeys`. This reduces from O(K × stars²) to O(stars) total per hypothetical cell, where K is the number of propagation rounds.

### 7.33 `hypotheticals.ts`: `buildMarkedCellSet` creates an intermediate `Set` that's immediately iterated and discarded

In `propagateHypothetical`, each forced star calls `buildMarkedCellSet(fr, fc, size)` which allocates a new 9-element Set, then immediately iterates it to add keys into `marked`. The intermediate Set is thrown away.

Fix: inline the neighbor addition directly:
```ts
marked.add(cellKey(fr, fc, size));
for (const [nr, nc] of neighbors(fr, fc, size)) marked.add(cellKey(nr, nc, size));
```
No Set allocation, same result. Minor but called once per forced star per propagation round per unknown cell.

### 7.28 `dlx.ts`: secondary columns have `size` tracked unnecessarily ❌ fix for alpha

In `cover` and `uncover`, `node.column.size--/++` runs for every node in every covered row, including nodes in secondary columns. Secondary columns are never connected to the root's horizontal list, so their `size` is never read by the minimum-column-size heuristic in `search`. It's incremented and decremented on every cover/uncover for no purpose.

Fix: add `isPrimary: boolean` to `ColumnHeader`, set it during `buildMatrix` (true for indices < numPrimary, false otherwise), and gate the size update in cover/uncover: `if (node.column.isPrimary) node.column.size--`. No logic changes — just skips dead work.

### 7.29 `dlx.ts`: `search` doesn't prune non-minimal solutions ❌ fix for alpha

`dlxSolve` finds every solution regardless of length. `tiling.ts` then filters to the shortest ones. But once a solution of length K is found, any branch already at depth K can be immediately abandoned — it can't produce a shorter result. This is wasted DLX search.

Fix: pass a shared `minLen` object into `search`. When a solution is found shorter than the current best, clear the solutions array and update `minLen`. Prune any branch where `solution.length >= minLen.value`:

```ts
if (solution.length >= minLen.value) return;
```

Since `tiling.ts` is the only caller and only wants minimal solutions, the behavioral change is safe: `dlxSolve` returns only minimal-length solutions, making `tiling.ts`'s own `filter(s => s.length === capacity)` step unnecessary.

### 7.30 `counting.ts`: `TightSetContrib` has two dead fields ❌ remove for alpha

`TightSetContrib` stores five fields. The counting rules only read three: `maxContrib`, `starsNeeded`, `unknownCoords`. Two are never read outside `extractTightSets`:

- `inside` — computed during SCC accumulation, stored in the struct, never read by any rule or helper
- `regionIndex` — never read anywhere outside `extractTightSets`

Remove both from the type and the struct literal. No behavior change.

### 7.27 `forcedCells` computation in `tiling.ts` is O(cells × tilings × tiles) — fix for alpha

The current implementation linear-scans all tiles in every minimal tiling for every cell:

```ts
for (const cell of cells) {
  const forcedInAll = tilings.every((tiling) => {
    const tile = tiling.find((t) =>                  // O(tiles per tiling)
      t.coveredCells.some((c) => ...)                // O(coveredCells)
    );
    return tile && tile.coveredCells.length === 1;
  });
}
```

Fix: precompute a per-tiling Set of solo-covered cell keys (tiles where `coveredCells.length === 1`), then check membership in O(1):

```ts
const soloMaps = tilings.map(tiling => {
  const solo = new Set<number>();
  for (const tile of tiling) {
    if (tile.coveredCells.length === 1) {
      const [r, c] = tile.coveredCells[0];
      solo.add(r * gridSize + c);
    }
  }
  return solo;
});
const forcedCells = cells.filter(([r, c]) =>
  soloMaps.every(solo => solo.has(r * gridSize + c))
);
```

Cost drops from O(cells × tilings × tiles × coveredCells) to O(tilings × tiles + cells × tilings). Safe to change — DLX and the rest of `computeTiling` are untouched. The tiling cache means this runs once per unique cell set, but regions with many minimal tilings still benefit.

### 7.15 `computeTiling` "no cover" fallback is a silent approximation

When DLX finds no exact cover (happens with L-shaped or irregular boundaries), `computeTiling` returns `capacity = cells.length`. The comment says "cells.length is a trivially correct upper bound so callers never see a false tight constraint." This is correct but silent — callers have no way to distinguish "capacity is exact" from "capacity is an overestimate." This affects the tightness of level 4+ deductions on unusual region shapes.

### 7.17 `SolveOptions.timing` is debug-only ❌ remove for alpha

`SolveOptions` has a `timing?: Map<string, number>` field that accumulates per-rule wall-clock time. It is only ever passed by `benchmark()` in `cli.ts` — which is being removed for alpha. With `timing` gone, the solver loop's `if (options.timing) { ... } else { ... }` branch collapses: `entry.rule(...)` currently appears twice (once wrapped in `performance.now()`, once bare) purely because of this field. Remove `timing` from `SolveOptions`, delete the branch, and the rule call becomes one line.

### 7.18 `checkProgress` takes `Board` just for `board.stars`

`checkProgress(board, cells, analysis)` uses `board` only to read `board.stars`. Everything else it needs is on `analysis`. But `stars` is not propagated from `BoardStructure` into `BoardAnalysis` / `BoardState` — it stops at `buildBoardAnalysis`'s local `structure` variable. Fix: add `stars` to `BoardState` (it's static, belongs there), then `checkProgress` can drop the `board` parameter entirely.

### 7.19 `assignDifficulty` in `sieve.ts` is a pointless wrapper

```ts
function assignDifficulty(solution: Solution): Puzzle {
  return { ...solution, difficulty: computeDifficulty(solution) };
}
```

One call site, three lines, adds nothing over the inline. Delete and inline: `const puzzle: Puzzle = { ...solution, board, seed, difficulty: computeDifficulty(solution) }`.

### 7.20 `SieveStats` structure is over-nested and should be flattened after deterministic removal

After removing the deterministic branch, `stats.failures.generator_stuck` and `stats.failures.invalid_tiling` are always 0 — they only ever increment inside the deterministic path. What remains is `stats.failures.solver_failed` and `stats.attempts`. The `failures` nesting has no remaining purpose. Flatten to `{ attempts: number, solverFailed: number }` and remove the `FailureReason`-keyed `Record` from `SieveStats` in `types.ts`.

### 7.21 `onProgress` callback passes redundant data

```ts
onProgress?: (solved: number, attempts: number, stats: SieveStats) => void;
```

`solved` is `puzzles.length` and `attempts` is `stats.attempts` — both already available on `stats`. The caller receives the same information three ways. After flattening `SieveStats` (see 7.20), simplify to `onProgress?: (stats: SieveStats) => void` and let callers read what they need.

### 7.22 `GenerateResult.attempts` is silently ignored by `sieve.ts`

`generate()` returns `{ board, seed, attempts }` where `attempts` is the number of internal retries before a board succeeded. `sieve.ts` destructures only `{ board, seed }` and never touches `attempts`. It serves no purpose on the production path. Remove it from `GenerateResult`, or at minimum document that it's there only for diagnostic use.

### 7.23 Generate mode output is not machine-readable — round-trip gap

The generate mode in `cli.ts` prints puzzles in a human-readable format (region grid + seed + difficulty). But the system's own file input format is `.sbn` notation (decoded by `decodePuzzleString`). There is no way to take the output of a generate run and feed it back into the system as input — no round-trip. This is the same root cause as smell 7.10 (no `encodePuzzleString`), but the consequence is concrete: you cannot build a puzzle library via CLI and then benchmark or re-solve from it without writing your own encoder.

### 7.16 `checkProgress` is misnamed and has a redundant cell scan ❌ fix for alpha

The name implies measuring forward movement, but the function is a three-way termination check: `"solved"`, `"invalid"`, or `"valid"` (keep going). `"invalid"` is the opposite of progress. Rename to `getSolveStatus` or `checkSolveState`.

It also re-scans cells directly to count row/col unknowns (`if cells[i][j] === "unknown" rowUnknowns++`) even though `analysis.rowUnknowns[i].length` already has that number. The same cells get walked twice per cycle for no reason. Fix: replace the inline scan with `analysis.rowUnknowns[i].length` and `analysis.colUnknowns[i].length`.

### 7.41 `extraStars` is assigned `= 1` in region hypotheticals but incremented `++` in propagated equivalents

In `hypotheticalRegionCount` (level 8) and `hypotheticalRegionCapacity` (level 9), the code uses:
```ts
if (state.starKeys.has(key)) extraStars = 1;
```

In `propagatedRegionCapacity` (level 11), the equivalent line uses:
```ts
if (state.starKeys.has(key)) extraStars++;
```

For direct hypotheticals (levels 8–9), `state.starKeys` contains exactly one entry (the cell where the star was hypothetically placed), so `= 1` and `++` are semantically equivalent. For propagated hypotheticals (level 11), multiple stars may have been forced, so `++` is correct. The inconsistency is harmless in practice but creates confusion — a reader of the level 8/9 code naturally wonders if the `= 1` is intentional (capped) or a bug. Use `++` uniformly.

### 7.42 Filename/function name mismatch in `10-countingHypotheticals`

`hypotheticalUndercountingRow.ts` exports a function named `hypotheticalCountingRow`. Same for the column variant. The filename says "Undercounting"; the exported function says "Counting". `index.ts` imports them as `hypotheticalCountingRow/Column` (matching the function names, not the filenames). Either rename the files to match or rename the functions. Pick one convention and apply it.

### 7.43 `propagatedRowCount` includes `"adjacency"` violation but `propagatedColumnCount` does not — undocumented asymmetry

In `11-propagatedHypotheticals`:
```ts
// propagatedRowCount
state.violation === "row" || state.violation === "adjacency"

// propagatedColumnCount
state.violation === "col"
```

The adjacency violation (two stars touching) is handled by the row checker, not the column checker. This is intentional — adjacency violations manifesting between two stars in the same row are caught here — but the asymmetry is completely undocumented. A reader editing the column rule will wonder if the missing `"adjacency"` case is a bug. Add a brief comment explaining why adjacency falls on the row checker.

---

## 8. Refactor Roadmap

### Alpha: Debug-Only Removals (do first)

These are the pieces that exist purely for developer debugging and have no role in the production alpha. Remove them before anything else — they simplify the surface area that subsequent refactors need to touch.

| What                                                     | Where          | Why it's safe to remove                                                                                                      |
| -------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `layout()` export                                        | `generator.ts` | Only called by the two debug paths below. `layoutWithSeed` stays private.                                                    |
| Deterministic branch (`if (deterministic)`)              | `sieve.ts`     | Zero production use. Takes `layout()` with it.                                                                               |
| `seed` field in `SieveOptions`                           | `sieve.ts`     | Only feeds the deterministic branch.                                                                                         |
| `SieveStats.failures.generator_stuck` / `invalid_tiling` | `sieve.ts`     | Always 0 in non-deterministic mode; only meaningful in the debug branch being removed. `solver_failed` count remains useful. |
| `SolveOptions.timing` field                              | `solver.ts`    | Only ever passed by `benchmark()`. Removal collapses the if/else rule-call duplication in the solver loop to one line.       |
| `benchmark()` function                                   | `cli.ts`       | Developer benchmarking tool. No user-facing purpose. Takes `--file`, `--verbose`, `--unsolved` flags with it.                |
| `--trace --seed N` path                                  | `cli.ts`       | Calls `layout()` (being removed) + `traceBoard`. Debug inspection only.                                                      |
| `--seed N` flag (in generate mode)                       | `cli.ts`       | Feeds `sieve({ seed })`, which is the deterministic mode being removed.                                                      |

After these removals: `layout()` is gone, `sieve.ts` has one mode, `cli.ts` has two modes (stdin solve + generate), and `generator.ts` exports one function.

---

The goals are: remove all bloat, zero unjustified duplication, make every file self-evidently understandable.

### Priority 1 — Collapse row/column file pairs

Every `*Row.ts` / `*Column.ts` pair should become one function parameterized by `axis: "row" | "col"`. The rules index instantiates both:

```ts
// Before: two files
import forcedRow from "./02-forcedPlacements/forcedRow";
import forcedColumn from "./02-forcedPlacements/forcedColumn";

// After: one file, two registrations
import { forcedPlacement } from "./02-forcedPlacements/forcedPlacement";
{ rule: forcedPlacement("row"), ... }
{ rule: forcedPlacement("col"), ... }
```

This eliminates approximately 20 files.

### Priority 2 — Merge `tilingCountingMark` and `groupTilingCountingMark`

They share an identical `deduct` callback. The only difference is group size. After axis consolidation:

```ts
// Before: 4 files
(tilingCountingMarkRow,
  tilingCountingMarkColumn,
  groupTilingCountingMarkRow,
  groupTilingCountingMarkColumn);

// After: 1 parameterized function
tilingCountingMark(axis, minGroupSize, maxGroupSize);
```

Registered four times in `allRules` with different parameters.

### Priority 3 — Simplify `isValidBoard`

Delete all DLX tiling calls from it. Keep only the two cheap structural checks: region count and min region size. The row/col checks are always vacuous; the region checks add no signal the solver doesn't already surface. See smell 7.4.

### Priority 4 — Document the one-at-a-time forced placement design

Add a brief comment to `forcedRow`, `forcedColumn`, `forcedRegion` explaining why they return after the first container. Future maintainers will see it immediately.

### Priority 5 — Add `encodePuzzleString` to `notation.ts`

The system can read `.sbn` files but can't write them. The encoder is straightforward and completes the round-trip.

### Priority 6 — Remove `RULE_METADATA` export, use `allRules` directly

The CLI can derive names/levels from `allRules`. One fewer export, one fewer indirection.

### Priority 7 — Remove `const LETTERS = REGION_LETTERS` alias in `cli.ts`

Use `REGION_LETTERS` directly.

### Priority 8 — Resolve type inconsistency in `starNeighbors`

Either add `analysis: BoardAnalysis` to its signature (even unused), or document explicitly why it omits it.

### Priority 9 — Consolidate input validation into the library

Either move the 4–25/1–6/1–300 constraints into `generator.ts`/`sieve.ts`, or document clearly that they're CLI-only policy. Don't let the library silently accept inputs the CLI rejects.

### Priority 10 — Split `cli.ts`

Separate at minimum: formatting/display utilities, benchmarking logic, main entry point. The file is too large and does too many different things.

---

## Summary

The codebase is algorithmically strong — DLX, Dinic's, Dulmage-Mendelsohn, propagated hypotheticals. The rule hierarchy is sound and the separation between generator, solver, and sieve is clean. The main problem is structural: the row/column symmetry of the puzzle domain is not reflected in the code. Instead of ~20 parameterized rule functions, there are ~40 files. That duplication is the dominant source of confusion and maintenance burden. After collapsing file pairs, fixing the RULE_METADATA redundancy, and adding the missing encoder, the codebase will be roughly half the current file count with the same behavior and full clarity.

**Rules 07–11 and `rules/index.ts` are all clean at the rule level.** Every level 7 file delegates entirely to `tilingCountingLoop` — no logic lives in the rule file itself. Levels 8–11 (hypothetical and propagated rules) all use `board.stars` and sometimes `board.grid` legitimately, so the unused-`board` smell (7.9) does not apply to them. The three new smells found (7.41–7.43) are all minor consistency/documentation issues, not logic bugs. `rules/index.ts` is clean and well-organized; `RULE_METADATA` is already flagged as smell 7.6 for removal after alpha CLI cleanup.

All 43 rule files across 11 directories have now been reviewed. The rule review is complete.
