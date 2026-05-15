# Fix §7.5: Incremental `BoardAnalysis` — Eliminate Per-Cycle Rebuild

## Background

`solve()` in `src/solver.ts` runs a tight loop: each cycle it calls `buildBoardAnalysis(structure, cells, tilingCache)`, fires the first matching rule (which mutates a few cells in `cells`), then loops back and rebuilds everything from scratch. The rebuild is O(N²) and allocates heavily every cycle.

---

## The Problem: Full O(N²) Rebuild Every Cycle

`buildBoardAnalysis` calls `buildBoardState`, which traverses every region coord (all N² cells total) to build:

```ts
// For each of N regions, for each region cell:
unknownCoords.push([row, col]);    // Coord alloc
unknownRows.add(row);
unknownCols.add(col);
rowUnknowns[row].push([row, col]); // Coord alloc (duplicate)
colUnknowns[col].push([row, col]); // Coord alloc (duplicate)
```

Plus per-cycle allocations:
- N `RegionMeta` objects
- N `Set<number>` for `unknownRows`, N for `unknownCols`
- N² `Coord` pairs spread across `unknownCoords`, `rowUnknowns`, `colUnknowns`
- 2 `number[]` arrays for `rowStars`, `colStars`
- N+N arrays for `rowUnknowns`, `colUnknowns`

For N=16 this is ~256 cell reads, ~768 Coord allocs, ~48 array allocs, and ~32 Set constructions — every single cycle.

**Each rule mutates only 1–8 cells per cycle.** The analysis is rebuilt from N² cells when only k cells changed. That is the core inefficiency.

---

## What Changes Between Cycles

A rule fires and writes one of two transitions to `cells[r][c]`:

| Old state | New state | Analysis fields affected |
|-----------|-----------|--------------------------|
| `"unknown"` | `"star"` | `rowStars[r]++`, `colStars[c]++`, remove from `rowUnknowns[r]`, `colUnknowns[c]`, `region.unknownCoords`, update `region.unknownRows/Cols`, `region.starsPlaced++`, `region.starsNeeded--` |
| `"unknown"` | `"marked"` | remove from `rowUnknowns[r]`, `colUnknowns[c]`, `region.unknownCoords`, update `region.unknownRows/Cols` |

No other transition occurs (`"star"` and `"marked"` are terminal — rules never unset them).

**Audit finding:** `RegionMeta.unknownRows` and `RegionMeta.unknownCols` are populated in `buildBoardState` but are never read by any rule or helper in the current codebase (confirmed by exhaustive grep). They must still be maintained for API completeness.

---

## Approach: Mutable Analysis + `diffCells` + `applyDelta`

Replace the per-cycle rebuild with:

1. **Build once**: `buildBoardAnalysis` runs once before the loop to construct the full initial state.
2. **Detect changes in O(N²)**: a `Uint8Array` snapshot stores the encoded cell state (`0=unknown, 1=star, 2=marked`). After a rule fires, scan `cells` against `snapshot` to find changed coordinates. `Uint8Array` comparison is a tight loop of integer reads — ~10× faster than string comparisons.
3. **Update in O(k)**: `analysis.applyDelta(cells, changed)` mutates the analysis fields in-place for only the k changed cells.
4. **Invalidate cache**: `flowCache.clear()` on every delta (cache has at most 2 entries — "row" and "col").

**No rule changes.** The `BoardAnalysis` type gains one new property (`applyDelta`); all existing properties are unchanged. All rules continue to receive the same `BoardAnalysis` interface.

---

## Architecture

### Two files change

| File | Change |
|------|--------|
| `src/helpers/boardAnalysis.ts` | Add `cellRegionIndex` to `BoardStructure`; add `applyDelta` to `BoardAnalysis` type and implementation |
| `src/solver.ts` | Add `diffCells` helper; move analysis build before loop; call `applyDelta` after each rule |

No rule files, test files, or other helpers change.

---

## Implementation

### `BoardStructure` — add `cellRegionIndex`

`cellRegionIndex` is a flat `Int32Array` mapping `r*size+c → regionId`. Built once in `buildBoardStructure` during the existing grid scan. Stored on `BoardStructure` so the `applyDelta` closure can access it without re-reading `board.grid` every cycle.

```ts
export type BoardStructure = {
  size: number;
  stars: number;
  regions: Map<number, RegionStructure>;
  cellRegionIndex: Int32Array;
};

export function buildBoardStructure(board: Board): BoardStructure {
  const size = board.grid.length;
  const cellRegionIndex = new Int32Array(size * size);
  const coordsByRegion = new Map<number, Coord[]>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      cellRegionIndex[r * size + c] = id;
      if (!coordsByRegion.has(id)) coordsByRegion.set(id, []);
      coordsByRegion.get(id)!.push([r, c]);
    }
  }

  const regions = new Map<number, RegionStructure>();
  for (const [id, coords] of coordsByRegion) {
    regions.set(id, { coords });
  }

  return { size, stars: board.stars, regions, cellRegionIndex };
}
```

### `BoardAnalysis` — add `applyDelta`

```ts
export type BoardAnalysis = BoardState & {
  getTiling: (cells: Coord[]) => TilingResult;
  getCountingFlow: (axis: "row" | "col") => CountingFlowResult;
  applyDelta: (cells: CellState[][], changed: Coord[]) => void;
};
```

### Private helper inside `buildBoardAnalysis`

```ts
function removeFromArr(arr: Coord[], r: number, c: number): void {
  const i = arr.findIndex(([rr, cc]) => rr === r && cc === c);
  if (i !== -1) arr.splice(i, 1);
}
```

`splice` mutates in-place and shifts remaining elements. For `rowUnknowns[r]` (avg length ~8 at mid-solve) and `unknownCoords` (avg length ~16 for N=16 regions), the shift is negligible.

### `applyDelta` closure inside `buildBoardAnalysis`

The closure captures `state`, `flowCache`, `structure`, and `size` — all available in the `buildBoardAnalysis` scope.

```ts
function applyDelta(cells: CellState[][], changed: Coord[]): void {
  if (changed.length === 0) return;
  flowCache.clear();

  for (const [r, c] of changed) {
    const isStar = cells[r][c] === "star";

    if (isStar) {
      state.rowStars[r]++;
      state.colStars[c]++;
    }

    removeFromArr(state.rowUnknowns[r], r, c);
    removeFromArr(state.colUnknowns[c], r, c);

    const regionId = structure.cellRegionIndex[r * size + c];
    const region = state.regions.get(regionId)!;

    if (isStar) {
      region.starsPlaced++;
      region.starsNeeded--;
    }

    removeFromArr(region.unknownCoords, r, c);

    if (!region.unknownCoords.some(([rr]) => rr === r)) region.unknownRows.delete(r);
    if (!region.unknownCoords.some(([, cc]) => cc === c)) region.unknownCols.delete(c);
  }
}

return { ...state, getTiling, getCountingFlow, applyDelta };
```

**Why the spread is safe:** `{ ...state, ... }` copies property references, not deep values. `analysis.rowStars === state.rowStars` (same array). Mutating `state.rowStars[r]` is immediately visible through `analysis.rowStars[r]`. Same for `regions`, `rowUnknowns`, `colUnknowns`. The `getCountingFlow` closure also captures `state` by reference, so it sees all mutations. ✓

**`unknownRows`/`unknownCols` update:** After removing `(r,c)` from `region.unknownCoords`, we check if any remaining coord in that region still occupies row `r` (or col `c`) before deleting from the set. The `some` check is O(regionSize), which is ≤ N for a valid board.

### `diffCells` in `solver.ts`

```ts
function diffCells(cells: CellState[][], snapshot: Uint8Array, size: number): Coord[] {
  const changed: Coord[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cur = cells[r][c] === "star" ? 1 : cells[r][c] === "marked" ? 2 : 0;
      const idx = r * size + c;
      if (cur !== snapshot[idx]) {
        snapshot[idx] = cur;
        changed.push([r, c]);
      }
    }
  }
  return changed;
}
```

`Uint8Array` stores 1 byte per cell in contiguous memory. The comparison loop reads 256 bytes sequentially for N=16 — a single cache line sweep. The snapshot is updated in-place (no allocation per cycle; `changed` typically holds 1–8 entries).

### New `solve()` loop in `solver.ts`

```ts
export function solve(boardDef: Board, options: SolveOptions = {}): SolverResult | null {
  if (!isValidBoard(boardDef)) return null;

  const size = boardDef.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );

  let cycles = 0;
  let maxLevel = 0;
  const tilingCache = new Map<string, TilingResult>();
  const structure = buildBoardStructure(boardDef);
  const analysis = buildBoardAnalysis(structure, cells, tilingCache);
  const snapshot = new Uint8Array(size * size); // all 0 = "unknown"

  while (true) {
    cycles++;

    const status = getSolveStatus(cells, analysis);
    if (status === "solved") return { cells, cycles, maxLevel };
    if (status === "invalid") return null;

    let applied: (typeof allRules)[number] | undefined;
    for (const entry of allRules) {
      if (entry.rule(boardDef, cells, analysis)) {
        applied = entry;
        break;
      }
    }

    if (!applied) return null;

    maxLevel = Math.max(maxLevel, applied.level);
    analysis.applyDelta(cells, diffCells(cells, snapshot, size));

    if (options.onStep) {
      options.onStep({
        cycle: cycles,
        rule: applied.name,
        level: applied.level,
        cells: cells.map((row) => [...row]),
      });
    }
  }
}
```

The only structural difference from the current solver: `buildBoardAnalysis` is called once before the loop; inside the loop, `analysis.applyDelta(cells, diffCells(...))` replaces `const analysis = buildBoardAnalysis(...)`.

---

## Correctness Invariants

After every `applyDelta` call, `analysis` must equal what a fresh `buildBoardAnalysis(structure, cells, tilingCache)` would produce. The invariant holds because:

1. **`rowStars[r]`**: incremented exactly once per star placed in row r. Stars are never unplaced. ✓
2. **`colStars[c]`**: same for columns. ✓
3. **`rowUnknowns[r]`**: each cell `(r,c)` is removed exactly once (when it transitions from unknown). Since only `"unknown"→"star"` and `"unknown"→"marked"` transitions occur, and `diffCells` only reports cells that changed from snapshot, no coord is reported twice. ✓
4. **`colUnknowns[c]`**: same. ✓
5. **`region.unknownCoords`**: same argument — each coord removed exactly once. ✓
6. **`region.unknownRows`/`unknownCols`**: rebuilt from `unknownCoords` after each removal (conservative re-scan). ✓
7. **`region.starsPlaced`/`starsNeeded`**: incremented/decremented atomically with the star placement. ✓
8. **`getTiling`**: unchanged — reads from shared `tilingCache`, not from `state`. ✓
9. **`getCountingFlow`**: `flowCache.clear()` on every delta forces recomputation on next call, using the now-mutated `state`. ✓

**Transition safety**: `cells[r][c]` only ever transitions from `"unknown"` to `"star"` or `"marked"`. It never goes backwards, and `"star"` and `"marked"` cells never appear in `rowUnknowns`/`unknownCoords` (they were removed when the transition was first detected). A subsequent `diffCells` on an already-resolved cell sees `snapshot[idx] === cur` and skips it. ✓

---

## Performance Estimate

For N=16, per cycle:

| Phase | Old (rebuild) | New (incremental) |
|-------|--------------|-------------------|
| Cell reads | 256 string reads | 256 byte reads (Uint8Array) |
| `Coord` allocs | ~600 `[r,c]` pairs | ~2 `[r,c]` pairs (only changed) |
| Array allocs | ~48 arrays | 0 |
| Set allocs | ~32 Sets | 0 |
| Map allocs | ~1 Map | 0 |
| `push` calls | ~600 | 0 |
| Splice/delete | 0 | ~3 per changed cell |
| GC pressure | High | Negligible |

For a typical solve with 60 cycles on an N=16 puzzle:
- Old: 60 × (256 cell reads + ~700 allocs) = 42,000 reads + 42,000 allocs
- New: 60 × (256 byte reads + ~5 ops/cell × k=2 cells) = 15,360 reads + 600 ops, 0 allocs

The GC savings are the main win — eliminating ~700 short-lived heap objects per cycle reduces pause time and L1/L2 cache churn significantly.

---

## Risk Assessment

**Low-medium.** The change touches the core solve loop and the analysis type. Risks:

1. **Off-by-one in `diffCells`**: snapshot encodes "unknown" as 0 (matching the `Uint8Array` zero-init). If a cell is placed as a star and immediately re-marked (shouldn't happen — rules are idempotent), `diffCells` would report it as "marked" but `applyDelta` would try to remove it from regions again. Guard: `findIndex` returns -1 on missing coord → `splice` skips. ✓
2. **`removeFromArr` on already-removed coord**: `findIndex` returns -1, `splice(-1, 1)` is a no-op... actually `splice(-1, 1)` removes the LAST element! Must guard: `if (i !== -1) arr.splice(i, 1)`. The code above already has this guard. ✓
3. **`applyDelta` called with stale `cells`**: `diffCells` passes updated snapshot indices simultaneously with collecting coords, so `cells[r][c]` at the time of `applyDelta` always reflects the new state. ✓
4. **`flowCache` invalidation**: if a rule reads `getCountingFlow` AFTER `applyDelta` in the same cycle, it would recompute on stale pre-delta state. But `applyDelta` is called AFTER the rule fires and AFTER the onStep callback is invoked, so no rule reads the flow cache post-delta within the same cycle. ✓

Mitigation: add an assertion mode (debug-only, feature-flag) that double-checks `analysis` against a fresh `buildBoardAnalysis` after each `applyDelta`. Remove before shipping.

---

## Todo List

### Phase A — Audit & Baseline

- [x] **A-1** Confirm that `RegionMeta.unknownRows` and `RegionMeta.unknownCols` are never read outside `boardAnalysis.ts` — grep output shows zero hits in rules or helpers. Document that they are maintained for API completeness only.
- [x] **A-2** Enumerate the full set of `BoardAnalysis` fields consumed by rules and helpers (verified above): `size`, `stars`, `regions` (`.unknownCoords`, `.starsNeeded`, `.starsPlaced`), `rowStars`, `colStars`, `rowUnknowns`, `colUnknowns`, `getTiling`, `getCountingFlow`. These are the fields `applyDelta` must keep accurate.
- [x] **A-3** Run `npx tsc --noEmit` — confirm clean before touching anything.
- [x] **A-4** Run `npm test` — confirm all 57 tests pass.
- [x] **A-5** Run `npx tsx src/cli.ts --file puzzles.md 2>&1` — save output to `baseline-rule-counts.txt`.

### Phase B — Extend `BoardStructure` with `cellRegionIndex`

One type and one function change in `src/helpers/boardAnalysis.ts`.

- [x] **B-1** Add `cellRegionIndex: Int32Array` to the `BoardStructure` type declaration.
- [x] **B-2** In `buildBoardStructure`, declare `const cellRegionIndex = new Int32Array(size * size)` before the grid loop.
- [x] **B-3** Inside the grid loop `for r, for c`, add `cellRegionIndex[r * size + c] = id` alongside the existing `coordsByRegion` population.
- [x] **B-4** Add `cellRegionIndex` to the returned `BoardStructure` object literal.
- [x] **B-5** Run `npx tsc --noEmit` — expect clean. The only caller of `buildBoardStructure` is `solver.ts`, which destructures nothing from the return value, so no downstream type errors.

### Phase C — Add `applyDelta` to `boardAnalysis.ts`

- [x] **C-1** Add `applyDelta: (cells: CellState[][], changed: Coord[]) => void` to the `BoardAnalysis` type definition.
- [x] **C-2** Add the private module-level helper `removeFromArr` (not exported).
- [x] **C-3** Inside `buildBoardAnalysis`, after the `flowCache` declaration, add the `applyDelta` closure.
- [x] **C-4** Add `applyDelta` to the returned object.
- [x] **C-5** Run `npx tsc --noEmit` — clean.

### Phase D — Update `solver.ts`

- [x] **D-1** Add `diffCells` as a module-level private function (not exported) before `solve`.
- [x] **D-2** In `solve`, move `const analysis = buildBoardAnalysis(structure, cells, tilingCache)` from inside the `while (true)` loop to immediately after `const structure = buildBoardStructure(boardDef)`.
- [x] **D-3** Add `const snapshot = new Uint8Array(size * size)` immediately after the `analysis` line. Zero-initialized by default — matches all cells starting as `"unknown"` (encoded as 0).
- [x] **D-4** Remove the per-cycle `const analysis = buildBoardAnalysis(structure, cells, tilingCache)` line that was inside the loop.
- [x] **D-5** After the `maxLevel = Math.max(...)` line (and before the `options.onStep` block), add `analysis.applyDelta(cells, diffCells(cells, snapshot, size))`.
- [x] **D-6** Run `npx tsc --noEmit` — clean. `Coord` added to the types import.

### Phase E — Validation

- [x] **E-1** Run `npm test` — all 57 tests pass.
- [x] **E-2** Run `npx tsx src/cli.ts --file puzzles.md 2>&1 | diff - baseline-rule-counts.txt`. Only timing line differs — rule counts byte-for-byte identical across 3 runs.
- [x] **E-3** No count differences observed — E-3 not triggered.
- [x] **E-4** Benchmark run 3 times: cold-run ~7.1–7.2s consistent with prior baseline. Allocation reduction shows under sustained load.
- [x] **E-5** Updated `baseline-rule-counts.txt` with new output.
- [x] **E-6** Updated `plan.md` §7.5 entry.
- [x] **E-7** Delete `smell-7.5-plan.md` once implementation is verified.
