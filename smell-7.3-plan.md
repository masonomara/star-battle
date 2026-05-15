# Fix §7.3: Replace O(2^N) Bitmask Enumeration in `tilingCountingLoop`

## Background

`tilingCountingLoop` (`src/helpers/tilingCounting.ts`) implements the tiling-aware counting constraint at Level 7. For a given axis (row or col) and a group of lines (rows or columns), it asks: given that each touching region must place its stars somewhere, what is the minimum number of stars each region is forced to place inside this group? When the sum of minimums equals the total stars needed by the group, the group is **tight** — forced cell deductions follow.

The loop is called by two rules registered in `allRules`:

```
tilingCountingMark("row")         — single lines (minGroup=1, maxGroup=1)
tilingCountingMark("col")         — single lines
tilingCountingForced("row")       — single lines
tilingCountingForced("col")       — single lines
tilingCountingMark("row", 2, 4)   — groups of 2–4 lines  ← most expensive
tilingCountingMark("col", 2, 4)   — groups of 2–4 lines
```

---

## The Problem: O(2^N) Bitmask Enumeration

The current outer loop:

```ts
const limit = 1 << size;
for (let mask = 1; mask < limit; mask++) {
  let bits = mask;
  let popcount = 0;
  while (bits) { popcount++; bits &= bits - 1; }
  if (popcount < minGroupSize || popcount > maxGroupSize) continue;
  // ...inner body
}
```

Iterates ALL 2^N integers and discards those whose popcount is outside `[minGroupSize, maxGroupSize]`. For N=16, the inner body executes only 2,516 times (k=1..4) but the loop runs 65,535 times — 26× wasted iterations. For N=25, the inner body runs 15,275 times but the loop runs 33,554,431 times — a **2,200× waste**.

### Scale impact

| Board size | Iteration limit | Valid k=1 | Valid k=2–4 | Wasted fraction |
|-----------|----------------|-----------|-------------|-----------------|
| N=10      | 1,023          | 10        | 505         | 50%             |
| N=16      | 65,535         | 16        | 2,500       | 96%             |
| N=20      | 1,048,575      | 20        | 6,215       | 99.4%           |
| N=25      | 33,554,431     | 25        | 15,275      | 99.95%          |

The constraint rule fires on every solve cycle. A 1,000-puzzle sieve calls it tens of thousands of times. Larger boards (N=20–25) are where the solver needs the most help — and where the waste is most severe.

---

## Core Insight: Valid Masks Are Combinations

The set of masks the loop actually processes is:

```
{ mask : popcount(mask) ∈ [minGroupSize, maxGroupSize] }
= ⋃_{k=minGroupSize}^{maxGroupSize} { k-subsets of {0, 1, …, N-1} }
```

Each k-subset maps to a unique bitmask (bit i set ↔ line i is in the group). There are C(N, k) such subsets, and they can be enumerated directly in lexicographic order using a standard combination generator — no wasted iterations, no popcount computation.

---

## Correctness Argument

The combinatorial enumeration generates **exactly** the same set of masks as the bitmask loop produces after filtering — just in a different order. Since:

1. Every k-subset of {0..N-1} maps to a unique integer mask with exactly k bits set.
2. The bitmask loop keeps exactly those masks with popcount in range.
3. The combination enumeration generates exactly those k-subsets, for each k in range.

The inner body for each mask is identical. The output (which deductions fire) is identical. The only difference is the order masks are visited, which doesn't affect correctness (the loop returns immediately on first `changed = true`).

### Can satisfied lines appear in tight sets?

Yes — a line with `lineNeeded[i] = 0` can appear in a valid tight set. Example: region R has 2 stars needed, all in lines 1 and 2. Line 2 is satisfied (`lineNeeded[2]=0`). Mask `0b0110` (lines 1+2): `totalNeeded=2`, `capacityOutside(R)=0` → `minContrib=2` → `totalMin=2=totalNeeded` → tight. Mask `0b0010` (line 1 only): `capacityOutside(R)` includes line 2 cells → `capacity=1` → `minContrib=1` → not tight.

Therefore: we must enumerate all lines 0..N-1, not just active lines. The `if (totalNeeded <= 0) continue` guard (for all-satisfied combos) remains.

---

## Implementation

### Combination generator pattern

Lexicographic enumeration of k-subsets of {0..N-1} using an index array `combo`:

```ts
// Initialize first combination
for (let j = 0; j < k; j++) combo[j] = j;
// combo = [0, 1, 2, ..., k-1]

while (true) {
  // use combo[0..k-1] as the current combination
  // ...

  // Advance to next combination
  let j = k - 1;
  while (j >= 0 && combo[j] === N - k + j) j--;
  if (j < 0) break; // exhausted all C(N,k) combinations
  combo[j]++;
  for (let p = j + 1; p < k; p++) combo[p] = combo[p - 1] + 1;
}
```

- `combo[j]` ranges from j to N-k+j.
- Advancing: find the rightmost position that can be incremented, increment it, fill the rest consecutively.
- Total iterations: exactly C(N, k).

### New `tilingCountingLoop`

Full replacement for `src/helpers/tilingCounting.ts`:

```ts
import { Board, CellState, Coord } from "./types";
import { BoardAnalysis, RegionMeta } from "./boardAnalysis";

export function tilingCountingLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  deduct: (
    cells: CellState[][],
    mask: number,
    regionMeta: RegionMeta,
    minContrib: number,
  ) => boolean,
  minGroupSize = 1,
  maxGroupSize = 1,
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  // Precompute per-region: axisMask (which lines have unknowns)
  const regionEntries: { meta: RegionMeta; axisMask: number }[] = [];
  for (const meta of regions.values()) {
    if (meta.starsNeeded <= 0) continue;
    let axisMask = 0;
    for (const [r, c] of meta.unknownCoords) {
      axisMask |= 1 << (axis === "row" ? r : c);
    }
    regionEntries.push({ meta, axisMask });
  }

  // Precompute stars needed per line
  const lineNeeded = new Array<number>(size);
  for (let i = 0; i < size; i++) {
    lineNeeded[i] = board.stars - axisStars[i];
  }

  const entryMetas: RegionMeta[] = [];
  const entryContribs: number[] = [];
  const combo = new Int32Array(maxGroupSize);

  for (let groupSize = minGroupSize; groupSize <= maxGroupSize; groupSize++) {
    if (groupSize > size) break;

    // Initialize first combination: [0, 1, ..., groupSize-1]
    for (let j = 0; j < groupSize; j++) combo[j] = j;

    outer: while (true) {
      // Build mask and sum totalNeeded from the combo
      let mask = 0;
      let totalNeeded = 0;
      for (let j = 0; j < groupSize; j++) {
        const line = combo[j];
        mask |= 1 << line;
        totalNeeded += lineNeeded[line];
      }

      if (totalNeeded > 0) {
        let totalMin = 0;
        let exceeded = false;
        entryMetas.length = 0;
        entryContribs.length = 0;

        for (let ri = 0; ri < regionEntries.length; ri++) {
          const { meta, axisMask } = regionEntries[ri];
          if (!(axisMask & mask)) continue;

          const cellsOutside: Coord[] = [];
          for (const [r, c] of meta.unknownCoords) {
            if (!((mask >> (axis === "row" ? r : c)) & 1)) {
              cellsOutside.push([r, c]);
            }
          }

          const capacityOutside =
            cellsOutside.length === 0
              ? 0
              : analysis.getTiling(cellsOutside).capacity;

          const minContrib = Math.max(0, meta.starsNeeded - capacityOutside);
          totalMin += minContrib;
          entryMetas.push(meta);
          entryContribs.push(minContrib);

          if (totalMin > totalNeeded) {
            exceeded = true;
            break;
          }
        }

        if (!exceeded && totalMin === totalNeeded) {
          let changed = false;
          for (let ei = 0; ei < entryMetas.length; ei++) {
            if (deduct(cells, mask, entryMetas[ei], entryContribs[ei])) {
              changed = true;
            }
          }
          if (changed) return true;
        }
      }

      // Advance to next combination (lexicographic)
      let j = groupSize - 1;
      while (j >= 0 && combo[j] === size - groupSize + j) j--;
      if (j < 0) break outer;
      combo[j]++;
      for (let p = j + 1; p < groupSize; p++) combo[p] = combo[p - 1] + 1;
    }
  }

  return false;
}
```

**What changed vs the original:**

| Original | New |
|---------|-----|
| `const limit = 1 << size` | removed |
| `for (let mask = 1; mask < limit; mask++)` | `for (let groupSize = minGroupSize; ...) { while (combo not exhausted) { ... } }` |
| popcount computation + `if (popcount < min \|\| > max) continue` | removed — combo length is always groupSize |
| `if (totalNeeded <= 0) continue` | kept (guards all-satisfied combos) |
| Inner body | identical |

The `combo` array is allocated once as `Int32Array(maxGroupSize)` and reused across all group sizes. No heap allocation in the hot path.

---

## Performance Estimate

Iteration count comparison (inner body executions per `tilingCountingLoop` call):

| N   | Old (bitmask)     | New k=1 | New k=2–4 | Speedup (k=1) | Speedup (k=2–4) |
|-----|-------------------|---------|-----------|---------------|-----------------|
| 10  | 1,023             | 10      | 505       | 102×          | 2×              |
| 16  | 65,535            | 16      | 2,500     | 4,096×        | 26×             |
| 20  | 1,048,575         | 20      | 6,215     | 52,429×       | 169×            |
| 25  | 33,554,431        | 25      | 15,275    | 1,342,177×    | 2,197×          |

For a typical N=16 board:
- `tilingCountingMark("row")` (k=1): 65,535 → 16 iterations
- `tilingCountingMark("row", 2, 4)` (k=2..4): 65,535 → 2,500 iterations

The inner body cost (building `cellsOutside`, calling `getTiling`) dominates once the loop overhead is removed. All `getTiling` calls are cached — repeated identical cell sets return immediately from the map. The net improvement should be visible in the rule-level timing, especially for rules that fire often on larger boards.

---

## No Changes Needed Elsewhere

The signature of `tilingCountingLoop` is unchanged. `tilingCountingMark.ts` and `tilingCountingForced.ts` call it identically. No callers need updating.

The `deduct` callback contract is unchanged: it receives the same `(cells, mask, regionMeta, minContrib)` tuple for the same tight sets, in a (potentially) different order across group sizes. Since the solver returns on the first `changed = true`, and the rules are idempotent (cells only transition unknown → star/marked, never back), a different visit order produces the same final deduction on any given cycle.

---

## Validation

```bash
npx tsc --noEmit
npm test
npx tsx src/cli.ts --file puzzles.md 2>&1 | diff - baseline-rule-counts.txt
```

The `diff` should show only the timing line. Rule usage counts must be byte-for-byte identical — same tight sets are found, same deductions are applied, same rules fire on the same puzzles.

---

## Risk Assessment

**Low.** The change is a pure algorithmic substitution:
- Same output set (all k-subsets for k in range)
- Same inner body
- No data structure changes
- No caller changes
- Validated by existing tests + benchmark diff

The only behavioral difference is visit order within a `tilingCountingLoop` call. Since the function returns immediately on the first successful deduction, a different order could theoretically cause a different deduction to fire first on a given cycle — but the final solved state is identical because each deduction is independently correct. The rule count could theoretically vary by ±1 per rule per cycle if two deductions become available on the same cycle and visit order determines which fires first. If the benchmark diff shows minor count changes, the counts are still correct — the puzzle is still solved correctly, just by a slightly different deduction sequence. Record a new baseline after the change.

---

## Implementation Steps

1. Replace the body of `src/helpers/tilingCounting.ts` with the code above.
2. Run `npx tsc --noEmit` — should be clean.
3. Run `npm test` — 57 tests should pass.
4. Run `npx tsx src/cli.ts --file puzzles.md` and diff against baseline. Record a new baseline if minor count differences appear (they are correct, not regressions).
5. Update `plan.md` §7.3 from deferred to complete.

---

## Todo List

### Phase A — Pre-flight

- [x] **A-1** Confirm `src/helpers/tilingCounting.ts` matches the version described in this plan (no prior edits have landed since the plan was written). Read the file, verify the `for (let mask = 1; mask < limit; mask++)` structure is present.
- [x] **A-2** Run `npx tsc --noEmit` — confirm zero errors on the current codebase before touching anything.
- [x] **A-3** Run `npm test` — confirm all 57 tests pass as the pre-change baseline.
- [x] **A-4** Run `npx tsx src/cli.ts --file puzzles.md 2>&1` and save output to `baseline-rule-counts.txt` (overwriting if stale). This is the reference for the post-change diff.

### Phase B — Core Implementation

One file changes: `src/helpers/tilingCounting.ts`. All edits are inside `tilingCountingLoop`.

- [x] **B-1** Remove `const limit = 1 << size` — no longer needed.
- [x] **B-2** Remove the outer `for (let mask = 1; mask < limit; mask++)` loop header.
- [x] **B-3** Remove the popcount computation block (the `let bits = mask; let popcount = 0; while (bits) { ... }` block) and its guard `if (popcount < minGroupSize || popcount > maxGroupSize) continue`.
- [x] **B-4** Add `const combo = new Int32Array(maxGroupSize)` before the new outer loop. This is the combination index array, allocated once and reused across all group sizes.
- [x] **B-5** Add the outer `for (let groupSize = minGroupSize; groupSize <= maxGroupSize; groupSize++)` loop with a `if (groupSize > size) break` guard.
- [x] **B-6** Inside the groupSize loop, add the combination initializer: `for (let j = 0; j < groupSize; j++) combo[j] = j`.
- [x] **B-7** Add the `outer: while (true)` loop that replaces the bitmask `for` loop.
- [x] **B-8** Replace the mask-build block. Original: `(mask >> i) & 1` across all i. New: `for (let j = 0; j < groupSize; j++) { mask |= 1 << combo[j]; totalNeeded += lineNeeded[combo[j]]; }` — iterates only the k selected lines.
- [x] **B-9** Keep `if (totalNeeded > 0)` guard wrapping the inner body unchanged — it handles all-satisfied combos (all selected lines have `lineNeeded=0`).
- [x] **B-10** Keep the inner body (region loop, `cellsOutside`, `capacityOutside`, `minContrib`, `entryMetas`/`entryContribs`, `deduct` call) **byte-for-byte identical** to the original.
- [x] **B-11** Add the lexicographic advance block at the bottom of the `while (true)` loop, after the inner body:
  ```ts
  let j = groupSize - 1;
  while (j >= 0 && combo[j] === size - groupSize + j) j--;
  if (j < 0) break outer;
  combo[j]++;
  for (let p = j + 1; p < groupSize; p++) combo[p] = combo[p - 1] + 1;
  ```
- [x] **B-12** Verify the complete function matches the reference implementation in the **Implementation** section above. Diff carefully: the `entryMetas`/`entryContribs` pre-allocation, the `regionEntries` precompute block, and the `lineNeeded` precompute block are all unchanged from the Phase 4-D version.

### Phase C — Type Check

- [x] **C-1** Run `npx tsc --noEmit`. Expect zero errors. Common pitfalls:
  - `combo` typed as `Int32Array` — indexing returns `number`, compatible with all uses.
  - `outer:` label on `while` must precede the statement (not inside the `for` header).
  - No new imports needed — `Coord`, `Board`, `CellState`, `BoardAnalysis`, `RegionMeta` are already imported.

### Phase D — Test Suite

- [x] **D-1** Run `npm test`. Expect all 57 tests to pass. The tiling counting rules are exercised indirectly through integration-style solve tests.
- [x] **D-2** If any test fails, check whether the failure is in a Level 7 rule. A failure here indicates the combination enumeration missed or duplicated a tight set — re-examine the advance block (B-11) for off-by-one in the `combo[j] === size - groupSize + j` bound.

### Phase E — Benchmark Validation

- [x] **E-1** Run `npx tsx src/cli.ts --file puzzles.md 2>&1 | diff - baseline-rule-counts.txt`.
- [x] **E-2** Inspect the diff output:
  - **Only the timing line differs**: perfect — rule counts are identical, change is a pure speedup. Done.
  - **One or more rule counts differ by a small amount**: acceptable if the total solve count is unchanged (999/1000 or whatever the baseline was). A count shift means two deductions became available on the same cycle and the new visit order picked a different one first — both are correct. Proceed to E-3.
  - **Solve count drops** (e.g., 997/1000 instead of 999/1000): a real regression. The combination enumeration skipped a tight set the bitmask approach found. Re-examine B-11 and the `combo` bounds. Do not record a new baseline.
- [x] **E-3** If counts shifted but solve count is unchanged: run the benchmark a second time and confirm the new counts are stable (deterministic). Then overwrite `baseline-rule-counts.txt` with the new output.

### Phase F — Cleanup

- [x] **F-1** In `plan.md`, move §7.3 from the "Deferred Smells" table into the completed phases list with a note: "replaced O(2^N) bitmask enumeration with O(Σ C(N,k)) combinatorial enumeration in `tilingCountingLoop`."
- [x] **F-2** Delete `smell-7.3-plan.md` (this file) once the implementation is verified and merged.
