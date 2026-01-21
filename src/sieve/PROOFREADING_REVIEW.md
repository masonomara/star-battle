## Agent Reviews

### Christian (Senior Software Engineer) - Technical Accuracy & Security

#### Technical Accuracy Issues

| File                         | Line    | Issue                                                                                                                                                                                                                 | Severity |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `forcedPlacement.test.ts`    | 55-62   | Comment says "Only first star placed - (1,1)" but the expected array shows star at `[1][1]` which is row 1, col 1 - correct but comment could clarify row/col notation                                                | Low      |
| `tiling.test.ts`             | 36-58   | Test 6.1.2 description says "does not place star if minTiles > stars needed" but the assertion `expect(cells.flat().filter((c) => c === "star").length).toBe(0)` only checks star count, not that `result` is `false` | Medium   |
| `oneByNConfinement.test.ts`  | 454-463 | Comment at line 458 contradicts the test - says "Let me adjust to show no-mark case" but then `expect(result).toBe(true)` follows                                                                                     | Medium   |
| `exclusion.test.ts`          | 133-181 | Test 8.2.2 has extensive inline comments explaining why the original approach won't work, then tests a different scenario - indicates spec confusion                                                                  | Low      |
| `pressuredExclusion.test.ts` | 227-233 | Test 9.7 uses conditional `if (result)` which weakens the assertion - tests should have deterministic expectations                                                                                                    | Medium   |
| `pressuredExclusion.test.ts` | 267-271 | Test 9.8 also uses conditional assertion `if (result)`                                                                                                                                                                | Medium   |

#### Type Safety Observations

- All test files correctly import types from `../../helpers/types`
- `Coord` type usage is consistent as `[number, number]` tuples
- No `any` type usage detected

#### Unused Import Detection

| File                        | Issue                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `oneByNConfinement.test.ts` | Imports `findAllMinimalTilings` but only uses it in one test (7.6.7) - consider if this helper test belongs here |
| `tiling.test.ts`            | Line 529-535 declares `region0Coords: [number, number][]` instead of using the imported `Coord` type             |

---

### Li Wei (Taoist Project Manager) - Flow, Simplicity, Scope

#### Flow Issues

1. **Test Numbering Gaps**
   - `trivialNeighbors.test.ts`: Tests numbered 1.1-1.7 (good)
   - `trivialRows.test.ts`: Tests numbered 2.1-2.5 (good)
   - `forcedPlacement.test.ts`: Has 5.1.2, 5.1.2b, 5.1.2c, 5.3.6b - the 'b' and 'c' suffixes break the clean numbering flow

2. **Scope Creep in Comments**
   - `exclusion.test.ts` lines 133-181: 50 lines of inline reasoning about what the test _doesn't_ do - should be moved to documentation
   - `oneByNConfinement.test.ts` line 454-463: Multi-line comment explaining why the test author changed their approach mid-test

3. **Over-Complex Test Setups**
   - `overcounting.test.ts` test 11.2.3 uses 20 unique region IDs (0-19) - harder to reason about than necessary
   - Simpler: Use fewer regions with clearer geometric relationships

#### Simplicity Opportunities

| File                | Observation                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `tiling.test.ts`    | Section 6.6 "Cache parity" duplicates region setup code that exists in other tests - consider shared fixtures                              |
| `exclusion.test.ts` | Section 8.7 "Spec coverage gaps" duplicates setup patterns from earlier tests                                                              |
| Multiple files      | All use manual array construction for `CellState[][]` - could use a helper like `makeGrid` (which exists in `tiling.test.ts` line 567-570) |

#### Naming Flow

- Good: Describe blocks follow "N. Rule Name" pattern consistently
- Good: Test IDs like "7.1.1", "7.1.2" enable easy cross-referencing with specs
- Friction: Some test names exceed 80 characters, making test output harder to scan

---

### Margaret (Lawyerly Supervisor) - Liability, Compliance, Edge Cases

#### Edge Case Coverage Gaps

| Rule                | Gap Identified                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| 01-trivialNeighbors | No test for board with 0 stars (edge case: `stars: 0`)                                                   |
| 02-trivialRows      | No test for 1x1 board (minimum viable board)                                                             |
| 03-trivialColumns   | No test for non-square board (if supported)                                                              |
| 05-forcedPlacement  | Tests contradiction detection but no test for cascading contradictions                                   |
| 06-tiling           | No test for disconnected region (cells in region not spatially contiguous)                               |
| 08-exclusion        | Test 8.7.5 explicitly "documents that row/column exclusion is NOT implemented" - is this intended scope? |

#### Assertion Completeness

| File                         | Test     | Issue                                                                                           |
| ---------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `oneByNConfinement.test.ts`  | 7.6.5    | Only asserts `typeof result === "boolean"` - doesn't verify actual behavior                     |
| `oneByNConfinement.test.ts`  | 7.6.7    | Only asserts `typeof result === "boolean"` - doesn't verify tiling cache produces correct marks |
| `pressuredExclusion.test.ts` | 9.7, 9.8 | Conditional assertions don't guarantee behavior                                                 |
| `undercounting.test.ts`      | 10.4.4   | Asserts `result === true` but doesn't verify _which_ marks were made                            |

#### Boundary Value Analysis Missing

1. **Stars Parameter**
   - Tests cover `stars: 1`, `stars: 2`, `stars: 3`
   - Missing: `stars: 0` (degenerate case), `stars: 4+` (higher complexity)

2. **Board Sizes**
   - Tests use boards from 2x2 to 10x10
   - No tests for 1x1 (minimum) or 20x20+ (stress test)

3. **State Transitions**
   - No tests verify that a cell transitions from "unknown" to "marked" but never back
   - No tests verify "star" cells are never re-processed

#### Documentation of Intentional Limitations

The following tests document gaps rather than test functionality - confirm these are intentional:

- `exclusion.test.ts:8.7.5` - "row/column exclusion is NOT implemented"
- `pressuredExclusion.test.ts:9.7` - "L-shaped diagonal pressure is NOT currently handled"

---

### Carlos (Nicaraguan Coworker) - Developer Practicality

#### Copy-Paste Error Risk

1. **Repeated Board Setups**
   Many tests use similar board layouts. Easy to copy-paste and forget to update:

   ```typescript
   // This exact 4x4 pattern appears in multiple files
   const board: Board = {
     grid: [
       [0, 0, 1, 1],
       [0, 0, 1, 1],
       [1, 1, 1, 1],
       [1, 1, 1, 1],
     ],
     stars: 1,
   };
   ```

2. **Coordinate Comments Don't Match Code**
   - `exclusion.test.ts:121-129` - Comments reference neighbors at specific coordinates; if grid changes, comments become stale

#### Debugging Difficulty

| Issue                        | Files Affected | Suggestion                                                                                  |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| Magic numbers in assertions  | All files      | Consider named constants: `const REGION_0 = 0; const STAR = "star"`                         |
| Deep array comparisons       | All files      | When `toEqual` fails, Vitest shows full arrays - overwhelming for large boards              |
| No error messages in expects | All files      | Add custom messages: `expect(cells[0][1]).toBe("marked", "middle cell should be excluded")` |

#### Test Isolation Concerns

1. **Mutation Risk**
   - Tests mutate `cells` arrays in place (rules modify the input)
   - If test order matters or tests leak state, bugs hide
   - `solver.test.ts` correctly tests immutability: "does not mutate input board"

2. **No Reset Between Related Tests**
   - Tests 5.1.2 and 5.1.2b appear to be logically sequential (second call places remaining star)
   - If run independently, 5.1.2b would fail - verify Vitest runs them in order

#### Practical Improvements

| Current                                                         | Suggested                                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `expect(cells.flat().every((c) => c === "unknown")).toBe(true)` | `expect(cells.flat()).toSatisfyAll(c => c === "unknown")` or custom matcher |
| Manual region coordinate lists                                  | Use helper: `getRegionCoords(board, regionId)`                              |
| Comments explaining "why" inside test                           | Move to `describe` block description or separate doc                        |

#### Test Output Readability

Tests with long names produce hard-to-read output:

```
7.6.7 tilingCache enables partial confinement detection
```

Consider shorter names with details in comments:

```
7.6.7 tilingCache partial confinement
```

---

## Consolidated Recommendations

### Must Fix

1. **Rename `trivialNeghbors.test.ts` to `trivialNeighbors.test.ts`**
2. **Remove conditional assertions in `pressuredExclusion.test.ts` tests 9.7 and 9.8** - either the behavior is expected or it's not

### Should Fix

3. **Standardize test numbering** - remove 'b' and 'c' suffixes in `forcedPlacement.test.ts`
4. **Use `Coord` type consistently** - `tiling.test.ts:529-535` uses inline tuple type
5. **Add assertion messages** for complex expectations to aid debugging

### Consider

6. **Extract shared board fixtures** to reduce copy-paste risk
7. **Add boundary tests** for `stars: 0` and 1x1 boards
8. **Move inline reasoning comments** to describe blocks or external docs
9. **Create helper function** `makeEmptyGrid(size)` and use it across all tests (already exists in `tiling.test.ts`)

---

## File-by-File Summary

| File                             | Critical     | High | Medium | Low |
| -------------------------------- | ------------ | ---- | ------ | --- |
| 01-trivialNeghbors.test.ts       | 1 (filename) | 0    | 0      | 0   |
| 02-trivialRows.test.ts           | 0            | 0    | 0      | 0   |
| 03-trivialColumns.test.ts        | 0            | 0    | 0      | 0   |
| 04-trivialRegions.test.ts        | 0            | 0    | 0      | 0   |
| 05-forcedPlacement.test.ts       | 0            | 0    | 1      | 1   |
| 06-twoByTwoTiling/tiling.test.ts | 0            | 0    | 1      | 1   |
| 07-oneByNConfinement.test.ts     | 0            | 0    | 2      | 0   |
| 08-exclusion.test.ts             | 0            | 0    | 0      | 2   |
| 09-pressuredExclusion.test.ts    | 0            | 2    | 0      | 0   |
| 10-undercounting.test.ts         | 0            | 0    | 0      | 1   |
| 11-overcounting.test.ts          | 0            | 0    | 0      | 1   |
| sieve.test.ts                    | 0            | 0    | 0      | 0   |
| solver.test.ts                   | 0            | 0    | 0      | 0   |

**Total Issues:** 1 Critical, 2 High, 4 Medium, 6 Low

---

## Sign-Off

| Reviewer  | Role                     | Status   |
| --------- | ------------------------ | -------- |
| Christian | Senior Software Engineer | Reviewed |
| Li Wei    | Project Manager          | Reviewed |
| Margaret  | Supervisor               | Reviewed |
| Carlos    | Developer                | Reviewed |
