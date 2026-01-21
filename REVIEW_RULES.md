# Comprehensive Code Review: Star Battle Sieve Rules

**Files Reviewed:** 11 rule implementations in `src/sieve/rules/`
**Date:** 2026-01-21

---

## Table of Contents

1. [Rule 01: trivialNeighbors](#rule-01-trivialneighbors)
2. [Rule 02: trivialRows](#rule-02-trivialrows)
3. [Rule 03: trivialColumns](#rule-03-trivialcolumns)
4. [Rule 04: trivialRegions](#rule-04-trivialregions)
5. [Rule 05: forcedPlacement](#rule-05-forcedplacement)
6. [Rule 06: twoByTwoTiling](#rule-06-twobytwtiling)
7. [Rule 07: oneByNConfinement](#rule-07-onebynconfinement)
8. [Rule 08: exclusion](#rule-08-exclusion)
9. [Rule 09: pressuredExclusion](#rule-09-pressuredexclusion)
10. [Rule 10: undercounting](#rule-10-undercounting)
11. [Rule 11: overcounting](#rule-11-overcounting)
12. [Consolidated Action Items](#consolidated-action-items)

---

## Rule 01: trivialNeighbors

**File:** `01-trivialNeighbors/trivialNeighbors.ts`
**Lines:** 40
**Simplicity:** ✓ Clean

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 9: `cells[0].length` assumes non-empty array. Will throw if `cells` is `[]`. **FIXED** |
| **Taoist (PM)** | Clean, single responsibility. Two focused functions. No issues. |
| **Lawyerly (Edge)** | Empty `cells` array causes runtime crash. **FIXED** |
| **Nicaraguan (Dev)** | Naming confusion: `trivialNeighbors` vs `markNeighbors` — helper vs rule not obvious. No comments explaining Star Battle adjacency rule. |

**Action Items:**
- [x] Add empty array guard (line 8)
- [ ] Add JSDoc explaining the adjacency rule being enforced

---

## Rule 02: trivialRows

**File:** `02-trivialRows/trivialRows.ts`
**Lines:** 22
**Simplicity:** ✓ Minimal

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | No issues. Clean implementation. |
| **Taoist (PM)** | Minimal, focused. Does one thing well. |
| **Lawyerly (Edge)** | Line 7: `board.grid.length = 0` results in silent no-op. Potentially masks bugs. |
| **Nicaraguan (Dev)** | Consider consolidating with `trivialColumns` into parameterized function. |

**Action Items:**
- [ ] Consider adding empty grid guard
- [ ] Consider consolidating with trivialColumns

---

## Rule 03: trivialColumns

**File:** `03-trivialColumns/trivialColumns.ts`
**Lines:** 22
**Simplicity:** ✓ Minimal

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | No issues. Mirror of trivialRows. |
| **Taoist (PM)** | Minimal, focused. Mirror of trivialRows. |
| **Lawyerly (Edge)** | Same silent no-op risk as trivialRows. |
| **Nicaraguan (Dev)** | Near-duplicate of trivialRows. Extract shared helper. |

**Action Items:**
- [ ] Consider consolidating with trivialRows

---

## Rule 04: trivialRegions

**File:** `04-trivialRegions/trivialRegions.ts`
**Lines:** 19
**Simplicity:** ✓ Clean

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | No issues. |
| **Taoist (PM)** | Clean abstraction over regions. |
| **Lawyerly (Edge)** | Line 6: If `buildRegions` returns empty map, silent no-op. Correct but undocumented. |
| **Nicaraguan (Dev)** | No issues. |

**Action Items:**
- [ ] Document behavior when no regions exist

---

## Rule 05: forcedPlacement

**File:** `05-forcedPlacement/forcedPlacement.ts`
**Lines:** 78
**Simplicity:** ⚠ Pattern duplication

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 36: Only places first star when `needed > 1`. Intentional single-step behavior but undocumented. Lines 8-11: `hasAdjacentPair` correctly includes diagonal adjacency. ✓ |
| **Taoist (PM)** | Three near-identical blocks (rows/cols/regions). Pattern duplication. |
| **Lawyerly (Edge)** | Line 30: `board.stars = 0` results in `needed = 0`, skipped. Correct but undocumented. |
| **Nicaraguan (Dev)** | Line 36: `cells[unknowns[0][0]][unknowns[0][1]]` hard to read. Use destructuring. |

**Action Items:**
- [ ] Use destructuring: `const [row, col] = unknowns[0]`
- [ ] Document single-step return behavior
- [ ] Consider extracting shared iteration pattern

---

## Rule 06: twoByTwoTiling

**File:** `06-twoByTwoTiling/tiling.ts`
**Lines:** 48
**Simplicity:** ⚠ Reasonable

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 11: `_stripCache` unused parameter. Incomplete interface conformance. |
| **Taoist (PM)** | `key()` helper duplicated across files (also in rules 7, 8, 9). |
| **Lawyerly (Edge)** | No edge case issues. |
| **Nicaraguan (Dev)** | Filename `tiling.ts` doesn't match folder `06-twoByTwoTiling`. |

**Action Items:**
- [ ] Rename file to `twoByTwoTiling.ts`
- [ ] Remove unused `_stripCache` parameter
- [ ] Extract `key()` to `helpers/cellKey.ts`

---

## Rule 07: oneByNConfinement

**File:** `07-oneByNConfinement/oneByNConfinement.ts`
**Lines:** 173
**Simplicity:** ✗ Complex

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 20: `board.grid[0].length` assumes non-empty grid. **FIXED**. Lines 89-134: O(n²) nested loops with Set operations. |
| **Taoist (PM)** | Complex nested logic. Four distinct phases interleaved. Hard to trace. Returns `false` immediately if no `stripCache`. |
| **Lawyerly (Edge)** | Line 55: `strips[0]` access assumes non-empty. **FIXED** with `!` assertion. Line 17: Returns `false` if no cache. |
| **Nicaraguan (Dev)** | Lines 66-67: Triple-nested loop hard to debug. `key()` duplicated here. |

**Action Items:**
- [x] Add empty grid guard (line 18)
- [x] Add non-null assertion for `strips[0]` (line 56)
- [ ] Extract `key()` to shared helper
- [ ] Split into 3-4 smaller phase functions
- [ ] Profile Set intersections on large boards

---

## Rule 08: exclusion

**File:** `08-exclusion/exclusion.ts`
**Lines:** 76
**Simplicity:** ⚠ Acceptable

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 18: `_stripCache` unused. Line 57: String parsing `k.split(",").map(Number)` is brittle. Line 60: Full board copy per candidate — memory churn. |
| **Taoist (PM)** | Acceptable complexity for hypothesis testing. |
| **Lawyerly (Edge)** | No crash risks. |
| **Nicaraguan (Dev)** | `key()` duplicated here. |

**Action Items:**
- [ ] Remove unused `_stripCache` parameter
- [ ] Extract `key()` to shared helper
- [ ] Consider object pooling for board copies

---

## Rule 09: pressuredExclusion

**File:** `09-pressuredExclusion/pressuredExclusion.ts`
**Lines:** 94
**Simplicity:** ✗ Deep nesting

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 14: Named export inconsistency (uses `export function` not `export default`). Lines 71-72: Column-only check may miss row symmetry. Lines 48, 76: Double board copy expensive. |
| **Taoist (PM)** | Deep nesting. Two separate region loops feel redundant. Returns `false` if no `stripCache`. |
| **Lawyerly (Edge)** | No crash risks. |
| **Nicaraguan (Dev)** | Lines 71-72: Lambda inside `every()` inside `some()` — high cognitive load. `key()` duplicated here. |

**Action Items:**
- [ ] Change to `export default function`
- [ ] Extract `key()` to shared helper
- [ ] Consider reusing `temp` array to reduce copies
- [ ] Consider adding symmetric row check

---

## Rule 10: undercounting

**File:** `10-undercounting/undercounting.ts`
**Lines:** 66
**Simplicity:** ⚠ Naming issues

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 3: Named export inconsistency. |
| **Taoist (PM)** | Logic sound but `inRows`/`inCols` naming ambiguous. |
| **Lawyerly (Edge)** | Line 21: Non-null assertion `regionStars.get(id)!` safe due to prior initialization. |
| **Nicaraguan (Dev)** | No `key()` duplication. |

**Action Items:**
- [ ] Change to `export default function`
- [ ] Clarify `inRows`/`inCols` naming

---

## Rule 11: overcounting

**File:** `11-overcounting/overcounting.ts`
**Lines:** 99
**Simplicity:** ⚠ Duplication

| Perspective | Finding |
|-------------|---------|
| **Christian (Tech)** | Line 4: Named export inconsistency. Lines 36-65, 67-96: Identical logic duplicated for rows then columns. |
| **Taoist (PM)** | Row/column loops are copy-paste duplication. |
| **Lawyerly (Edge)** | Line 17: Non-null assertion safe. |
| **Nicaraguan (Dev)** | Lines 47-49: Inline loop condition mixes iteration with short-circuit. |

**Action Items:**
- [ ] Change to `export default function`
- [ ] Extract row/column logic into shared parameterized helper

---

## Consolidated Action Items

### Priority 1: Bugs/Crashes (Completed)

| Item | File:Line | Status |
|------|-----------|--------|
| Empty array guard | `01-trivialNeighbors.ts:8` | ✅ Fixed |
| Empty array guard | `07-oneByNConfinement.ts:18` | ✅ Fixed |
| Empty strips guard | `07-oneByNConfinement.ts:56` | ✅ Fixed |

### Priority 2: Consistency

| Item | Files | Action |
|------|-------|--------|
| Export style | Rules 9, 10, 11 | Change to `export default function` |
| Filename mismatch | `06-twoByTwoTiling/tiling.ts` | Rename to `twoByTwoTiling.ts` |
| Duplicate `key()` | Rules 6, 7, 8, 9 | Extract to `helpers/cellKey.ts` |
| Unused parameters | Rules 6, 8 | Remove `_stripCache` |

### Priority 3: Maintainability

| Item | Action |
|------|--------|
| JSDoc comments | Add to all exported functions |
| Mutation contract | Document that `cells` is mutated in place |
| Return semantics | Document `true` = changed, `false` = no change |
| Refactor `oneByNConfinement` | Split into 3-4 smaller phase functions |
| Refactor `overcounting` | Extract row/column shared helper |
| Consolidate trivial rules | Merge `trivialRows` + `trivialColumns` |

### Priority 4: Performance

| Item | File | Concern |
|------|------|---------|
| Board copy per candidate | `08-exclusion.ts:60` | Object pooling |
| Double board copy | `09-pressuredExclusion.ts:48,76` | Reuse arrays |
| Set intersections | `07-oneByNConfinement.ts:99-106` | Profile first |

---

_Review complete. Organized by rule number._
