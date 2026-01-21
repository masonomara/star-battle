# Code Review: Star Battle Sieve (Organized by File)

**Reviewers:**
- **Christian** — Senior Software Engineer (technical accuracy, security)
- **Wei** — Taoist Project Manager (flow, simplicity, scope)
- **Marcus** — Lawyerly Supervisor (liability, compliance, edge cases)
- **Carlos** — Nicaraguan Coworker (developer practicality)

---

## `sieve.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 11-14 | `assignDifficulty` formula (`levelBase + cycleBonus`) is magic — the "why" is unclear | Wei | LOW |
| — | `sieve()` returns `Puzzle[]` but when `seed` is provided, always returns 0 or 1 puzzle — confusing API | Carlos | MEDIUM |

---

## `solver.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 91-100 | **Double-counting adjacency check**: Loop detects (A,B) and later (B,A) — correct but redundant | Christian | LOW |
| 197-198 | **Cache rebuilt every cycle**: Tiling/strip caches recomputed each iteration — could invalidate selectively | Christian | MEDIUM |
| 30 | `board.stars <= 1` special case — what if `stars = 0`? Returns true but nonsensical | Marcus | MEDIUM |
| 168 | `seed: number` is required param but only used for output — misleading contract | Marcus | LOW |
| — | `isValidLayout` checks region sizes but not region count (`size` regions expected) | Marcus | MEDIUM |
| 1-22 | Import numbering (01-, 02-, etc.) in rule paths is redundant — `allRules` array already handles ordering | Wei | LOW |
| — | `solve()` returns `null` for three reasons (invalid layout, stuck, max cycles) — no way to distinguish | Carlos | MEDIUM |
| — | 11 rules imported from 11 different folders with numbered prefixes — hard to understand relationships | Carlos | LOW |

---

## `cli.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 90 | ANSI escape codes assume terminal support — could garble output in non-ANSI terminals | Christian | LOW |
| 85-94 | `printCellStateWithDiff` mixes concerns: display + diff + ANSI formatting | Wei | LOW |
| — | No validation that `size >= stars` (required for valid puzzles) | Marcus | MEDIUM |
| — | Argument parsing is hand-rolled — should use `yargs` or `commander` | Carlos | LOW |

---

## `generator.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 110 | **DoS potential**: `maxIterations = size * size * 100` with no upper bound on `size` | Christian | MEDIUM |
| 75-76 | **String parsing in hot loop**: `key.split(",").map(Number)` repeated — use numeric tuples | Christian | LOW |
| 18-22 | `size = 0` causes infinite loop placing 0 regions | Marcus | MEDIUM |
| 24 | `stars = 0` yields `minRegionSize = -1` — meaningless constraint | Marcus | LOW |
| 110 | Throws generic `Error` — no error code for programmatic handling | Marcus | LOW |
| 50-65 | Frontier with string keys adds complexity — could use `Set<number>` with `row * size + col` | Wei | LOW |
| — | `layout()` throws on failure vs `solve()` returns null — inconsistent error handling | Carlos | MEDIUM |

---

## `helpers/types.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 29-32 | `Tile.cells` comment says "all 4 cells" but code doesn't enforce invariant | Marcus | LOW |
| 39 | `allMinimalTilings` could be empty array OR contain empty arrays — ambiguous contract | Marcus | LOW |
| — | Types are clean and well-documented — good starting point for new devs | Wei, Carlos | POSITIVE |

---

## `helpers/tiling.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 82 | **Unsafe cast**: `as [number, number]` after split — no validation of 2 elements | Christian | MEDIUM |
| 160 | `minTileCount: Infinity` could cause JSON serialization issues | Christian | LOW |
| 165-177 | Secondary column bookkeeping feels over-engineered for problem size | Wei | LOW |
| — | No guard against `gridSize <= 0` | Marcus | LOW |
| — | Comment says "exact cover" but doesn't explain primary/secondary columns | Carlos | LOW |

---

## `helpers/strips.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 13 | **Assumes rectangular grid**: `board.grid[0].length` — no validation | Christian | LOW |

---

## `helpers/regions.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 6 | **Assumes non-empty grid**: `grid[0].length` throws TypeError on empty grid | Christian, Marcus | MEDIUM |

---

## `helpers/dlx.ts`

| Line | Issue | Reviewer | Severity |
|------|-------|----------|----------|
| 22 | **Unsafe null assertion**: `root.left = null!` could cause runtime errors | Christian | MEDIUM |
| 1-15 | Four interfaces where one generic node type might suffice | Wei | LOW |
| — | No guard against `numPrimary < 0` or `numSecondary < 0` | Marcus | LOW |
| — | Cover/uncover functions are textbook readable | Carlos | POSITIVE |

---

## Cross-Cutting Concerns

| Issue | Reviewer |
|-------|----------|
| No license headers in any file | Marcus |
| No JSDoc on public exports | Marcus, Carlos |
| LCG constants (1103515245, 12345) should cite source (glibc) | Marcus |
| No unit tests visible | Carlos |
| No example puzzles for understanding I/O | Carlos |
| Magic numbers scattered (MAX_CYCLES=1000, maxAttempts=100000) | Carlos |
| `helpers/` mixes core algorithms with true helpers — split into `algorithms/` and `types/` | Carlos |
| DLX may be overbuilt — most puzzles solve with simpler backtracking | Wei |
| No validation that regions are contiguous | Wei |
| `onProgress` vs `onStep` — two callback patterns for similar purposes | Wei |

---

## Priority Summary

### Must Fix
1. `cli.ts:28-31` — Input validation for bounds

### Should Fix
4. `generator.ts:18` — Guard `size <= 0`
5. `regions.ts:6` — Guard empty grid
6. `dlx.ts:22` — Proper initialization
7. `solver.ts:197` — Selective cache invalidation

### Consider
8. Extract magic numbers to constants
9. Standardize error handling patterns
10. Add JSDoc to public exports

---

*Review completed: 2026-01-21*
