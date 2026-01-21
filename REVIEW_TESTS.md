# Test File Review

**Total Issues:** 1 Critical, 2 High, 4 Medium, 6 Low

---

## 01-trivialNeighbors.test.ts

| Severity | Issue |
|----------|-------|
| **Critical** | Filename misspelled as `trivialNeghbors.test.ts` (missing 'i') |
| Low | No test for board with `stars: 0` |

**Action:** Rename file to `trivialNeighbors.test.ts`

---

## 02-trivialRows.test.ts

| Severity | Issue |
|----------|-------|
| Low | No test for 1x1 board (minimum viable board) |

**Status:** Clean

---

## 03-trivialColumns.test.ts

| Severity | Issue |
|----------|-------|
| Low | No test for non-square board (if supported) |

**Status:** Clean

---

## 04-trivialRegions.test.ts

**Status:** Clean - no issues identified

---

## 05-forcedPlacement.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| Medium | — | Test numbering uses 'b' and 'c' suffixes (5.1.2b, 5.1.2c, 5.3.6b) breaking clean pattern |
| Low | 55-62 | Comment says "(1,1)" - could clarify row/col notation |
| Low | — | Tests 5.1.2 and 5.1.2b are logically sequential; may fail if run independently |
| Low | — | No test for cascading contradictions |

---

## 06-twoByTwoTiling/tiling.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| Medium | 36-58 | Test 6.1.2 only checks star count, not that `result` is `false` |
| Low | 529-535 | Uses `[number, number][]` instead of imported `Coord` type |
| Low | 496-563 | Section 6.6 duplicates region setup code - consider shared fixtures |
| Low | — | No test for disconnected region (non-contiguous cells) |

---

## 07-oneByNConfinement.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| ~~Medium~~ | ~~454-463~~ | ~~Comment contradicts test; says "adjust to show no-mark case" but asserts `true`~~ **FIXED** |
| Medium | 7.6.5 | Only asserts `typeof result === "boolean"` - doesn't verify behavior |
| Medium | 7.6.7 | Only asserts `typeof result === "boolean"` - doesn't verify cache correctness |
| Low | — | `findAllMinimalTilings` import only used in one test (7.6.7) |

---

## 08-exclusion.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| ~~Low~~ | ~~133-181~~ | ~~50 lines of inline reasoning about abandoned approaches~~ **FIXED** |
| Low | 121-129 | Coordinate comments may become stale if grid changes |
| Low | 8.7.5 | Documents "row/column exclusion is NOT implemented" - confirm intentional |
| Low | — | Section 8.7 duplicates setup patterns from earlier tests |

---

## 09-pressuredExclusion.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| **High** | 227-233 | Test 9.7 uses conditional `if (result)` - weakens assertion |
| **High** | 267-271 | Test 9.8 uses conditional `if (result)` - weakens assertion |
| Low | 9.7 | Documents "L-shaped diagonal pressure is NOT currently handled" |

**Action:** Remove conditional assertions; tests should have deterministic expectations

---

## 10-undercounting.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| Low | 10.4.4 | Asserts `result === true` but doesn't verify which marks were made |

---

## 11-overcounting.test.ts

| Severity | Line | Issue |
|----------|------|-------|
| Low | 11.2.3 | Uses 20 unique region IDs (0-19) - harder to reason about than necessary |

---

## sieve.test.ts

**Status:** Clean - no issues identified

---

## solver.test.ts

**Status:** Clean - correctly tests immutability ("does not mutate input board")

---

## Cross-File Issues

| Issue | Files Affected | Suggestion |
|-------|----------------|------------|
| Manual `CellState[][]` construction | All | Use `makeGrid` helper (exists in tiling.test.ts:567-570) |
| Magic numbers in assertions | All | Consider named constants |
| No custom error messages | All | Add messages to complex expects |
| Repeated board setups | Multiple | Extract shared fixtures |
| Tests mutate `cells` in place | All | Verify test isolation |

---

## Recommendations

### Must Fix
1. Rename `trivialNeghbors.test.ts` → `trivialNeighbors.test.ts`
2. Remove conditional assertions in `pressuredExclusion.test.ts` (9.7, 9.8)

### Should Fix
3. Standardize test numbering in `forcedPlacement.test.ts`
4. Use `Coord` type consistently in `tiling.test.ts`
5. Strengthen weak assertions in `oneByNConfinement.test.ts` (7.6.5, 7.6.7)

### Consider
6. Extract shared board fixtures
7. Add boundary tests (`stars: 0`, 1x1 boards)
8. Create `makeEmptyGrid(size)` helper for all files
