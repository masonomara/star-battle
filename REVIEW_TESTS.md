# Test File Review

## 05-forcedPlacement.test.ts

| Severity | Line  | Issue                                                                                    |
| -------- | ----- | ---------------------------------------------------------------------------------------- |
| Low      | 55-62 | Comment says "(1,1)" - could clarify row/col notation                                    |
| Low      | —     | Tests 5.1.2 and 5.1.2b are logically sequential; may fail if run independently           |
| Low      | —     | No test for cascading contradictions                                                     |

---

## 06-twoByTwoTiling/tiling.test.ts

| Severity | Line    | Issue                                                               |
| -------- | ------- | ------------------------------------------------------------------- |
| Medium   | 36-58   | Test 6.1.2 only checks star count, not that `result` is `false`     |
| Low      | 529-535 | Uses `[number, number][]` instead of imported `Coord` type          |
| Low      | 496-563 | Section 6.6 duplicates region setup code - consider shared fixtures |
| Low      | —       | No test for disconnected region (non-contiguous cells)              |

---

## 07-oneByNConfinement.test.ts

| Severity | Line  | Issue                                                                         |
| -------- | ----- | ----------------------------------------------------------------------------- |
| Medium   | 7.6.5 | Only asserts `typeof result === "boolean"` - doesn't verify behavior          |
| Medium   | 7.6.7 | Only asserts `typeof result === "boolean"` - doesn't verify cache correctness |
| Low      | —     | `findAllMinimalTilings` import only used in one test (7.6.7)                  |

---

## 08-exclusion.test.ts

| Severity | Line    | Issue                                                                     |
| -------- | ------- | ------------------------------------------------------------------------- |
| Low      | 121-129 | Coordinate comments may become stale if grid changes                      |
| Low      | 8.7.5   | Documents "row/column exclusion is NOT implemented" - confirm intentional |
| Low      | —       | Section 8.7 duplicates setup patterns from earlier tests                  |

---

## 09-pressuredExclusion.test.ts

| Severity | Line | Issue                                                           |
| -------- | ---- | --------------------------------------------------------------- |
| Low      | 9.7  | Documents "L-shaped diagonal pressure is NOT currently handled" |

**Action:** Remove conditional assertions; tests should have deterministic expectations

---

## 10-undercounting.test.ts

| Severity | Line   | Issue                                                              |
| -------- | ------ | ------------------------------------------------------------------ |
| Low      | 10.4.4 | Asserts `result === true` but doesn't verify which marks were made |

---

## 11-overcounting.test.ts

| Severity | Line   | Issue                                                                    |
| -------- | ------ | ------------------------------------------------------------------------ |
| Low      | 11.2.3 | Uses 20 unique region IDs (0-19) - harder to reason about than necessary |

---

## Cross-File Issues

| Issue                               | Files Affected | Suggestion                                               |
| ----------------------------------- | -------------- | -------------------------------------------------------- |
| Manual `CellState[][]` construction | All            | Use `makeGrid` helper (exists in tiling.test.ts:567-570) |
| Magic numbers in assertions         | All            | Consider named constants                                 |
| No custom error messages            | All            | Add messages to complex expects                          |
| Repeated board setups               | Multiple       | Extract shared fixtures                                  |
| Tests mutate `cells` in place       | All            | Verify test isolation                                    |

