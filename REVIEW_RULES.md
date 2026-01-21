# Comprehensive Code Review: Star Battle Sieve Rules

**Files Reviewed:** 11 rule implementations in `src/sieve/rules/`
**Date:** 2026-01-21

---

## Table of Contents

1. [Christian Senior Software Engineer Review](#1-christian-senior-software-engineer-review)
2. [Taoist Project Manager Review](#2-taoist-project-manager-review)
3. [Lawyerly Supervisor Review](#3-lawyerly-supervisor-review)
4. [Nicaraguan Coworker Review](#4-nicaraguan-coworker-review)
5. [Consolidated Action Items](#5-consolidated-action-items)

---

## 1. Christian Senior Software Engineer Review

_Focus: Technical accuracy, security, code quality_

### 1.1 Critical Issues

| File                      | Line | Issue                                                                                                                                                                    |
| ------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-trivialNeighbors.ts`  | 9    | **Unsafe array access**: `cells[0].length` assumes non-empty array. Will throw if `cells` is `[]`.                                                                       |
| `07-oneByNConfinement.ts` | 20   | **Same issue**: `board.grid[0].length` assumes non-empty grid.                                                                                                           |
| `05-forcedPlacement.ts`   | 36   | **Only places first star**: When `needed > 1` and `unknowns.length === needed`, only `unknowns[0]` is placed. This is intentional single-step behavior but undocumented. |

### 1.2 Type Safety Concerns

| File                       | Line | Issue                                                                                        |
| -------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| `06-twoByTwoTiling.ts`     | 11   | `_stripCache` unused parameter suggests incomplete interface conformance.                    |
| `08-exclusion.ts`          | 18   | Same: `_stripCache` parameter unused.                                                        |
| `09-pressuredExclusion.ts` | 14   | **Named export inconsistency**: Uses `export function` but other rules use `export default`. |
| `10-undercounting.ts`      | 3    | **Missing default export**: Same inconsistency.                                              |
| `11-overcounting.ts`       | 4    | **Missing default export**: Same inconsistency.                                              |

### 1.3 Algorithm Correctness

| File                       | Line  | Issue                                                                                                                                           |
| -------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `05-forcedPlacement.ts`    | 8-11  | `hasAdjacentPair` uses `<= 1` for both row and column deltas, correctly including diagonal adjacency per Star Battle rules. ✓ Verified correct. |
| `08-exclusion.ts`          | 57    | String parsing `k.split(",").map(Number)` is brittle. Negative coordinates would parse correctly, but malformed keys would fail silently.       |
| `09-pressuredExclusion.ts` | 71-72 | Column-only check (`c === fc`) in `colUsedInAll`. No symmetric row check exists. May miss deduction opportunities.                              |

### 1.4 Performance Concerns

| File                       | Line         | Issue                                                                                                            |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `07-oneByNConfinement.ts`  | 89-134       | Nested loops over `tilingCache` with multiple `Set` operations. O(n²) at minimum for covered cell intersection.  |
| `08-exclusion.ts`          | 60           | `cells.map(r => [...r])` creates full board copy per candidate cell. For large boards, significant memory churn. |
| `09-pressuredExclusion.ts` | 48, 76       | Double board copy per candidate (`temp` then `blocked`). Expensive for deep hypothesis testing.                  |
| `11-overcounting.ts`       | 36-65, 67-96 | Identical logic duplicated for rows then columns. Should extract parameterized helper.                           |

### 1.5 Security Assessment

No external inputs, network calls, or file system access. Code is deterministic puzzle-solving logic. **No security concerns.**

---

## 2. Taoist Project Manager Review

_Focus: Flow, simplicity, scope creep_

### 2.1 Simplicity Assessment

| Rating | File                       | Lines | Notes                                                                  |
| ------ | -------------------------- | ----- | ---------------------------------------------------------------------- |
| ✓      | `01-trivialNeighbors.ts`   | 40    | Clean, single responsibility. Two focused functions.                   |
| ✓      | `02-trivialRows.ts`        | 22    | Minimal, focused. Does one thing well.                                 |
| ✓      | `03-trivialColumns.ts`     | 22    | Minimal, focused. Mirror of trivialRows.                               |
| ✓      | `04-trivialRegions.ts`     | 19    | Clean abstraction over regions.                                        |
| ⚠      | `05-forcedPlacement.ts`    | 78    | Three near-identical blocks (rows/cols/regions). Pattern duplication.  |
| ⚠      | `06-twoByTwoTiling.ts`     | 48    | Reasonable but `key()` helper duplicated across files.                 |
| ✗      | `07-oneByNConfinement.ts`  | 173   | Complex nested logic. Four distinct phases interleaved. Hard to trace. |
| ⚠      | `08-exclusion.ts`          | 76    | Acceptable complexity for hypothesis testing.                          |
| ✗      | `09-pressuredExclusion.ts` | 94    | Deep nesting. Two separate region loops feel redundant.                |
| ⚠      | `10-undercounting.ts`      | 66    | Logic sound but `inRows`/`inCols` naming ambiguous.                    |
| ⚠      | `11-overcounting.ts`       | 99    | Row/column loops are copy-paste duplication.                           |

### 2.2 Flow Disruptions

1. **Inconsistent return patterns**:
   - Rules 1-4 mark ALL qualifying cells, return `true` if ANY changed
   - Rules 5-9 return `true` immediately after ONE change
   - This affects solver loop efficiency unpredictably

2. **Cache dependency creates conditional paths**:
   - Rule 7 (`oneByNConfinement`) returns `false` immediately if no `stripCache`
   - Rule 9 (`pressuredExclusion`) same behavior
   - Creates two execution modes that should be documented

3. **Export inconsistency breaks pattern**:
   - Rules 1-8: `export default function`
   - Rules 9-11: `export function` (named export)
   - Disrupts import patterns for consumers

### 2.3 Duplication Analysis

The `key()` function appears in 4 files:

- `06-twoByTwoTiling.ts:5`
- `07-oneByNConfinement.ts:9`
- `08-exclusion.ts:12`
- `09-pressuredExclusion.ts:12`

All identical: `const key = (r: number, c: number) => \`${r},${c}\``

### 2.4 Recommendations

**Remove:**

- Underscore-prefixed unused parameters (`_stripCache` in rules 6, 8)

**Simplify:**

- Extract `key()` to shared utility
- Consider consolidating `trivialRows` + `trivialColumns` into parameterized function
- Split `oneByNConfinement` into phase-specific functions

**Standardize:**

- All rules should use `export default` for consistency
- Document return semantics (batch vs immediate)

---

## 3. Lawyerly Supervisor Review

_Focus: Liability, compliance, edge cases, defensive programming_

### 3.1 Unhandled Edge Cases

| File                      | Line | Scenario                                  | Risk                                                         |
| ------------------------- | ---- | ----------------------------------------- | ------------------------------------------------------------ |
| `01-trivialNeighbors.ts`  | 9    | Empty `cells` array                       | Runtime crash: `cells[0]` is undefined                       |
| `02-trivialRows.ts`       | 7    | `board.grid.length` = 0                   | Silent no-op, potentially masking bugs                       |
| `04-trivialRegions.ts`    | 6    | `buildRegions` returns empty map          | Silent no-op, correct but undocumented                       |
| `05-forcedPlacement.ts`   | 30   | `board.stars` = 0                         | `needed` = 0, skipped. Correct but undocumented.             |
| `07-oneByNConfinement.ts` | 55   | `strips[0]` access                        | Assumes non-empty. Could crash if region has no strips.      |
| `07-oneByNConfinement.ts` | 17   | `stripCache` is undefined                 | Returns `false` immediately. Documented by return statement. |
| `10-undercounting.ts`     | 21   | Non-null assertion `regionStars.get(id)!` | Safe due to prior initialization on line 17                  |
| `11-overcounting.ts`      | 17   | Non-null assertion `regionStars.get(id)!` | Safe due to prior initialization on line 13                  |

### 3.2 Assertions / Contracts Missing

None of the functions validate their inputs. Consider adding:

- `assert(cells.length > 0)` guards
- `assert(board.stars >= 0)` preconditions
- Runtime checks for external data integrity

### 3.3 Mutation Documentation

**All rules mutate the `cells` parameter in place.** This side-effect contract is:

- Intentional (solver relies on it)
- Undocumented (no JSDoc or comment mentions it)
- Consistent across all rules

**Contract should be explicit:** "Functions modify `cells` directly. Caller must clone if original state is needed."

### 3.4 Boolean Return Contract

The implicit contract is:

- `true` = state changed, caller should re-run rules from beginning
- `false` = no change, caller can proceed to next rule

This is implemented consistently but never documented. Should be in a shared interface or JSDoc.

### 3.5 Compliance Gaps

- **No logging**: No tracing for debugging production issues
- **No error boundaries**: Any exception propagates to caller
- **No input sanitization**: Rules trust all input completely

---

## 4. Nicaraguan Coworker Review

_Focus: Developer practicality, maintainability, onboarding_

### 4.1 Onboarding Concerns

1. **No comments explaining rule logic**: A developer unfamiliar with Star Battle will not understand why `trivialNeighbors` marks adjacent cells. Add a one-line comment per file explaining the puzzle rule being enforced.

2. **`key()` function duplicated 4 times**: Files 6, 7, 8, 9 all define identical `const key = (r, c) => \`${r},${c}\``. Extract to `helpers/key.ts`.

3. **Magic strings**: `"unknown"`, `"star"`, `"marked"` scattered everywhere. These come from `CellState` type but developers must remember the exact strings.

4. **Naming confusion**:
   - `trivialNeighbors` vs `markNeighbors`: Function `markNeighbors` is the helper, `trivialNeighbors` is the rule. Not obvious.
   - `tiling.ts` in folder `06-twoByTwoTiling`: Filename doesn't match folder convention.
   - `pressuredExclusion` vs `exclusion`: Distinction unclear without reading code.

### 4.2 Practical Issues

| File                             | Issue                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `05-forcedPlacement.ts:36`       | `cells[unknowns[0][0]][unknowns[0][1]]` is hard to read. Use destructuring: `const [row, col] = unknowns[0]`.          |
| `07-oneByNConfinement.ts:66-67`  | Triple-nested loop: `for (const s of hStrips) for (const [r, c] of s.cells)`. Hard to debug.                           |
| `09-pressuredExclusion.ts:71-72` | Lambda inside `every()` inside `some()`. High cognitive load.                                                          |
| `11-overcounting.ts:47-49`       | Inline loop condition `for (let c = 0; c < size && valid; c++)` mixes iteration with short-circuit. Split for clarity. |

### 4.3 Suggested Quick Wins

1. **Rename `tiling.ts` to `twoByTwoTiling.ts`** to match folder naming convention.

2. **Add JSDoc** to each exported function:

   ```typescript
   /**
    * Marks all cells adjacent to placed stars as invalid.
    * Enforces Star Battle rule: No two stars can be adjacent (including diagonals).
    * @param board - The puzzle board configuration
    * @param cells - Cell state matrix (mutated in place)
    * @returns true if any cell was marked, false otherwise
    */
   ```

3. **Extract `key()` to `helpers/cellKey.ts`**:

   ```typescript
   export const cellKey = (r: number, c: number) => `${r},${c}`;
   ```

4. **Standardize exports**: All files should use `export default` or all should use named exports. Pick one.

5. **Use destructuring** in `forcedPlacement.ts`:
   ```typescript
   // Before
   cells[unknowns[0][0]][unknowns[0][1]] = "star";
   // After
   const [row, col] = unknowns[0];
   cells[row][col] = "star";
   ```

### 4.4 Testing Observations

- No test files in rule folders (e.g., `trivialNeighbors.test.ts`)
- Unit tests would catch the edge cases identified above
- Consider co-locating tests with implementation

---

## 5. Consolidated Action Items

### 5.1 Priority 1: Bugs/Crashes (Fix Immediately)

| Item               | File:Line                    | Action                                                             |
| ------------------ | ---------------------------- | ------------------------------------------------------------------ |
| Empty array guard  | `01-trivialNeighbors.ts:8-9` | Add `if (cells.length === 0) return false;`                        |
| Empty array guard  | `07-oneByNConfinement.ts:20` | Add `if (board.grid.length === 0) return false;`                   |
| Empty strips guard | `07-oneByNConfinement.ts:55` | Add `if (strips.length === 0) continue;` before `strips[0]` access |

### 5.2 Priority 2: Consistency (Fix Soon)

| Item              | Files                         | Action                                       |
| ----------------- | ----------------------------- | -------------------------------------------- |
| Export style      | Rules 9, 10, 11               | Change to `export default function`          |
| Filename mismatch | `06-twoByTwoTiling/tiling.ts` | Rename to `twoByTwoTiling.ts`                |
| Duplicate `key()` | Rules 6, 7, 8, 9              | Extract to `helpers/cellKey.ts`              |
| Unused parameters | Rules 6, 8                    | Remove `_stripCache` or document why present |

### 5.3 Priority 3: Maintainability (Address When Convenient)

| Item                         | Action                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| JSDoc comments               | Add to all exported functions explaining the rule enforced |
| Mutation contract            | Document that `cells` is mutated in place                  |
| Return semantics             | Document `true` = changed, `false` = no change             |
| Refactor `oneByNConfinement` | Split into 3-4 smaller phase functions                     |
| Refactor `overcounting`      | Extract row/column logic into shared parameterized helper  |
| Unit tests                   | Add test files co-located with each rule                   |

### 5.4 Priority 4: Performance (Profile First)

| Item                     | File                             | Concern                                      |
| ------------------------ | -------------------------------- | -------------------------------------------- |
| Board copy per candidate | `08-exclusion.ts:60`             | Consider object pooling or incremental state |
| Double board copy        | `09-pressuredExclusion.ts:48,76` | Reuse `temp` array where possible            |
| Set intersections        | `07-oneByNConfinement.ts:99-106` | Profile on large boards before optimizing    |

---

_Review complete. Four perspectives consolidated above._
