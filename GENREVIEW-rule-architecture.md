# Rule Architecture Review

**Generated:** 2026-02-02
**Based on:** Kris Pengy's Star Battle Guide (https://kris.pengy.ca/starbattle)
**Scope:** All 16 solver rules in `src/sieve/rules/`

---

## Executive Summary

The solver implements 16 rules based on Kris Pengy's human-deducible techniques. While functionally correct, the codebase has significant **architectural fragmentation**:

- **3 core patterns** reimplemented **16 different ways**
- **7+ copies** of "active region" calculation
- **4 rules** with identical hypothetical-testing loops
- **4 rules** doing the same counting math differently

This document maps the interconnections and proposes consolidation.

---

## Audit Results by Rule

### Passing (Correct Implementation)

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 1 | Star Neighbors | Pass | Clean 8-neighbor marking |
| 2 | Row Complete | Pass | Simple, correct |
| 3 | Column Complete | Pass | Simple, correct |
| 4 | Region Complete | Pass | 2 TODO test stubs |
| 5 | Forced Placement | Pass | Handles rows, cols, regions |
| 8 | 2x2 Tiling | Pass | Uses DLX correctly |
| 10 | Exclusion | Pass | Uses MIS (better than spec) |
| 13 | Squeeze | Pass | Core logic correct |

### Issues Found

| # | Rule | Severity | Issue |
|---|------|----------|-------|
| 6 | Undercounting | Low | Union-based seeding may miss edge cases |
| 7 | Overcounting | Medium | Inactive region handling too conservative |
| 9 | 1xn Confinement | Medium | Missing "exactly one star" constraint upgrade |
| 11 | Pressured Exclusion | Medium | Potential constraint double-counting |
| 12 | Finned Counts | High | Wrong row set, missing overcounting tests |
| 14 | Composite Regions | Medium | Magic numbers, incomplete tests |
| 15 | Deep Exclusion | Low | Uses propagation depth, not branching |

---

## Pattern Analysis

### Pattern 1: Active Region Calculation

**Found in:** Rules 6, 7, 9, 11, 12, 14, 16

Each rule independently computes which regions still need stars:

```typescript
// Rule 6 (undercounting.ts:39-41)
const active = [...regionRows.keys()].filter(
  (id) => regionStars.get(id)! < board.stars,
);

// Rule 7 (overcounting.ts:71-73)
const active = new Set(
  [...regions.keys()].filter((id) => regionStars.get(id)! < board.stars),
);

// Rule 12 (finnedCounts.ts:59-63)
const active = [...regionUnknownRows.keys()].filter((id) => {
  const needed = board.stars - regionStars.get(id)!;
  const hasUnknowns = regionUnknownRows.get(id)!.size > 0;
  return needed > 0 && hasUnknowns;
});
```

**Problem:** 7+ near-identical implementations with subtle variations.

**Solution:** Single `BoardAnalysis` object computed once per solver cycle.

---

### Pattern 2: Counting Family

**Rules 6, 7, 12, 16** all answer the same question:

> Given a set of lines (rows/cols) and a set of regions, can they satisfy each other's star requirements?

| Rule | Direction | Question | Action |
|------|-----------|----------|--------|
| 6 | Under | N regions in N rows? | Mark outside regions |
| 7 | Over | N rows in N regions? | Mark outside rows |
| 12 | Finned | Hypothetical creates violation? | Mark the cell |
| 16 | Pressured | Capacity bounds tight? | Mark forced cells |

**The unified math:**

```typescript
interface LineRegionBalance {
  lines: Set<number>;
  regions: Set<number>;
  starsNeededByLines: number;
  starsNeededByRegions: number;
  isTight: boolean;      // starsNeeded === starsAvailable
  isViolation: boolean;  // starsNeeded > starsAvailable
}
```

All 4 rules are different ways of:
1. Finding line/region combinations
2. Applying this balance calculation
3. Acting when `isTight` or `isViolation`

---

### Pattern 3: Constraint Family

**Rules 9, 11, 13, 14** detect "constraints" - areas that must contribute known star counts:

| Rule | Constraint Type | Detection Method |
|------|-----------------|------------------|
| 9 | 1xn confinement | Strip analysis |
| 11 | Star-containing 2x2 | From squeeze |
| 13 | Star-containing 2x2 | Tile row/col pairs |
| 14 | Composite region | Counting surplus |

**Problem:** No shared `Constraint` type. Each rule defines its own structure.

**Solution:**

```typescript
interface Constraint {
  id: string;
  cells: Coord[];
  starsMin: number;
  starsMax: number;
  source: '1xn' | '2x2' | 'region' | 'composite';
}
```

---

### Pattern 4: Hypothetical Testing

**Rules 10, 11, 12, 15** all do:

```typescript
for each unknown cell:
    hypothetically place star
    check if board becomes unsolvable
    if so, mark the cell
```

| Rule | Contradiction Check |
|------|---------------------|
| 10 | Region/row/col can't fit stars (MIS) |
| 11 | Same + constraint awareness |
| 12 | Creates counting violation |
| 15 | Propagation leads to contradiction |

**Problem:** Loop reimplemented 4 times with different checks.

**Solution:**

```typescript
type ContradictionCheck =
  | { type: 'capacity' }
  | { type: 'capacity-pressured', constraints: Constraint[] }
  | { type: 'counting' }
  | { type: 'propagation', depth: number };

function testHypothetical(
  board: Board,
  cells: CellState[][],
  row: number,
  col: number,
  checks: ContradictionCheck[]
): boolean;
```

---

## The Inactive Region Bug

**Affected:** Rules 7, 12 (and potentially others)

**Issue:** When checking if "N rows are contained in N regions," the code requires ALL cells to belong to the region set. But cells in inactive regions (already have all stars) should be ignored.

**Example:**
```
Row 0: [Active Region A cells] [Inactive Region B cells]
```

Current code fails validation because Region B isn't in the active set, even though B's stars are already placed and don't affect the counting.

**Root cause:** No shared abstraction defines how inactive regions should be handled.

**Fix:** Define once in `LineRegionBalance`:

```typescript
function analyzeBalance(
  lines: Set<number>,
  regions: Set<number>,
  options: {
    includeInactiveRegions: boolean  // false for counting, true for containment
  }
): LineRegionBalance;
```

---

## Missing from Kris Pengy's Guide

The codebase implements 16 rules. Kris Pengy's guide describes 22 techniques.

**Intentionally omitted (require guessing):**
- By a Thread (uniqueness)
- At Sea (uniqueness)
- By a Thread At Sea (uniqueness)

**Not implemented:**
- Simple Shapes (reference patterns)
- Set Differentials
- Fish / Finned Fish
- n-Rooks
- Entanglement
- Kissing Ls (2-star specific)
- The M (2-star specific)
- Pressured Ts (2-star specific)

These may explain some of the 151 unsolved Krazydad puzzles.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BoardAnalysis                               │
│  (computed ONCE per solver cycle)                                │
├─────────────────────────────────────────────────────────────────┤
│  - regions, regionStars, activeRegions, inactiveRegions         │
│  - rowStars, colStars, activeRows, activeCols                   │
│  - regionToRows, regionToCols, rowToRegions, colToRegions       │
│  - stripCache (for 1xn detection)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ConstraintDetector                            │
├─────────────────────────────────────────────────────────────────┤
│  Inputs: BoardAnalysis                                          │
│  Outputs: Constraint[]                                          │
│                                                                  │
│  Sources:                                                        │
│  - 1xn confinement (Rule 9)                                     │
│  - 2x2 tiling (Rule 8)                                          │
│  - Squeeze (Rule 13)                                            │
│  - Composite regions (Rule 14)                                  │
│  - Counting relationships (Rules 6, 7, 16)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TrivialPropagation                             │
├─────────────────────────────────────────────────────────────────┤
│  Rules 1-5: Star neighbors, row/col/region complete,           │
│             forced placement                                     │
│                                                                  │
│  Fast rules that run after every constraint application         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  HypotheticalTester                              │
├─────────────────────────────────────────────────────────────────┤
│  For cells that can't be resolved by propagation:               │
│  - Test placing a star hypothetically                           │
│  - Check if contradiction arises (capacity, counting, etc.)     │
│                                                                  │
│  Consolidates Rules 10, 11, 12, 15                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Consolidation Plan

### Phase 1: Extract Shared Utilities (Low Risk)

| Task | Description | Files Created |
|------|-------------|---------------|
| 1.1 | Create `BoardAnalysis` type and builder | `helpers/boardAnalysis.ts` |
| 1.2 | Create `LineRegionBalance` calculator | `helpers/lineRegionBalance.ts` |
| 1.3 | Create unified hypothetical tester | `helpers/hypotheticalTester.ts` |
| 1.4 | Create `Constraint` type | `helpers/constraint.ts` |

### Phase 2: Refactor Counting Rules (Medium Risk)

| Task | Description | Impact |
|------|-------------|--------|
| 2.1 | Merge undercounting + overcounting | Rules 6, 7 share core logic |
| 2.2 | Simplify finned counts | Rule 12 uses shared counting |
| 2.3 | Connect overcounting | Rule 16 uses shared balance |

### Phase 3: Unify Constraint System (Higher Risk)

| Task | Description | Impact |
|------|-------------|--------|
| 3.1 | Create `ConstraintPool` | Central registry |
| 3.2 | Refactor 1xn to emit Constraints | Rule 9 |
| 3.3 | Refactor squeeze to emit Constraints | Rule 13 |
| 3.4 | Refactor composite to use Constraints | Rule 14 |

---

## Estimated Impact

| Metric | Current | After Consolidation |
|--------|---------|---------------------|
| Lines of rule code | ~2000 | ~800 (60% reduction) |
| Active region calculations | 7 | 1 |
| Counting implementations | 4 | 1 |
| Hypothetical loops | 4 | 1 |
| Constraint type definitions | 4 | 1 |

---

## Test Coverage Gaps

| Rule | Gap |
|------|-----|
| 4 | 2 TODO test stubs |
| 12 | No overcounting tests |
| 14 | Only no-op tests |
| 16 | **No test file** |

---

## Junior Developer Tasks

### Week 1: Quick Wins
1. Fix comment rule numbers (Rules 8, 10, 11, 12)
2. Remove unused `capacityInside` variable (Rule 16)
3. Extract magic number `span <= 3` to constant (Rule 16)

### Week 2: Test Coverage
4. Complete TODO test stubs (Rule 4)
5. Add overcounting tests (Rule 12)
6. Create test file for Rule 16

### Week 3: Medium Refactoring
7. Add positive test cases (Rule 14)
8. Deduplicate row/col logic (Rule 11)

### Week 4+: Architecture (Pair with Senior)
9. Create `BoardAnalysis` helper
10. Fix inactive region handling (Rules 7, 12)
11. Add "exactly one star" propagation (Rule 9)

---

## References

- Kris Pengy's Star Battle Guide: https://kris.pengy.ca/starbattle
- Production rules spec: `/docs/specs/02-production-rules.md`
- Krazydad test results: `/krazydad-test.md` (849/1000 = 85% solved)
