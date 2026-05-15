# Star Battle — Alpha Refactor Plan

Based on `research.md`. Goal: production-ready backend — zero debug code, zero structural bloat, complete API, maximum clarity for the next maintainer.

**Two production use cases this system must serve:**

1. **Puzzle library generation**: `sieve()` → mass-produce `Puzzle[]` → serialize to disk
2. **Solve a given puzzle**: `decodePuzzleString()` + `solve()` → return result

Everything else is debug infrastructure. Remove it last — keep it available while doing the hard structural work so you have a working benchmark tool to validate rule refactors as you go.

---

## Execution Order

| Phase | Work                            | Files affected | Risk   | Research smells      |
| ----- | ------------------------------- | -------------- | ------ | -------------------- |
| 0     | Library debug removals          | 3 files        | None   | §7.17                |
| 1     | Dead field elimination          | 4 files        | None   | §7.22–7.26, §7.30    |
| 2     | Core structural fixes           | 4 files        | Low    | §7.4, §7.16–7.21     |
| 3     | Correctness & consistency fixes | 11 files       | Low    | §7.7–7.9, §7.37–7.43 |
| 4     | Performance wins                | 5 files        | Low    | §7.27–7.33           |
| 5     | API completion                  | 3 files        | Low    | §7.10, §7.13, §7.23  |
| 6     | Rule collapse (axis factory)    | ~45 files      | Medium | §7.1, §7.2           |
| 7     | CLI debug removals              | 1 file         | None   | §7.6, §7.14, §7.17   |

**Why this order:**

- Phases 0–3 are independent, low-risk, and shrink the codebase before touching anything structural.
- Phases 4–5 are also independent of Phase 6 and should land first — the benchmark CLI (retained through Phase 6) can validate that performance changes don't alter output.
- Phase 6 is the largest change. Doing it after Phases 0–5 means the benchmark, `--file`, and `--trace` CLI modes are still alive and can be used to confirm rule coverage and counts haven't changed. Run `sieve --file puzzles.sbn` before and after Phase 6 and compare rule usage stats.
- Phase 7 removes all remaining debug CLI surface. Only do this after Phase 6 passes.

Run `npm test` after each phase.

---

## Todo List

### Phase 0 — Library Debug Removals

- [x] **0-A** `src/generator.ts` — delete `layout()` export and its JSDoc block
- [x] **0-B** `src/sieve.ts` — remove `seed` from `SieveOptions` type
- [x] **0-B** `src/sieve.ts` — remove `const deterministic = options.seed !== undefined` and the entire `if (deterministic) { ... } else { ... }` branch; replace with `const { board, seed } = generate(size, stars)`
- [x] **0-B** `src/sieve.ts` — remove `GeneratorError` import (no longer caught) and `layout` import (no longer called)
- [x] **0-C** `src/solver.ts` — remove `timing?: Map<string, number>` from `SolveOptions` interface
- [x] **0-C** `src/solver.ts` — replace the `if (options.timing) { ... } else { ... }` branch in the rule loop with `const fired = entry.rule(boardDef, cells, analysis)`
- [x] **0-C** `src/cli.ts` — remove the `timing` map creation and the `timing` field from the `solve()` call in `benchmark()` so the project compiles
- [x] Run `npm test`

### Phase 1 — Dead Field Elimination

- [x] **1-A** `src/helpers/boardAnalysis.ts` — remove `rowToRegions` and `colToRegions` from the `BoardState` type
- [x] **1-A** `src/helpers/boardAnalysis.ts` — delete the construction block for `rowToRegions` / `colToRegions` in `buildBoardState`
- [x] **1-A** `src/helpers/boardAnalysis.ts` — remove both fields from the `buildBoardState` return object
- [x] **1-B** `src/helpers/boardAnalysis.ts` — remove `rows` and `cols` from the `RegionStructure` type
- [x] **1-B** `src/helpers/boardAnalysis.ts` — delete the `rows`/`cols` Set construction and the `rows.add` / `cols.add` loop in `buildBoardStructure`
- [x] **1-B** `src/helpers/boardAnalysis.ts` — update the `regions.set(id, { ... })` call to drop `rows` and `cols`
- [x] **1-C** `src/helpers/boardAnalysis.ts` — remove `id: number` from `RegionStructure` type
- [x] **1-C** `src/helpers/boardAnalysis.ts` — remove `id: number` from `RegionMeta` type
- [x] **1-C** `src/helpers/boardAnalysis.ts` — remove `id` from both struct literals (`{ id, coords }` → `{ coords }`, `{ id, unknownCoords, ... }` → `{ unknownCoords, ... }`)
- [x] **1-D** `src/helpers/counting.ts` — remove `regionIndex` and `inside` from the `TightSetContrib` type
- [x] **1-D** `src/helpers/counting.ts` — in `extractTightSets`, keep `inside` as a local variable but drop it and `regionIndex` from the `regionContribs.push({ ... })` call
- [x] **1-E** `src/generator.ts` — remove `attempts` from the `GenerateResult` type
- [x] **1-E** `src/generator.ts` — update the `return` in `generate()` from `{ board, seed, attempts: attempt + 1 }` to `{ board, seed }`
- [x] Run `npm test`

### Phase 2 — Core Structural Fixes

- [ ] **2-A** `src/solver.ts` — replace `isValidBoard` body: remove the row/col/region DLX checks, replace `regionCells` map with `regionSizes` map (only track sizes, not coordinates)
- [ ] **2-A** `src/solver.ts` — remove `computeTiling` import (no longer used in this file)
- [ ] **2-B** `src/helpers/boardAnalysis.ts` — add `stars: number` to the `BoardState` type
- [ ] **2-B** `src/helpers/boardAnalysis.ts` — add `stars` to the `buildBoardState` return object (it's already available as a param)
- [ ] **2-B** `src/solver.ts` — rename `checkProgress` → `getSolveStatus`
- [ ] **2-B** `src/solver.ts` — drop `board: Board` from `getSolveStatus` signature; replace `board.stars` with `analysis.stars`
- [ ] **2-B** `src/solver.ts` — in `getSolveStatus`, replace the manual `rowUnknowns`/`colUnknowns` count loop with `analysis.rowUnknowns[i].length` and `analysis.colUnknowns[i].length`
- [ ] **2-B** `src/solver.ts` — update the call site: `checkProgress(boardDef, cells, analysis)` → `getSolveStatus(cells, analysis)`
- [ ] **2-C** `src/sieve.ts` — delete the `assignDifficulty` function
- [ ] **2-C** `src/sieve.ts` — replace the `assignDifficulty(solution)` call with `{ ...solution, difficulty: computeDifficulty(solution) }`
- [ ] **2-D** `src/helpers/types.ts` — delete the `FailureReason` type entirely
- [ ] **2-D** `src/helpers/types.ts` — replace `SieveStats` with `{ attempts: number; solved: number; solverFailed: number }`
- [ ] **2-D** `src/sieve.ts` — update `stats` initialization to `{ attempts: 0, solved: 0, solverFailed: 0 }`
- [ ] **2-D** `src/sieve.ts` — replace `stats.failures.solver_failed++` with `stats.solverFailed++`
- [ ] **2-D** `src/sieve.ts` — add `stats.solved = puzzles.length` before calling `onProgress`
- [ ] **2-D** `src/sieve.ts` — update `onProgress` type and call: `(stats: SieveStats) => void`, call as `options.onProgress?.(stats)`
- [ ] **2-D** `src/cli.ts` — update `benchmark()`'s `onProgress` callback to use `stats.attempts` and `stats.solved`
- [ ] **2-D** `src/sieve.ts` — remove `GeneratorError` import if not already removed in Phase 0
- [ ] Run `npm test`

### Phase 3 — Correctness & Consistency Fixes

- [ ] **3-A** `src/rules/04-tilingEnumeration/tilingAdjacencyMarks.ts` — add `if (tiling.tilings.length === 0) continue` guard after the capacity check
- [ ] **3-B** `src/rules/03-trivialMarks/trivialRegion.ts` — replace `meta.starsPlaced === board.stars` with `meta.starsNeeded === 0`; update function signature to `(_board, cells, analysis)`
- [ ] **3-C** `src/rules/01-starNeighbors/starNeighbors.ts` — replace `const size = board.grid.length` with `const { size } = analysis`
- [ ] **3-C** `src/rules/04-tilingEnumeration/tilingAdjacencyMarks.ts` — same replacement
- [ ] **3-C** `src/rules/04-tilingEnumeration/tilingOverhangMarks.ts` — same replacement
- [ ] **3-C** `src/rules/06-tilingPairs/tilingPairAdjacencyRow.ts` — same replacement
- [ ] **3-C** `src/rules/06-tilingPairs/tilingPairAdjacencyColumn.ts` — same replacement
- [ ] **3-C** `src/rules/06-tilingPairs/tilingPairOverhangRow.ts` — same replacement
- [ ] **3-C** `src/rules/06-tilingPairs/tilingPairOverhangColumn.ts` — same replacement
- [ ] **3-C** `src/rules/06-tilingPairs/tilingPairForcedRow.ts` — same replacement
- [ ] **3-C** `src/rules/06-tilingPairs/tilingPairForcedColumn.ts` — same replacement
- [ ] **3-D** `src/rules/08-directHypotheticals/hypotheticalRegionCount.ts` — change `extraStars = 1` to `extraStars++`
- [ ] **3-D** `src/rules/09-tilingHypotheticals/hypotheticalRegionCapacity.ts` — change `extraStars = 1` to `extraStars++`
- [ ] **3-E** `src/rules/10-countingHypotheticals/` — rename `hypotheticalUndercountingRow.ts` → `hypotheticalCountingRow.ts`
- [ ] **3-E** `src/rules/10-countingHypotheticals/` — rename `hypotheticalUndercountingColumn.ts` → `hypotheticalCountingColumn.ts`
- [ ] **3-E** `src/rules/index.ts` — update the two import paths to match the new filenames
- [ ] **3-F** `src/rules/11-propagatedHypotheticals/propagatedColumnCount.ts` — add comment explaining why `"adjacency"` is not checked here (row checker handles it; two adjacent stars always violate a row constraint first)
- [ ] **3-G** `src/rules/02-forcedPlacements/forcedRow.ts` — add one-at-a-time comment
- [ ] **3-G** `src/rules/02-forcedPlacements/forcedColumn.ts` — add one-at-a-time comment
- [ ] **3-G** `src/rules/02-forcedPlacements/forcedRegion.ts` — add one-at-a-time comment
- [ ] **3-H** `src/cli.ts` — delete `const LETTERS = REGION_LETTERS` alias; find-replace all `LETTERS` → `REGION_LETTERS` in the file
- [ ] Run `npm test`

### Phase 4 — Performance Wins

- [ ] **4-A** `src/helpers/dlx.ts` — add `minLen: { value: number }` parameter to `search`
- [ ] **4-A** `src/helpers/dlx.ts` — at the start of `search`, return early if `solution.length >= minLen.value`
- [ ] **4-A** `src/helpers/dlx.ts` — when a solution is found: if shorter than `minLen.value`, clear `solutions`, update `minLen.value`, then push
- [ ] **4-A** `src/helpers/dlx.ts` — in `dlxSolve`, initialize `const minLen = { value: Infinity }` and pass it to `search`
- [ ] **4-B** `src/helpers/dlx.ts` — add `isPrimary: boolean` to `ColumnHeader` interface
- [ ] **4-B** `src/helpers/dlx.ts` — in `buildMatrix`, set `isPrimary = true` for columns 0..numPrimary-1 and `isPrimary = false` for numPrimary..end
- [ ] **4-B** `src/helpers/dlx.ts` — in `cover`, gate `node.column.size--` behind `if (node.column.isPrimary)`
- [ ] **4-B** `src/helpers/dlx.ts` — in `uncover`, gate `node.column.size++` behind `if (node.column.isPrimary)`
- [ ] **4-C** `src/helpers/tiling.ts` — replace the `forcedCells` O(cells × tilings × tiles × coveredCells) block with the two-pass `soloMaps` approach
- [ ] **4-D** `src/helpers/tilingCounting.ts` — declare `entryMetas: RegionMeta[]` and `entryContribs: number[]` before the outer mask loop
- [ ] **4-D** `src/helpers/tilingCounting.ts` — inside the mask loop, reset `entryMetas.length = 0` and `entryContribs.length = 0` at the top of each iteration
- [ ] **4-D** `src/helpers/tilingCounting.ts` — replace `entries.push({ meta, minContrib })` with `entryMetas.push(meta); entryContribs.push(minContrib)`
- [ ] **4-D** `src/helpers/tilingCounting.ts` — replace `for (const { meta, minContrib } of entries)` with an indexed loop over `entryMetas`/`entryContribs`
- [ ] **4-E** `src/helpers/hypotheticals.ts` — in `propagateHypothetical`, move the adjacency check into the forced-star loop: for each new forced star, check it against all existing `starKeys` before adding
- [ ] **4-E** `src/helpers/hypotheticals.ts` — inline neighbor marking directly (no intermediate Set): after adding the new star key, iterate `neighbors(fr, fc, size)` and add each to `marked`
- [ ] **4-E** `src/helpers/hypotheticals.ts` — remove the pairwise adjacency loop from `scanBoard` (it is now done incrementally)
- [ ] **4-E** `src/helpers/hypotheticals.ts` — remove `buildMarkedCellSet` call/import if it becomes unused
- [ ] Run `npm test`

### Phase 5 — API Completion

- [ ] **5-A** `src/helpers/notation.ts` — add `encodePuzzleString(puzzle: Puzzle): string` function using the `${size}x${stars}.${layout}.s${seed}d${difficulty}l${maxLevel}c${cycles}v1` format
- [ ] **5-A** `src/helpers/notation.ts` — in `decodePuzzleString`, hoist `layout.toUpperCase()` before the grid loop (remove per-character `toUpperCase()` calls)
- [ ] **5-A** `src/helpers/notation.ts` — in `decodePuzzleString`, replace `new Set(grid.flat())` with incremental Set building inside the existing loop
- [ ] **5-B** `src/generator.ts` — extend `validateInputs` to also check `stars > Math.floor(size / 2)` and add clear error messages for out-of-range `size` and `stars`
- [ ] **5-B** `src/sieve.ts` — add `count` validation at function entry (integer, 1–300)
- [ ] **5-B** `src/cli.ts` — remove duplicate size/stars/count validation; let the library throw
- [ ] **5-C** `src/cli.ts` — update generate mode to `console.log(encodePuzzleString(p))` for each puzzle; add `encodePuzzleString` import from `notation`
- [ ] Run `npm test`; verify `sieve --file puzzles.sbn` produces identical results before and after

### Phase 6 — Rule Collapse

- [ ] Record baseline rule usage counts: run `sieve --file puzzles.sbn` and save output
- [ ] **6-A** Create `src/rules/02-forcedPlacements/forcedPlacement.ts` with `forcedPlacement(axis)` factory
- [ ] **6-A** Delete `forcedRow.ts` and `forcedColumn.ts`
- [ ] **6-A** `src/rules/index.ts` — replace the two individual imports with `{ forcedPlacement }` and update `allRules` entries to `forcedPlacement("row")` / `forcedPlacement("col")`
- [ ] **6-B** Create `src/rules/03-trivialMarks/trivialMarks.ts` with `trivialMarks(axis)` factory
- [ ] **6-B** Delete `trivialRow.ts` and `trivialColumn.ts`
- [ ] **6-B** `src/rules/index.ts` — replace the two individual imports with `{ trivialMarks }` and update entries
- [ ] **6-C** Create `src/rules/04-tilingEnumeration/tilingForcedLine.ts` with `tilingForcedLine(axis)` factory
- [ ] **6-C** Delete `tilingForcedRow.ts` and `tilingForcedColumn.ts`
- [ ] **6-C** `src/rules/index.ts` — replace the two individual imports with `{ tilingForcedLine }` and update entries
- [ ] **6-D** Create `src/rules/05-countingEnumeration/countingMark.ts` with `countingMark(axis)` factory
- [ ] **6-D** Delete `countingMarkRow.ts` and `countingMarkColumn.ts`
- [ ] **6-D** `src/rules/index.ts` — replace the two individual imports with `{ countingMark }` and update entries
- [ ] **6-E** Create `src/rules/06-tilingPairs/tilingPairForced.ts` with `tilingPairForced(axis)` factory
- [ ] **6-E** Create `src/rules/06-tilingPairs/tilingPairAdjacency.ts` with `tilingPairAdjacency(axis)` factory
- [ ] **6-E** Create `src/rules/06-tilingPairs/tilingPairOverhang.ts` with `tilingPairOverhang(axis)` factory
- [ ] **6-E** Delete all six existing `tilingPair*Row.ts` and `tilingPair*Column.ts` files
- [ ] **6-E** `src/rules/index.ts` — replace six imports with three factory imports and update all six entries
- [ ] **6-F** Create `src/rules/07-tilingCounting/tilingCountingMark.ts` with `tilingCountingMark(axis, minGroup, maxGroup)` factory
- [ ] **6-F** Create `src/rules/07-tilingCounting/tilingCountingForced.ts` with `tilingCountingForced(axis)` factory
- [ ] **6-F** Delete all six existing tiling counting files
- [ ] **6-F** `src/rules/index.ts` — replace six imports with two factory imports; update entries (single-line entries use default `minGroup=1, maxGroup=1`; group entries use `minGroup=2, maxGroup=4`)
- [ ] **6-G** Create `src/rules/08-directHypotheticals/hypotheticalCount.ts` with `hypotheticalCount(axis)` factory
- [ ] **6-G** Create `src/rules/09-tilingHypotheticals/hypotheticalCapacity.ts` with `hypotheticalCapacity(axis)` factory
- [ ] **6-G** Delete `hypotheticalRowCount.ts`, `hypotheticalColumnCount.ts`, `hypotheticalRowCapacity.ts`, `hypotheticalColumnCapacity.ts`
- [ ] **6-G** `src/rules/index.ts` — replace four imports with two factory imports and update entries
- [ ] **6-H** Create `src/rules/10-countingHypotheticals/hypotheticalCounting.ts` with `hypotheticalCounting(axis)` factory
- [ ] **6-H** Delete `hypotheticalCountingRow.ts` and `hypotheticalCountingColumn.ts`
- [ ] **6-H** `src/rules/index.ts` — replace two imports with one factory import and update entries
- [ ] **6-I** Create `src/rules/11-propagatedHypotheticals/propagatedCount.ts` with `propagatedCount(axis)` factory
- [ ] **6-I** Create `src/rules/11-propagatedHypotheticals/propagatedCapacity.ts` with `propagatedCapacity(axis)` factory
- [ ] **6-I** Create `src/rules/11-propagatedHypotheticals/propagatedCounting.ts` with `propagatedCounting(axis)` factory
- [ ] **6-I** Delete `propagatedRowCount.ts`, `propagatedColumnCount.ts`, `propagatedRowCapacity.ts`, `propagatedColumnCapacity.ts`, `propagatedCountingRow.ts`, `propagatedCountingColumn.ts`
- [ ] **6-I** `src/rules/index.ts` — replace six imports with three factory imports and update all six entries
- [ ] Run `npm test`
- [ ] Validate: run `sieve --file puzzles.sbn` and confirm rule usage counts are identical to baseline

### Phase 7 — CLI Debug Removals

- [ ] **7-A** `src/cli.ts` — delete the entire `benchmark()` function (~150 lines)
- [ ] **7-A** `src/cli.ts` — delete the `--file` mode branch in `main()`
- [ ] **7-A** `src/cli.ts` — delete the `--trace --seed N` branch in the generate path
- [ ] **7-A** `src/cli.ts` — remove the `--seed`, `--verbose`, and `--unsolved` flags from arg parsing and help text
- [ ] **7-A** `src/cli.ts` — remove the `RULE_METADATA` import
- [ ] **7-A** `src/cli.ts` — remove the `decodePuzzleString` import
- [ ] **7-B** `src/rules/index.ts` — delete `export const RULE_METADATA = allRules.map(...)`
- [ ] **7-B** `src/solver.ts` — delete `export { RULE_METADATA } from "./rules"`
- [ ] Run `npm test`

---

## Phase 0 — Library Debug Removals

Remove debug-only exports from the **library** (generator, sieve, solver). Do **not** touch `cli.ts` yet — the benchmark CLI stays alive through Phase 6 as a validation tool.

### 0-A: Remove `layout()` from `generator.ts`

`layout()` is the deterministic single-attempt export. Its only callers are the `--trace --seed N` CLI path and the sieve deterministic mode — both being removed in Phase 7.

**`src/generator.ts`** — delete the export and its JSDoc:

```ts
// DELETE THIS ENTIRE BLOCK:
/**
 * Generate board layout from specific seed. For deterministic testing.
 */
export function layout(size: number, stars: number, seed: number): Board {
  validateInputs(size, stars);
  return layoutWithSeed(size, stars, seed);
}
```

`layoutWithSeed` stays private (it's the real implementation). `generate()` stays public.

### 0-B: Remove deterministic branch from `sieve.ts`

**`src/sieve.ts`** — before:

```ts
type SieveOptions = {
  size?: number;
  stars?: number;
  count?: number;
  seed?: number; // deterministic mode: use layout() with incrementing seeds
  maxAttempts?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  onProgress?: (solved: number, attempts: number, stats: SieveStats) => void;
};

export function sieve(options: SieveOptions = {}): Puzzle[] {
  // ...
  const deterministic = options.seed !== undefined;
  // ...
  while (puzzles.length < count && stats.attempts < maxAttempts) {
    stats.attempts++;

    let board, seed: number;

    if (deterministic) {
      seed = options.seed! + stats.attempts - 1;
      try {
        board = layout(size, stars, seed);
      } catch (e) {
        if (e instanceof GeneratorError) {
          stats.failures[e.reason]++;
          options.onProgress?.(puzzles.length, stats.attempts, stats);
          continue;
        }
        throw e;
      }
    } else {
      ({ board, seed } = generate(size, stars));
    }
```

**After:**

```ts
type SieveOptions = {
  size?: number;
  stars?: number;
  count?: number;
  maxAttempts?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  onProgress?: (stats: SieveStats) => void;  // also see Phase 2-D
};

export function sieve(options: SieveOptions = {}): Puzzle[] {
  // ...
  while (puzzles.length < count && stats.attempts < maxAttempts) {
    stats.attempts++;
    const { board, seed } = generate(size, stars);
```

Also remove the `GeneratorError` import and `layout` import (no longer used after removing the deterministic branch).

### 0-C: Remove `SolveOptions.timing` from `solver.ts` — §7.17

**`src/solver.ts`** — before:

```ts
export interface SolveOptions {
  onStep?: (step: StepInfo) => void;
  timing?: Map<string, number>;
}

// ... in the loop:
for (const entry of allRules) {
  let fired: boolean;
  if (options.timing) {
    const t0 = performance.now();
    fired = entry.rule(boardDef, cells, analysis);
    options.timing.set(
      entry.name,
      (options.timing.get(entry.name) ?? 0) + (performance.now() - t0),
    );
  } else {
    fired = entry.rule(boardDef, cells, analysis);
  }
```

**After:**

```ts
export interface SolveOptions {
  onStep?: (step: StepInfo) => void;
}

// ... in the loop:
for (const entry of allRules) {
  const fired = entry.rule(boardDef, cells, analysis);
```

The `benchmark()` function in `cli.ts` passes `timing` to `solve()` — this now becomes a type error. That's fine: `benchmark()` will be removed in Phase 7. For now, temporarily remove only the `timing` option from `benchmark()`'s `solve()` call so the CLI continues to compile. The timing output column in `benchmark()` will just show 0 until Phase 7 removes it entirely.

---

## Phase 1 — Dead Field Elimination

Remove fields that are computed every cycle but never read anywhere. Every one of these is pure wasted allocation.

### 1-A: Remove `rowToRegions` / `colToRegions` from `BoardState` — §7.24

Both fields are built in `buildBoardState` on every solver cycle and never read outside `boardAnalysis.ts`. Confirmed: zero references in grep across the entire `src/` tree.

**`src/helpers/boardAnalysis.ts`** — remove from `BoardState` type:

```ts
// DELETE from type BoardState:
rowToRegions: Map<number, Set<number>>;
colToRegions: Map<number, Set<number>>;
```

Remove their construction in `buildBoardState`:

```ts
// DELETE this entire block (lines ~112–128):
const rowToRegions = new Map<number, Set<number>>();
const colToRegions = new Map<number, Set<number>>();
for (let i = 0; i < size; i++) {
  rowToRegions.set(i, new Set());
}
for (let i = 0; i < size; i++) {
  colToRegions.set(i, new Set());
}
for (const [id, meta] of regions) {
  for (const row of meta.unknownRows) {
    rowToRegions.get(row)!.add(id);
  }
  for (const col of meta.unknownCols) {
    colToRegions.get(col)!.add(id);
  }
}
```

Remove from the return object:

```ts
// BEFORE:
return {
  size,
  regions,
  rowStars,
  colStars,
  rowUnknowns,
  colUnknowns,
  rowToRegions,
  colToRegions,
};

// AFTER:
return { size, regions, rowStars, colStars, rowUnknowns, colUnknowns };
```

### 1-B: Remove `rows` / `cols` from `RegionStructure` — §7.25

These static sets (which rows/cols a region spans) are computed in `buildBoardStructure` and never read anywhere.

**`src/helpers/boardAnalysis.ts`**:

```ts
// BEFORE:
type RegionStructure = {
  id: number;
  coords: Coord[];
  rows: Set<number>;
  cols: Set<number>;
};

// AFTER:
type RegionStructure = {
  id: number;
  coords: Coord[];
};
```

Remove their construction in `buildBoardStructure`:

```ts
// DELETE:
const rows = new Set<number>();
const cols = new Set<number>();
for (const [row, col] of coords) {
  rows.add(row);
  cols.add(col);
}
regions.set(id, { id, coords, rows, cols });

// REPLACE WITH:
regions.set(id, { id, coords });
```

### 1-C: Remove `.id` from `RegionMeta` and `RegionStructure` — §7.26

Both are stored in `Map<number, ...>` keyed by that id. No rule or helper ever reads `.id` off either struct — the id is always the map key when iterating `.entries()`.

**`src/helpers/boardAnalysis.ts`**:

```ts
// BEFORE:
type RegionStructure = { id: number; coords: Coord[] };
export type RegionMeta = { id: number; unknownCoords: Coord[]; ... };

// AFTER:
type RegionStructure = { coords: Coord[] };
export type RegionMeta = {
  unknownCoords: Coord[];
  starsPlaced: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
};
```

Update construction — remove `id` from both struct literals:

```ts
// BEFORE in buildBoardStructure:
for (const [id, coords] of coordsByRegion) {
  regions.set(id, { id, coords });
}

// AFTER:
for (const [id, coords] of coordsByRegion) {
  regions.set(id, { coords });
}
```

```ts
// BEFORE in buildBoardState:
regions.set(id, {
  id,
  unknownCoords,
  starsPlaced,
  starsNeeded: stars - starsPlaced,
  unknownRows,
  unknownCols,
});

// AFTER:
regions.set(id, {
  unknownCoords,
  starsPlaced,
  starsNeeded: stars - starsPlaced,
  unknownRows,
  unknownCols,
});
```

Any iteration using `for (const [id, meta] of regions)` keeps using the map key `id` — no other changes needed.

### 1-D: Remove `.inside` and `.regionIndex` from `TightSetContrib` — §7.30

**`src/helpers/counting.ts`** — both fields are set in `extractTightSets` and never read by any rule or calling code.

```ts
// BEFORE:
export type TightSetContrib = {
  regionIndex: number;
  inside: number;
  maxContrib: number;
  starsNeeded: number;
  unknownCoords: Coord[];
};

// AFTER:
export type TightSetContrib = {
  maxContrib: number;
  starsNeeded: number;
  unknownCoords: Coord[];
};
```

Remove from the struct literal inside `extractTightSets`. `inside` is still needed as a local variable for `maxContrib` computation:

```ts
// BEFORE:
regionContribs.push({
  regionIndex: ri,
  inside,
  maxContrib: Math.min(info.starsNeeded, inside),
  starsNeeded: info.starsNeeded,
  unknownCoords: info.unknownCoords,
});

// AFTER:
const inside = blockLines.reduce(
  (sum, line) => sum + info.unknownsByAxis[line],
  0,
);
regionContribs.push({
  maxContrib: Math.min(info.starsNeeded, inside),
  starsNeeded: info.starsNeeded,
  unknownCoords: info.unknownCoords,
});
```

### 1-E: Remove `.attempts` from `GenerateResult` — §7.22

Never read by `sieve.ts`. Only ever printed in debug contexts being removed in Phase 7.

**`src/generator.ts`**:

```ts
// BEFORE:
export type GenerateResult = {
  board: Board;
  seed: number;
  attempts: number;
};
// and in generate():
return { board, seed, attempts: attempt + 1 };

// AFTER:
export type GenerateResult = {
  board: Board;
  seed: number;
};
// and:
return { board, seed };
```

---

## Phase 2 — Core Structural Fixes

### 2-A: Simplify `isValidBoard` in `solver.ts` — §7.4

The row and column DLX checks are always vacuous — `stars ≤ size/2` guarantees any full row/col can be tiled. The region DLX checks provide no actionable signal the solver doesn't already surface via `null` return. On the generator path, all three DLX checks are pure waste — the computations are thrown away before the tiling cache is initialized, so nothing is reused in cycle 1.

**`src/solver.ts`** — before:

```ts
function isValidBoard(board: Board): boolean {
  const size = board.grid.length;
  const stars = board.stars;
  const minRegionSize = stars > 1 ? stars * 2 - 1 : 1;

  const regionCells = new Map<number, [number, number][]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!regionCells.has(id)) regionCells.set(id, []);
      regionCells.get(id)!.push([r, c]);
    }
  }

  if (regionCells.size !== size) return false;

  for (const coords of regionCells.values()) {
    if (coords.length < minRegionSize) return false;
  }

  // DELETE EVERYTHING BELOW (row, col, and region DLX checks):
  for (let i = 0; i < size; i++) { ... }
  for (const coords of regionCells.values()) { ... }

  return true;
}
```

**After:**

```ts
function isValidBoard(board: Board): boolean {
  const { grid, stars } = board;
  const size = grid.length;
  const minRegionSize = stars > 1 ? stars * 2 - 1 : 1;

  const regionSizes = new Map<number, number>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = grid[r][c];
      regionSizes.set(id, (regionSizes.get(id) ?? 0) + 1);
    }
  }

  if (regionSizes.size !== size) return false;
  for (const sz of regionSizes.values()) {
    if (sz < minRegionSize) return false;
  }
  return true;
}
```

Also remove the `computeTiling` import from `solver.ts` — it is now unused there.

### 2-B: Add `stars` to `BoardState`, rename and fix `checkProgress` — §7.16, §7.18

`checkProgress` takes `board` only to read `board.stars`. The name is also misleading — it's a three-way termination check, not a progress measurement. Fix both.

**`src/helpers/boardAnalysis.ts`** — add `stars` to `BoardState`:

```ts
type BoardState = {
  size: number;
  stars: number; // ADD
  regions: Map<number, RegionMeta>;
  rowStars: number[];
  colStars: number[];
  rowUnknowns: Coord[][];
  colUnknowns: Coord[][];
};
```

Add to the `buildBoardState` return:

```ts
return { size, stars, regions, rowStars, colStars, rowUnknowns, colUnknowns };
```

**`src/solver.ts`** — rename and fix the signature:

```ts
// BEFORE:
function checkProgress(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): Progress;

// AFTER:
function getSolveStatus(
  cells: CellState[][],
  analysis: BoardAnalysis,
): Progress;
```

Replace the redundant inner cell scan — `analysis.rowUnknowns[i].length` and `analysis.colUnknowns[i].length` already have exactly what the manual count computed:

```ts
// BEFORE (inside for i loop):
let rowUnknowns = 0;
let colUnknowns = 0;
for (let j = 0; j < size; j++) {
  if (cells[i][j] === "unknown") rowUnknowns++;
  if (cells[j][i] === "unknown") colUnknowns++;
  if (cells[i][j] === "star") {
    for (const [nr, nc] of neighbors(i, j, size)) {
      if (cells[nr][nc] === "star") return "invalid";
    }
  }
}
if (rowStars[i] + rowUnknowns < stars || colStars[i] + colUnknowns < stars) {
  return "invalid";
}

// AFTER:
for (let j = 0; j < size; j++) {
  if (cells[i][j] === "star") {
    for (const [nr, nc] of neighbors(i, j, size)) {
      if (cells[nr][nc] === "star") return "invalid";
    }
  }
}
const rowUnknowns = analysis.rowUnknowns[i].length;
const colUnknowns = analysis.colUnknowns[i].length;
if (rowStars[i] + rowUnknowns < stars || colStars[i] + colUnknowns < stars) {
  return "invalid";
}
```

Update the call site in `solve()`:

```ts
// BEFORE:
const status = checkProgress(boardDef, cells, analysis);

// AFTER:
const status = getSolveStatus(cells, analysis);
```

### 2-C: Inline `assignDifficulty` in `sieve.ts` — §7.19

Three-line wrapper with exactly one call site. Delete the function and inline it:

```ts
// BEFORE:
function assignDifficulty(solution: Solution): Puzzle {
  return { ...solution, difficulty: computeDifficulty(solution) };
}
const puzzle = assignDifficulty(solution);

// AFTER:
const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };
```

### 2-D: Flatten `SieveStats` and simplify `onProgress` — §7.20, §7.21

After Phase 0 removes the deterministic branch, `generator_stuck` and `invalid_tiling` are always 0. The `failures` nesting has no remaining purpose. The `onProgress` callback also passes redundant data.

**`src/helpers/types.ts`** — remove `FailureReason`, flatten `SieveStats`, add `solved`:

```ts
// BEFORE:
export type FailureReason =
  | "generator_stuck"
  | "solver_failed"
  | "invalid_tiling";
export type SieveStats = {
  attempts: number;
  failures: Record<FailureReason, number>;
};

// AFTER — remove FailureReason entirely:
export type SieveStats = {
  attempts: number;
  solved: number;
  solverFailed: number;
};
```

**`src/sieve.ts`** — update construction, usage, and callback:

```ts
// BEFORE:
const stats: SieveStats = {
  attempts: 0,
  failures: { generator_stuck: 0, solver_failed: 0, invalid_tiling: 0 },
};
stats.failures.solver_failed++;
options.onProgress?.(puzzles.length, stats.attempts, stats);

// AFTER:
const stats: SieveStats = { attempts: 0, solved: 0, solverFailed: 0 };
stats.solverFailed++;
stats.solved = puzzles.length;
options.onProgress?.(stats);
```

Update `onProgress` type in `SieveOptions`:

```ts
onProgress?: (stats: SieveStats) => void;
```

Update the `cli.ts` benchmark call site — replace:

```ts
onProgress: (solved, attempts) =>
  process.stdout.write(`\rGenerated: ${attempts} | Solved: ${solved}`),

// AFTER:
onProgress: (stats) =>
  process.stdout.write(`\rGenerated: ${stats.attempts} | Solved: ${stats.solved}`),
```

`GeneratorError` is also now unused in `sieve.ts` (the deterministic branch that caught it was removed in Phase 0). Remove the import.

---

## Phase 3 — Correctness & Consistency Fixes

All small and independent. None touch the rule logic, only fix bugs, normalize conventions, and add missing documentation.

### 3-A: Add `tiling.tilings.length === 0` guard to `tilingAdjacencyMarks` — §7.40

The L-shape fallback in `computeTiling` returns `tilings: []` with `capacity = cells.length`. If `capacity === starsNeeded` coincidentally, `collectValidStarCells([], ...)` returns an empty Set → every unknown cell in the region gets marked incorrectly. The level-6 adjacency rules guard against this; level 4 does not.

**`src/rules/04-tilingEnumeration/tilingAdjacencyMarks.ts`** — after the capacity check, add:

```ts
const tiling = analysis.getTiling(meta.unknownCoords);
if (tiling.capacity !== meta.starsNeeded) continue;
if (tiling.tilings.length === 0) continue; // ADD: L-shape fallback guard
```

### 3-B: Use `meta.starsNeeded === 0` in `trivialRegion` — §7.37

**`src/rules/03-trivialMarks/trivialRegion.ts`** — `meta.starsNeeded` is already `board.stars - meta.starsPlaced`, computed once in `buildBoardState`. Use it directly instead of re-reading `board.stars`:

```ts
// BEFORE:
if (meta.starsPlaced === board.stars) { ... }

// AFTER:
if (meta.starsNeeded === 0) { ... }
```

After this change, `trivialRegion` no longer uses `board`. Signature becomes `(_board, cells, analysis)`.

### 3-C: Replace `board.grid.length` with `analysis.size` throughout rules — §7.38

Files using `const size = board.grid.length` when `analysis.size` is identical and already available:

- `src/rules/01-starNeighbors/starNeighbors.ts`
- `src/rules/04-tilingEnumeration/tilingAdjacencyMarks.ts`
- `src/rules/04-tilingEnumeration/tilingOverhangMarks.ts`
- `src/rules/06-tilingPairs/tilingPairAdjacencyRow.ts` + `Column.ts`
- `src/rules/06-tilingPairs/tilingPairOverhangRow.ts` + `Column.ts`
- `src/rules/06-tilingPairs/tilingPairForcedRow.ts` + `Column.ts`

In each, replace:

```ts
const size = board.grid.length;
// AFTER:
const { size } = analysis;
```

### 3-D: Normalize `extraStars` assignment to `++` in levels 8–9 — §7.41

`hypotheticalRegionCount` and `hypotheticalRegionCapacity` use `extraStars = 1` instead of `extraStars++`. Harmless for direct hypotheticals (starKeys has exactly one entry), but inconsistent with the propagated equivalents where multiple stars may be present.

In both files, change:

```ts
// BEFORE:
if (state.starKeys.has(key)) extraStars = 1;

// AFTER:
if (state.starKeys.has(key)) extraStars++;
```

### 3-E: Rename files in `10-countingHypotheticals` to match function names — §7.42

`hypotheticalUndercountingRow.ts` exports `hypotheticalCountingRow`. The filename says "Undercounting"; the export says "Counting". `rules/index.ts` already imports them as `hypotheticalCountingRow/Column` (matching the export, not the file). The files must match.

```
hypotheticalUndercountingRow.ts    → hypotheticalCountingRow.ts
hypotheticalUndercountingColumn.ts → hypotheticalCountingColumn.ts
```

Update imports in `rules/index.ts` to match the new filenames.

### 3-F: Document the `"adjacency"` asymmetry in `propagatedColumnCount` — §7.43

**`src/rules/11-propagatedHypotheticals/propagatedColumnCount.ts`**:

```ts
export default function propagatedColumnCount(...): boolean {
  return hypotheticalLoop(board, cells, analysis, true, (_row, _col, state) =>
    // "adjacency" violations are caught by propagatedRowCount, not here —
    // two adjacent stars always violate a row constraint before a col one.
    state.violation === "col",
  );
}
```

### 3-G: Document forced one-at-a-time design in level 2 rules — §7.8

Each of `forcedRow.ts`, `forcedColumn.ts`, `forcedRegion.ts` returns after placing stars in the **first** matching container only. Add the same comment to all three files:

```ts
// Fires on one container at a time — a star placement cascades adjacency marks
// which may change what's forced elsewhere. Re-entering from rule 1 after each
// placement is correct. Do NOT batch all containers into one pass.
```

### 3-H: Remove `LETTERS` alias in `cli.ts` — §7.7

```ts
// BEFORE:
import { REGION_LETTERS } from "./helpers/notation";
const LETTERS = REGION_LETTERS;

// AFTER: delete the alias, find-replace all LETTERS → REGION_LETTERS in file
import { REGION_LETTERS } from "./helpers/notation";
```

---

## Phase 4 — Performance Wins

All changes are in helper files. None affect rule logic. The benchmark CLI can verify output is unchanged before and after.

### 4-A: DLX prune non-minimal solutions — §7.29

`dlxSolve` currently finds ALL solutions. `tiling.ts` then filters to minimal-length ones. Once the first minimal-length solution is found, any branch already at that depth can be abandoned.

**`src/helpers/dlx.ts`** — thread a `minLen` ref through `search`:

```ts
export function dlxSolve(
  numPrimary: number,
  numSecondary: number,
  rows: number[][],
): number[][] {
  if (numPrimary === 0) return [[]];
  const solutions: number[][] = [];
  const minLen = { value: Infinity };
  search(buildMatrix(numPrimary, numSecondary, rows), [], solutions, minLen);
  return solutions;
}

function search(
  root: RootHeader,
  solution: number[],
  solutions: number[][],
  minLen: { value: number },
): void {
  if (solution.length >= minLen.value) return; // prune: can't beat current best

  if (root.right === root) {
    if (solution.length < minLen.value) {
      solutions.length = 0; // discard previously found longer solutions
      minLen.value = solution.length;
    }
    solutions.push([...solution]);
    return;
  }
  // ... rest of search unchanged
}
```

The `filter(s => s.length === capacity)` step in `tiling.ts` becomes a no-op (all returned solutions are already minimal-length), but leave it for defensive correctness.

### 4-B: Skip secondary column `size` tracking in `dlx.ts` — §7.28

Secondary columns are never in the root's horizontal list, so `col.size` is never consulted by the min-size column heuristic in `search`. The `size--/++` in `cover/uncover` for secondary column nodes is dead work.

**`src/helpers/dlx.ts`** — add `isPrimary` to `ColumnHeader`, set it in `buildMatrix`, gate the size updates:

```ts
interface ColumnHeader extends DLXNode {
  size: number;
  isPrimary: boolean;
}

// In buildMatrix, when building the primary circular list:
for (let i = 0; i < numPrimary; i++) {
  columns[i].isPrimary = true;
}
for (let i = numPrimary; i < columns.length; i++) {
  columns[i].isPrimary = false;
}

// In cover:
function cover(col: ColumnHeader): void {
  col.right.left = col.left;
  col.left.right = col.right;
  for (let row = col.down; row !== col; row = row.down)
    for (let node = row.right; node !== row; node = node.right) {
      node.down.up = node.up;
      node.up.down = node.down;
      if (node.column.isPrimary) node.column.size--; // gate: primary only
    }
}
// Mirror change in uncover: if (node.column.isPrimary) node.column.size++;
```

### 4-C: Optimize `forcedCells` computation in `tiling.ts` — §7.27

The current implementation is O(cells × tilings × tiles × coveredCells). Replace with two O-linear passes using precomputed solo-cell sets.

**`src/helpers/tiling.ts`** — replace the `forcedCells` block at the end of `computeTiling`:

```ts
// BEFORE:
const forcedCells: Coord[] = [];
for (const cell of cells) {
  const key = cell[0] * gridSize + cell[1];
  const forcedInAll = tilings.every((tiling) => {
    const tile = tiling.find((t) =>
      t.coveredCells.some((c) => c[0] * gridSize + c[1] === key),
    );
    return tile && tile.coveredCells.length === 1;
  });
  if (forcedInAll) forcedCells.push(cell);
}

// AFTER:
const soloMaps = tilings.map((tiling) => {
  const solo = new Set<number>();
  for (const tile of tiling) {
    if (tile.coveredCells.length === 1) {
      const [r, c] = tile.coveredCells[0];
      solo.add(r * gridSize + c);
    }
  }
  return solo;
});
const forcedCells: Coord[] = cells.filter(([r, c]) =>
  soloMaps.every((solo) => solo.has(r * gridSize + c)),
);
```

### 4-D: Eliminate per-mask object allocation in `tilingCounting.ts` — §7.31

Inside `tilingCountingLoop`, every region that passes the mask check pushes `{ meta, minContrib }` into an `entries` array — one object allocation per candidate. Most are discarded when `totalMin !== totalNeeded`. Replace with two preallocated flat arrays reset each iteration.

**`src/helpers/tilingCounting.ts`** — before the outer `for mask` loop:

```ts
const entryMetas: RegionMeta[] = [];
const entryContribs: number[] = [];
```

Inside the mask loop, replace:

```ts
// BEFORE:
const entries: { meta: RegionMeta; minContrib: number }[] = [];
// ...
entries.push({ meta, minContrib });
// ...
for (const { meta, minContrib } of entries) {
  if (deduct(cells, mask, meta, minContrib)) changed = true;
}

// AFTER:
entryMetas.length = 0;
entryContribs.length = 0;
// ...
entryMetas.push(meta);
entryContribs.push(minContrib);
// ...
for (let ei = 0; ei < entryMetas.length; ei++) {
  if (deduct(cells, mask, entryMetas[ei], entryContribs[ei])) changed = true;
}
```

### 4-E: Fix incremental adjacency check in `hypotheticals.ts` — §7.32, §7.33

Two issues in `propagateHypothetical` / `scanBoard`:

**Issue 1 (§7.32):** The adjacency check in `scanBoard` re-validates all O(stars²) star pairs every round. Previously-validated pairs don't need rechecking — only new forced stars need checking against existing ones.

**Issue 2 (§7.33):** When adding each forced star, `buildMarkedCellSet(fr, fc, size)` allocates a 9-element intermediate Set and immediately iterates it into `marked`. The intermediate Set is then discarded.

Both are fixed together by moving the adjacency check and mark-building into `propagateHypothetical` at the point where each forced star is added:

```ts
// In propagateHypothetical, when iterating forced stars:
for (const [fr, fc] of forced) {
  const newKey = cellKey(fr, fc, size);

  // Check new star against all existing hypothetical stars only (incremental)
  for (const existingKey of starKeys) {
    const er = Math.floor(existingKey / size);
    const ec = existingKey % size;
    if (cellsAreAdjacent([fr, fc], [er, ec])) {
      return { violation: "adjacency", starKeys, marked };
    }
  }

  starKeys.add(newKey);
  // Inline neighbor marking — no intermediate Set allocation
  marked.add(newKey);
  for (const [nr, nc] of neighbors(fr, fc, size)) {
    marked.add(cellKey(nr, nc, size));
  }
}
```

Remove the adjacency pairwise loop from `scanBoard` entirely — it is now done incrementally above, one new star at a time.

---

## Phase 5 — API Completion

### 5-A: Add `encodePuzzleString` to `notation.ts` — §7.10, §7.23

The module currently only decodes. Without an encoder, generated puzzles cannot be serialized in the format the system itself can read — the generate→library→solve round-trip is broken.

**`src/helpers/notation.ts`**:

```ts
export function encodePuzzleString(puzzle: Puzzle): string {
  const { board, seed, difficulty, maxLevel, cycles } = puzzle;
  const size = board.grid.length;

  const layout = Array.from({ length: size }, (_, r) =>
    Array.from(
      { length: size },
      (_, c) => REGION_LETTERS[board.grid[r][c]],
    ).join(""),
  ).join("");

  const header = `${size}x${board.stars}`;
  const meta = `s${seed}d${difficulty}l${maxLevel}c${cycles}v1`;

  return `${header}.${layout}.${meta}`;
}
```

Produces strings that round-trip through `decodePuzzleString` exactly.

Also fix two minor inefficiencies in `decodePuzzleString` while touching this file — §7.36:

```ts
// BEFORE: char.toUpperCase() called per character in the loop
const char = layout[row * size + col];
const regionId = REGION_LETTERS.indexOf(char.toUpperCase());

// AFTER: uppercase once before the loop
const upperLayout = layout.toUpperCase();
// ... then:
const regionId = REGION_LETTERS.indexOf(upperLayout[row * size + col]);
```

```ts
// BEFORE: grid.flat() allocates a full N²-element array just to build a Set
const regionIds = new Set(grid.flat());

// AFTER: build the set incrementally during grid construction (one pass)
// Add to the Set inside the existing row/col loop, remove the separate check
```

### 5-B: Move input validation into the library — §7.13

The CLI currently validates `size` 4–25, `stars` 1–6, `count` 1–300, but the library functions accept any values. A library that silently accepts invalid inputs is a footgun.

**`src/generator.ts`** — extend `validateInputs`:

```ts
function validateInputs(size: number, stars: number): void {
  if (!Number.isInteger(size) || size < 4 || size > 25)
    throw new Error(`size must be an integer between 4 and 25, got ${size}`);
  if (!Number.isInteger(stars) || stars < 1 || stars > 6)
    throw new Error(`stars must be an integer between 1 and 6, got ${stars}`);
  if (stars > Math.floor(size / 2))
    throw new Error(
      `stars (${stars}) cannot exceed size/2 (${Math.floor(size / 2)})`,
    );
}
```

**`src/sieve.ts`** — validate `count` at entry:

```ts
if (!Number.isInteger(count) || count < 1 || count > 300)
  throw new Error(`count must be an integer between 1 and 300, got ${count}`);
```

In `cli.ts`, remove the now-duplicate validation checks and let the library throw. The `process.exit(1)` error handling paths become dead code.

### 5-C: Update generate mode output to emit puzzle strings — §7.23

After 5-A adds `encodePuzzleString`, the generate mode should print in a format the system can read back:

```ts
for (const p of puzzles) {
  console.log(encodePuzzleString(p));
}
```

This closes the round-trip: `sieve --count 100 > puzzles.sbn` → `sieve --file puzzles.sbn` (validates each one). The optional human-readable board printout can remain as a comment for debugging:

```ts
// console.log(`# Seed: ${p.seed} Difficulty: ${p.difficulty}`);
// printBoard(p.board.grid);
```

---

## Phase 6 — Rule Collapse: Axis-Parameterized Factory

**The core structural refactor.** Every `*Row.ts` / `*Column.ts` pair becomes one factory function that returns a `Rule` closure. ~20 redundant files are eliminated. The `Rule` type is unchanged — factories return `(board, cells, analysis) => boolean`, which satisfies it exactly.

**Validate before and after:** Run `sieve --file puzzles.sbn` with the benchmark CLI before starting Phase 6 and record rule usage counts. Run it again after each sub-step. Counts must be identical (same rules fired, same number of times). The benchmark CLI stays alive exactly for this purpose.

**The pattern:**

```ts
// A factory function closes over `axis` and returns a Rule:
export function ruleFactory(axis: "row" | "col"): Rule {
  return (board, cells, analysis) => {
    // `axis` is captured; the rest is the rule logic
  };
}

// In rules/index.ts, invoked once at module load — no runtime overhead:
{ rule: ruleFactory("row"), level: N, name: "..." },
{ rule: ruleFactory("col"), level: N, name: "..." },
```

---

### 6-A: Level 2 — `forcedRow` + `forcedColumn` → `forcedPlacement` — §7.1

Delete `forcedRow.ts` and `forcedColumn.ts`. Create `02-forcedPlacements/forcedPlacement.ts`:

```ts
import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

// Fires on one container at a time — a star placement cascades adjacency marks
// which may change what's forced elsewhere. Re-entering from rule 1 after each
// placement is correct. Do NOT batch all containers into one pass.
export function forcedPlacement(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
    const axisUnknowns =
      axis === "row" ? analysis.rowUnknowns : analysis.colUnknowns;
    for (let i = 0; i < analysis.size; i++) {
      const needed = board.stars - axisStars[i];
      const unknowns = axisUnknowns[i];
      if (needed > 0 && unknowns.length === needed) {
        for (const [r, c] of unknowns) cells[r][c] = "star";
        return true;
      }
    }
    return false;
  };
}
```

`forcedRegion.ts` stays — it iterates regions, not axes.

### 6-B: Level 3 — `trivialRow` + `trivialColumn` → `trivialMarks` — §7.1

Delete both files. Create `03-trivialMarks/trivialMarks.ts`:

```ts
export function trivialMarks(axis: "row" | "col") {
  return function (
    _board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
    const axisUnknowns =
      axis === "row" ? analysis.rowUnknowns : analysis.colUnknowns;
    let changed = false;
    for (let i = 0; i < analysis.size; i++) {
      if (axisStars[i] !== analysis.stars) continue;
      for (const [r, c] of axisUnknowns[i]) {
        cells[r][c] = "marked";
        changed = true;
      }
    }
    return changed;
  };
}
```

`trivialRegion.ts` stays.

### 6-C: Level 4 — `tilingForcedRow` + `tilingForcedColumn` → `tilingForcedLine` — §7.1

Delete both files. Create `04-tilingEnumeration/tilingForcedLine.ts`:

```ts
export function tilingForcedLine(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;
    const axisUnknowns =
      axis === "row" ? analysis.rowUnknowns : analysis.colUnknowns;
    for (let i = 0; i < analysis.size; i++) {
      const needed = board.stars - axisStars[i];
      if (needed <= 0) continue;
      const unknowns = axisUnknowns[i];
      const tiling = analysis.getTiling(unknowns);
      if (tiling.capacity !== needed) continue;
      for (const [r, c] of tiling.forcedCells) {
        if (cells[r][c] === "unknown") {
          cells[r][c] = "star";
          return true;
        }
      }
    }
    return false;
  };
}
```

`tilingForcedRegion.ts`, `tilingAdjacencyMarks.ts`, `tilingOverhangMarks.ts` stay.

### 6-D: Level 5 — `countingMarkRow` + `countingMarkColumn` → `countingMark` — §7.1

Delete both. Create `05-countingEnumeration/countingMark.ts`:

```ts
export function countingMark(axis: "row" | "col") {
  return function (
    _board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const flow = analysis.getCountingFlow(axis);
    if (!flow.feasible) return false;
    for (const ts of flow.tightSets) {
      for (const contrib of ts.regionContribs) {
        if (contrib.maxContrib !== contrib.starsNeeded) continue;
        let changed = false;
        for (const [r, c] of contrib.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if (!((ts.mask >> lineIdx) & 1) && cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
        if (changed) return true;
      }
    }
    return false;
  };
}
```

### 6-E: Level 6 — Six tiling pair files → three factories — §7.1

Delete all six. Create three files in `06-tilingPairs/`:

**`tilingPairForced.ts`:**

```ts
export function tilingPairForced(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return squeezePairLoop(
      cells,
      size,
      board.stars,
      analysis,
      axis,
      (_pairCells, tiling) => {
        for (const [r, c] of tiling.forcedCells) {
          if (cells[r][c] === "unknown") {
            cells[r][c] = "star";
            return true;
          }
        }
        return false;
      },
    );
  };
}
```

**`tilingPairAdjacency.ts`:**

```ts
export function tilingPairAdjacency(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return squeezePairLoop(
      cells,
      size,
      board.stars,
      analysis,
      axis,
      (pairCells, tiling) => {
        if (tiling.tilings.length === 0) return false;
        const pairSet = new Set<number>(
          pairCells.map(([r, c]) => r * size + c),
        );
        const validStarCells = collectValidStarCells(
          tiling.tilings,
          pairSet,
          cells,
          size,
        );
        let changed = false;
        for (const [r, c] of pairCells) {
          if (!validStarCells.has(r * size + c) && cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
        return changed;
      },
    );
  };
}
```

**`tilingPairOverhang.ts`:**

```ts
export function tilingPairOverhang(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return squeezePairLoop(
      cells,
      size,
      board.stars,
      analysis,
      axis,
      (pairCells, tiling) => {
        if (tiling.tilings.length === 0) return false;
        const pairSet = new Set<number>(
          pairCells.map(([r, c]) => r * size + c),
        );
        const activeTilings = filterActiveTilings(
          tiling.tilings,
          pairSet,
          cells,
          size,
        );
        let changed = false;
        for (const [r, c] of findForcedOverhangCells(
          activeTilings,
          pairSet,
          size,
        )) {
          if (cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
        return changed;
      },
    );
  };
}
```

### 6-F: Level 7 — Six tiling counting files → two factories — §7.1, §7.2

`tilingCountingMark` and `groupTilingCountingMark` have identical `deduct` callbacks — only the group size parameters differ. Merge all six into two parameterized factories.

Delete all six. Create two files in `07-tilingCounting/`:

**`tilingCountingMark.ts`** — handles single-line (`minGroup=1, maxGroup=1`) and group variants (`minGroup=2, maxGroup=4`) via the same callback:

```ts
export function tilingCountingMark(
  axis: "row" | "col",
  minGroup = 1,
  maxGroup = 1,
) {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return tilingCountingLoop(
      board,
      cells,
      analysis,
      axis,
      (cells, mask, regionMeta, minContrib) => {
        if (minContrib !== 0) return false;
        let changed = false;
        for (const [r, c] of regionMeta.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if ((mask >> lineIdx) & 1 && cells[r][c] === "unknown") {
            cells[r][c] = "marked";
            changed = true;
          }
        }
        return changed;
      },
      minGroup,
      maxGroup,
    );
  };
}
```

**`tilingCountingForced.ts`:**

```ts
export function tilingCountingForced(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return tilingCountingLoop(
      board,
      cells,
      analysis,
      axis,
      (cells, mask, regionMeta, minContrib) => {
        const starsOutside = regionMeta.starsNeeded - minContrib;
        if (starsOutside <= 0) return false;
        let outsideCount = 0;
        for (const [r, c] of regionMeta.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if (!((mask >> lineIdx) & 1) && cells[r][c] === "unknown")
            outsideCount++;
        }
        if (outsideCount !== starsOutside) return false;
        let changed = false;
        for (const [r, c] of regionMeta.unknownCoords) {
          const lineIdx = axis === "row" ? r : c;
          if (!((mask >> lineIdx) & 1) && cells[r][c] === "unknown") {
            cells[r][c] = "star";
            changed = true;
          }
        }
        return changed;
      },
    );
  };
}
```

### 6-G: Levels 8–9 — Direct and Tiling Hypotheticals → axis factories — §7.1

Delete `hypotheticalRowCount.ts`, `hypotheticalColumnCount.ts`, `hypotheticalRowCapacity.ts`, `hypotheticalColumnCapacity.ts`. Create two factories:

**`08-directHypotheticals/hypotheticalCount.ts`:**

```ts
export function hypotheticalCount(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return hypotheticalLoop(
      board,
      cells,
      analysis,
      false,
      (row, col, state) => {
        const idx = axis === "row" ? row : col;
        for (
          let i = Math.max(0, idx - 1);
          i <= Math.min(size - 1, idx + 1);
          i++
        ) {
          let stars = 0,
            remaining = 0;
          for (let j = 0; j < size; j++) {
            const r = axis === "row" ? i : j;
            const c = axis === "row" ? j : i;
            const key = cellKey(r, c, size);
            if (cells[r][c] === "star" || state.starKeys.has(key)) stars++;
            else if (cells[r][c] === "unknown" && !state.marked.has(key))
              remaining++;
          }
          const needed = board.stars - stars;
          if (needed > 0 && remaining < needed) return true;
        }
        return false;
      },
    );
  };
}
```

**`09-tilingHypotheticals/hypotheticalCapacity.ts`:**

```ts
export function hypotheticalCapacity(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return hypotheticalLoop(
      board,
      cells,
      analysis,
      false,
      (row, col, state) => {
        const idx = axis === "row" ? row : col;
        for (
          let i = Math.max(0, idx - 1);
          i <= Math.min(size - 1, idx + 1);
          i++
        ) {
          let stars = 0;
          const remaining: Coord[] = [];
          for (let j = 0; j < size; j++) {
            const r = axis === "row" ? i : j;
            const c = axis === "row" ? j : i;
            const key = cellKey(r, c, size);
            if (cells[r][c] === "star" || state.starKeys.has(key)) stars++;
            else if (cells[r][c] === "unknown" && !state.marked.has(key))
              remaining.push([r, c]);
          }
          const needed = board.stars - stars;
          if (needed <= 0) continue;
          if (remaining.length < needed) return true;
          if (remaining.length >= needed * 2) continue;
          if (analysis.getTiling(remaining).capacity < needed) return true;
        }
        return false;
      },
    );
  };
}
```

`hypotheticalRegionCount.ts` and `hypotheticalRegionCapacity.ts` stay.

### 6-H: Level 10 — `hypotheticalCountingRow` + `Column` → `hypotheticalCounting` — §7.1

Both files differ only in the `axis` argument to `propagatedCountingViolation`. Delete both. Create `10-countingHypotheticals/hypotheticalCounting.ts`:

```ts
export function hypotheticalCounting(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return hypotheticalLoop(
      board,
      cells,
      analysis,
      false,
      (_row, _col, state) =>
        propagatedCountingViolation(
          board,
          cells,
          state.starKeys,
          state.marked,
          analysis,
          axis,
        ),
    );
  };
}
```

### 6-I: Level 11 — Propagated Hypotheticals → axis factories — §7.1

Eight files → three factories + two unchanged region files.

Delete `propagatedRowCount.ts`, `propagatedColumnCount.ts`, `propagatedRowCapacity.ts`, `propagatedColumnCapacity.ts`, `propagatedCountingRow.ts`, `propagatedCountingColumn.ts`.

**`propagatedCount.ts`:**

```ts
export function propagatedCount(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return hypotheticalLoop(
      board,
      cells,
      analysis,
      true,
      (_r, _c, state) =>
        state.violation === axis ||
        // Adjacency violations fall on the row checker — two adjacent stars
        // always violate a row constraint before a column one.
        (axis === "row" && state.violation === "adjacency"),
    );
  };
}
```

**`propagatedCapacity.ts`:**

```ts
export function propagatedCapacity(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    const { size } = analysis;
    return hypotheticalLoop(board, cells, analysis, true, (_r, _c, state) => {
      if (state.violation !== null) return false;
      for (let i = 0; i < size; i++) {
        let stars = 0;
        const remaining: Coord[] = [];
        for (let j = 0; j < size; j++) {
          const r = axis === "row" ? i : j;
          const c = axis === "row" ? j : i;
          const key = cellKey(r, c, size);
          if (cells[r][c] === "star" || state.starKeys.has(key)) stars++;
          else if (cells[r][c] === "unknown" && !state.marked.has(key))
            remaining.push([r, c]);
        }
        const needed = board.stars - stars;
        if (needed <= 0) continue;
        if (remaining.length < needed) return true;
        if (remaining.length >= needed * 2) continue;
        if (analysis.getTiling(remaining).capacity < needed) return true;
      }
      return false;
    });
  };
}
```

**`propagatedCounting.ts`:**

```ts
export function propagatedCounting(axis: "row" | "col") {
  return function (
    board: Board,
    cells: CellState[][],
    analysis: BoardAnalysis,
  ): boolean {
    return hypotheticalLoop(board, cells, analysis, true, (_r, _c, state) => {
      if (state.violation !== null) return false;
      return propagatedCountingViolation(
        board,
        cells,
        state.starKeys,
        state.marked,
        analysis,
        axis,
      );
    });
  };
}
```

`propagatedRegionCount.ts` and `propagatedRegionCapacity.ts` stay.

### 6-J: Update `rules/index.ts` — §7.1, §7.2

Replace all ~40 individual imports with factory imports. The `allRules` array is unchanged in content — same names, same levels, same order. Only the import sources change.

```ts
import starNeighbors from "./01-starNeighbors/starNeighbors";
import { forcedPlacement } from "./02-forcedPlacements/forcedPlacement";
import forcedRegion from "./02-forcedPlacements/forcedRegion";
import { trivialMarks } from "./03-trivialMarks/trivialMarks";
import trivialRegion from "./03-trivialMarks/trivialRegion";
import { tilingForcedLine } from "./04-tilingEnumeration/tilingForcedLine";
import tilingForcedRegion from "./04-tilingEnumeration/tilingForcedRegion";
import tilingAdjacencyMarks from "./04-tilingEnumeration/tilingAdjacencyMarks";
import tilingOverhangMarks from "./04-tilingEnumeration/tilingOverhangMarks";
import { countingMark } from "./05-countingEnumeration/countingMark";
import { tilingPairForced } from "./06-tilingPairs/tilingPairForced";
import { tilingPairAdjacency } from "./06-tilingPairs/tilingPairAdjacency";
import { tilingPairOverhang } from "./06-tilingPairs/tilingPairOverhang";
import { tilingCountingMark } from "./07-tilingCounting/tilingCountingMark";
import { tilingCountingForced } from "./07-tilingCounting/tilingCountingForced";
import { hypotheticalCount } from "./08-directHypotheticals/hypotheticalCount";
import hypotheticalRegionCount from "./08-directHypotheticals/hypotheticalRegionCount";
import { hypotheticalCapacity } from "./09-tilingHypotheticals/hypotheticalCapacity";
import hypotheticalRegionCapacity from "./09-tilingHypotheticals/hypotheticalRegionCapacity";
import { hypotheticalCounting } from "./10-countingHypotheticals/hypotheticalCounting";
import { propagatedCount } from "./11-propagatedHypotheticals/propagatedCount";
import propagatedRegionCount from "./11-propagatedHypotheticals/propagatedRegionCount";
import { propagatedCapacity } from "./11-propagatedHypotheticals/propagatedCapacity";
import propagatedRegionCapacity from "./11-propagatedHypotheticals/propagatedRegionCapacity";
import { propagatedCounting } from "./11-propagatedHypotheticals/propagatedCounting";

export const allRules: RuleEntry[] = [
  { rule: starNeighbors, level: 1, name: "Star Neighbors" },
  { rule: forcedPlacement("row"), level: 2, name: "Forced Rows" },
  { rule: forcedPlacement("col"), level: 2, name: "Forced Columns" },
  { rule: forcedRegion, level: 2, name: "Forced Regions" },
  { rule: trivialMarks("row"), level: 3, name: "Trivial Rows" },
  { rule: trivialMarks("col"), level: 3, name: "Trivial Columns" },
  { rule: trivialRegion, level: 3, name: "Trivial Regions" },
  { rule: tilingForcedLine("row"), level: 4, name: "Tiling Forced Rows" },
  { rule: tilingForcedLine("col"), level: 4, name: "Tiling Forced Columns" },
  { rule: tilingForcedRegion, level: 4, name: "Tiling Forced Regions" },
  { rule: tilingAdjacencyMarks, level: 4, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 4, name: "Tiling Overhang Marks" },
  { rule: countingMark("row"), level: 5, name: "Counting Mark Rows" },
  { rule: countingMark("col"), level: 5, name: "Counting Mark Columns" },
  { rule: tilingPairForced("row"), level: 6, name: "Tiling Pair Forced Rows" },
  {
    rule: tilingPairForced("col"),
    level: 6,
    name: "Tiling Pair Forced Columns",
  },
  {
    rule: tilingPairAdjacency("row"),
    level: 6,
    name: "Tiling Pair Adjacency Rows",
  },
  {
    rule: tilingPairAdjacency("col"),
    level: 6,
    name: "Tiling Pair Adjacency Columns",
  },
  {
    rule: tilingPairOverhang("row"),
    level: 6,
    name: "Tiling Pair Overhang Rows",
  },
  {
    rule: tilingPairOverhang("col"),
    level: 6,
    name: "Tiling Pair Overhang Columns",
  },
  {
    rule: tilingCountingMark("row"),
    level: 7,
    name: "Tiling Counting Mark Rows",
  },
  {
    rule: tilingCountingMark("col"),
    level: 7,
    name: "Tiling Counting Mark Columns",
  },
  {
    rule: tilingCountingForced("row"),
    level: 7,
    name: "Tiling Counting Forced Rows",
  },
  {
    rule: tilingCountingForced("col"),
    level: 7,
    name: "Tiling Counting Forced Columns",
  },
  {
    rule: tilingCountingMark("row", 2, 4),
    level: 7,
    name: "Group Tiling Counting Mark Rows",
  },
  {
    rule: tilingCountingMark("col", 2, 4),
    level: 7,
    name: "Group Tiling Counting Mark Columns",
  },
  { rule: hypotheticalCount("row"), level: 8, name: "Hypothetical Row Count" },
  {
    rule: hypotheticalCount("col"),
    level: 8,
    name: "Hypothetical Column Count",
  },
  {
    rule: hypotheticalRegionCount,
    level: 8,
    name: "Hypothetical Region Count",
  },
  {
    rule: hypotheticalCapacity("row"),
    level: 9,
    name: "Hypothetical Row Capacity",
  },
  {
    rule: hypotheticalCapacity("col"),
    level: 9,
    name: "Hypothetical Column Capacity",
  },
  {
    rule: hypotheticalRegionCapacity,
    level: 9,
    name: "Hypothetical Region Capacity",
  },
  {
    rule: hypotheticalCounting("row"),
    level: 10,
    name: "Hypothetical Counting Row",
  },
  {
    rule: hypotheticalCounting("col"),
    level: 10,
    name: "Hypothetical Counting Column",
  },
  {
    rule: propagatedCount("row"),
    level: 11,
    name: "Propagated Hypothetical Row Count",
  },
  {
    rule: propagatedCount("col"),
    level: 11,
    name: "Propagated Hypothetical Column Count",
  },
  {
    rule: propagatedRegionCount,
    level: 11,
    name: "Propagated Hypothetical Region Count",
  },
  {
    rule: propagatedCapacity("row"),
    level: 11,
    name: "Propagated Hypothetical Row Capacity",
  },
  {
    rule: propagatedCapacity("col"),
    level: 11,
    name: "Propagated Hypothetical Column Capacity",
  },
  {
    rule: propagatedRegionCapacity,
    level: 11,
    name: "Propagated Hypothetical Region Capacity",
  },
  {
    rule: propagatedCounting("row"),
    level: 11,
    name: "Propagated Hypothetical Counting Row",
  },
  {
    rule: propagatedCounting("col"),
    level: 11,
    name: "Propagated Hypothetical Counting Column",
  },
];
```

**File count after Phase 6:**

| Directory       | Before | After  | Delta   |
| --------------- | ------ | ------ | ------- |
| `src/rules/02`  | 3      | 2      | -1      |
| `src/rules/03`  | 3      | 2      | -1      |
| `src/rules/04`  | 5      | 4      | -1      |
| `src/rules/05`  | 2      | 1      | -1      |
| `src/rules/06`  | 6      | 3      | -3      |
| `src/rules/07`  | 6      | 2      | -4      |
| `src/rules/08`  | 3      | 2      | -1      |
| `src/rules/09`  | 3      | 2      | -1      |
| `src/rules/10`  | 2      | 1      | -1      |
| `src/rules/11`  | 8      | 5      | -3      |
| **Total rules** | **41** | **24** | **-17** |

---

## Phase 7 — CLI Debug Removals

Phase 6 is complete and validated. The benchmark is no longer needed. Remove all remaining debug CLI infrastructure.

### 7-A: Remove `benchmark()` and related flags from `cli.ts` — §7.6, §7.14, §7.17

Remove:

- The entire `benchmark()` function (~150 lines)
- The `--file` mode branch in `main()`
- The `--trace --seed N` branch in the generate path (calls the now-gone `layout()`)
- The `--seed N` flag in generate mode (fed the now-gone sieve deterministic mode)
- The `--verbose` and `--unsolved` flags (benchmark-only)
- Import of `RULE_METADATA` (only used by benchmark)
- Import of `decodePuzzleString` (only used by benchmark)

The CLI reduces to two modes — **stdin solve** and **generate**:

```ts
async function main() {
  const args = parseArgs();
  const hasStdin = !process.stdin.isTTY;

  if (args.help === "true") {
    console.log(`Usage:
  echo "<grid>" | sieve --stars n
  sieve [--size n] [--stars n] [--count n] [--minDiff n] [--maxDiff n]`);
  } else if (hasStdin) {
    const input = await readStdin();
    const stars = args.stars ? parseInt(args.stars, 10) : 2;
    traceBoard(parseGridFromStdin(input, stars));
  } else {
    const size = args.size ? parseInt(args.size, 10) : 10;
    const stars = args.stars ? parseInt(args.stars, 10) : 2;
    const count = args.count ? parseInt(args.count, 10) : 1;
    const minDiff = args.minDiff ? parseInt(args.minDiff, 10) : undefined;
    const maxDiff = args.maxDiff ? parseInt(args.maxDiff, 10) : undefined;
    // sieve() now throws on invalid inputs (Phase 5-B), so no duplicate validation here
    // ...
  }
}
```

### 7-B: Remove `RULE_METADATA` export — §7.6

With `benchmark()` gone, `RULE_METADATA` has no callers.

```ts
// DELETE from rules/index.ts:
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));

// DELETE from solver.ts:
export { RULE_METADATA } from "./rules";
```

---

## Deferred Smells — Acknowledged, Not in This Refactor

These smells from `research.md` are real but are either minor, risky to change without deeper domain context, or would be better addressed as standalone follow-up work:

| Smell | Description                                                         | Why deferred                                                                                                                               |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| §7.3  | `tilingCountingLoop` is O(2^N) for group enumeration                | Fixing requires replacing bitmask iteration with combinatorial enumeration — a standalone algorithm change, not a cleanup                  |
| §7.5  | `buildBoardAnalysis` rebuilds all maps from scratch every cycle     | True architectural inefficiency; requires incremental state tracking which is a larger rewrite                                             |
| §7.9  | Some rule functions don't use all `(board, cells, analysis)` params | After Phase 6, region rules still legitimately use `board`. The axis factories use all params. Residual mismatch in region files is minor. |
| §7.11 | `fillRemaining` in generator has O(N⁴) worst case                   | The `maxIterations` guard is adequate; the case is rare in practice. Not worth the risk of changing generator behavior.                    |
| §7.12 | Seed arithmetic in `generate()` is confusing                        | Harmless for correctness; a cosmetic issue with no user-visible impact                                                                     |
| §7.15 | `computeTiling` "no cover" fallback is a silent approximation       | Requires a deeper understanding of which board shapes trigger it and what the correct response should be                                   |
| §7.39 | `insideSet` rebuilt independently in two rules                      | After Phase 6, both rules are gone (collapsed into region-level factories). The issue resolves itself.                                     |

---

## Invariants to Preserve

Run `npm test` after each phase. Additionally, `sieve --file puzzles.sbn` before and after Phase 6 must produce identical rule usage counts.

1. **Rule order in `allRules` is identical** — same names, same levels, same sequence. Solver behavior is entirely determined by this ordering.
2. **`solve()` returns `null` for the same boards it did before** — no correctness regression.
3. **`sieve()` produces structurally valid `Puzzle[]`** — `difficulty` in 1–100, `maxLevel` in 1–11, `cells` fully resolved.
4. **`decodePuzzleString` / `encodePuzzleString` round-trip** — `decode(encode(puzzle)).board` deep-equals `puzzle.board` for any generated puzzle.
5. **The tiling cache key format is unchanged** — same sorted-index join, same hit rate.
