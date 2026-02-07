# Star Battle Solver — Study Guide

## The Framework

**Observations** (how you see the board) × **Techniques** (how you reason) = **Levels**

| | Inferences | Enumerations | Hypotheticals |
|---|---|---|---|
| **Direct** | L1 | — | L7 |
| **Tiling** | — | L5 | L8 |
| **Confinement** | L3 | L6 | L9 |

---

## Level 1 — Direct Inferences

**Star Neighbors** — When you place a star, all 8 surrounding cells are dead. Most-fired rule because every placement triggers cleanup.

**Trivial Rows/Columns/Regions** — A container already has all its stars, so mark everything left in it. Trash collection — sweeping up after placements.

**Forced Rows/Columns/Regions** — A container has exactly as many unknowns as stars it still needs, so every unknown must be a star. The "no choice left" rule — elimination cornered the answer.

---

## Level 3 — Confinement Inferences

**Undercounting Rows/Columns** — N regions are confined to exactly N rows, so cells in those rows that *aren't* in those regions get marked. "These regions own these rows — outsiders get evicted."

**Overcounting Rows/Columns** — The dual: N rows are confined to exactly N regions, so cells in those regions *outside* those rows get marked. "These rows own these regions — anything else in the region is dead weight."

**Consumed Line Row/Column** — A row's remaining quota is entirely consumed by one region's needs, so other cells in that row outside the region are forced. "This region is hogging the whole row's star budget."

**Consumed Region Row/Column** — A region's remaining stars are entirely consumed by one row's needs, so cells in the region outside that row get forced. "This row is draining the region's entire star budget."

---

## Level 5 — Tiling Enumeration

**Tiling Forced Rows/Columns/Regions** — The container is "tight" (tile capacity = stars needed). Enumerate all valid tilings; cells that are always stars get placed. "Every arrangement agrees this cell is a star."

**Tiling Adjacency Marks** — Same tight tiling, but cells that are *never* a star in any valid tiling get marked. "No arrangement wants this cell."

**Tiling Overhang Marks** — Tiles extend beyond the container. If every valid tiling covers a cell *outside* the container, mark it. "The tile's shadow always falls here, so nothing else can live here."

**Squeeze Forced/Adjacency/Overhang Rows/Columns** — Same three ideas applied to *pairs of adjacent rows/columns*. Pairs have wider tiling patterns that reveal deductions neither row alone could see.

---

## Level 6 — Confinement Enumeration

**Combination Composite Tiling/Enumeration** — Merge two adjacent regions into one composite shape, run tiling or full enumeration on the combined shape. "Two regions together reveal what neither could alone." Marks variant finds universally-dead cells; Placements variant finds universally-forced cells.

**Complement Composite Tiling/Enumeration** — When regions are confined to a band of rows/columns, analyze the *complement* (leftover cells in those rows outside those regions) as a composite. "The leftover scraps form their own solvable mini-puzzle."


---

## Level 7 — Direct Hypotheticals

**Hypothetical Row/Column Count** — Try placing a star in each unknown cell; if it leaves nearby rows/columns with fewer unknowns than needed stars, mark it. "One star here and the neighbor can't fill its quota."

---

## Level 8 — Tiling Hypotheticals

**Hypothetical Row/Column Capacity** — Try placing a star; if nearby rows/columns can't fit their required stars even with optimal 2x2 tiling, mark it. "One star here and the tiles can't physically fit next door."

**Hypothetical Region Capacity** — Try placing a star; if the cell's own region can no longer tile enough stars, mark it. "One star here and my own region implodes."

**Hypothetical Adjacent Region Break** — Try placing a star; if an *adjacent* region's tiling becomes impossible, mark it. "One star here and my neighbor's region can't survive."

---

## Level 9 — Confinement Hypotheticals

**Hypothetical Undercounting Row/Column** — Try placing a star; check if confinement breaks — regions trapped in rows need more stars than those rows can give. "One star here and the trapped regions starve."

**Hypothetical Overcounting Row/Column** — Try placing a star; check if rows trapped in regions need more stars than those regions can give. "One star here and the trapped rows starve."

---

## The 21 Stuck Puzzles — What's Missing

### Container Cabal (krazydad's term)
N rows' remaining unknowns fit entirely within N regions → those regions' stars MUST all come from those rows → clear everything else in those regions. Your composite rules are close but miss the case where *rows own regions* (not just regions owning rows). This is the inverse of undercounting applied as an enumeration.

### Multi-line Reserved Areas
Reserved area logic across *multiple columns simultaneously*. Your reserved area rules handle single-line sets but may miss combos like "col G + col H together need stars only in these 8 cells, so G3 and H3 are dead."

---

## Attack Plan (6 hours)

---

### Phase 1: Make the Solver Fast (Hours 1-2)

**Goal:** Get 1000-puzzle benchmark from 717s to under 60s. You CANNOT iterate on coverage gaps when every test run takes 12 minutes. Speed unlocks everything else.

#### Task 1.1: Profile per-rule timing

**Why:** You're flying blind. 50 rules, 717 seconds — you need to know which rules eat the time before you optimize anything.

**How:** Add `performance.now()` timing around each `rule(board, cells, analysis)` call in the solver loop. Accumulate per-rule-name totals. Print a timing breakdown alongside the existing rule usage stats in the CLI. You'll likely find 3-5 rules consuming 90% of the time — that's your hit list.

**What to look for:** The L5 tiling rules fire on 85-95% of puzzles (tilingForcedRegion: 1709 times, tilingAdjacencyMarks: 1900 times, tilingOverhangMarks: 1924 times). Each one calls `computeTiling` which runs DLX. The L6 composite rules also call tiling on merged region shapes. The L8 hypotheticals call `getTiling` for every unknown cell on the board. Any of these could be the bottleneck.

#### Task 1.2: Eliminate redundant BoardAnalysis rebuilds

**Why:** `buildBoardAnalysis` runs EVERY cycle. It calls `buildRegions(board.grid)` which re-parses the region grid from scratch — but the region grid never changes. It also recomputes all region metadata, row/col star counts, and row-to-region mappings from scratch even when only 1-2 cells changed last cycle.

**How:** Split `buildBoardAnalysis` into one-time setup (region structure, coords) and per-cycle update (star counts, unknown lists). Cache the region structure. Only recompute the parts that actually depend on cell state. The `rowToRegions`/`colToRegions` maps only change when unknowns become stars or marks — you could update them incrementally.

#### Task 1.3: Make tiling cache keys cheaper

**Why:** Every `getTiling` call builds a cache key by mapping coords to strings, sorting them, and joining with `|`. For a 10-cell region this means 10 string allocations, a sort, and a join — and this happens thousands of times per puzzle. The cache HITS are cheap but the key GENERATION is not.

**How:** Use a numeric hash instead of a string key. Coords on a 10x10 grid can be encoded as `row * 10 + col` (single number per coord). Sort the numbers, then use a fast hash or even just join the numbers. Or use a `Map<number, Map<number, ...>>` trie structure keyed by sorted cell indices.

#### Task 1.4: Skip rules that can't fire

**Why:** The solver restarts from rule 0 every cycle. After Star Neighbors fires (which only affects cells near placed stars), rules like Undercounting Rows only need to re-check rows that had cells change. But right now every rule scans the entire board every cycle.

**How:** Track which rows/cols/regions had cells change in the last cycle. Pass this "dirty set" to rules. Rules can check "did anything in my jurisdiction change?" and bail out instantly if not. This is the highest-leverage optimization if profiling shows rules spending time scanning unchanged regions.

#### Checkpoint: Run the 1000-puzzle benchmark. If it's under 120s, move on. If not, focus on whatever the profiler says is still slow.

---

### Phase 2: Analyze the 21 Stuck Puzzles (Hours 3-4)

**Goal:** Know exactly what deduction each stuck puzzle needs, categorized into groups you can act on. No hand-waving — concrete "puzzle X needs Y deduction at cell Z" for each one.

#### Task 2.1: Trace all 21 stuck puzzles

**Why:** You have the traces infrastructure already (`--trace` flag). With the solver running faster, you can now afford to trace all 21 and study where each one gets stuck.

**How:** Run `npx tsx src/sieve/cli.ts --file unsolved_clean.sbn --trace > stuck_traces.txt`. For each puzzle, look at the final board state. Identify which cells are still unknown. Look at the region structure around those cells. Ask: "What logical step would unlock this?"

#### Task 2.2: Categorize each stuck puzzle

**Why:** You need to know if 15 of the 21 need the same rule (worth implementing) or if they're all different edge cases (not worth it individually). Grouping determines strategy.

**Categories to look for:**

- **"Container cabal"** — Krazydad's step 25 pattern. N rows' unknowns fit entirely within N regions. The regions' other cells (outside those rows) can be cleared. This is what blocked the example puzzle at cycle 33. Look for: stuck puzzles where a few rows' unknown cells all fall within a small set of regions, and those regions have extra cells outside those rows.

- **"Multi-line reserved area"** — Krazydad's step 38. Your reserved area rules currently find cells that must contain stars for a *set of rows/columns*. The gap might be: your rules check single lines or don't combine columns together. Look for: stuck puzzles where two columns' remaining unknowns together point to a reserved band.

- **"Deeper hypothetical"** — The current hypotheticals check ±1 rows/columns from a candidate cell. Some deductions might need checking ±2 or the full board cascade. Look for: stuck puzzles where the answer requires "if I place here, then THIS forces THAT, which breaks a THIRD thing."

- **"Legitimate disagreement"** — Maybe krazydad's solver uses techniques you've deliberately excluded (like multi-depth backtracking disguised as "logic"). Look for: stuck puzzles where the only path forward requires assuming two cells simultaneously.

#### Task 2.3: Cross-reference with krazydad solutions

**Why:** You already have the infrastructure for scraping krazydad's step-by-step solutions (you did it for the example puzzle). For the highest-value stuck puzzles, get krazydad's solution and find exactly which step your solver misses.

**How:** For each stuck puzzle, find where your solver stops and what krazydad does next. Note the reason string (e.g., "container cabal formed by Row-7,Row-9 and Cage-8,Cage-10"). This tells you exactly what rule to implement.

#### Deliverable: A table in SATURDAYGOGO.md listing all 21 puzzles with their category, the stuck cycle number, and what deduction would unblock them.

---

### Phase 3: Implement or Document (Hours 5-6)

**Goal:** Either close the gaps or explain why they're open. No puzzle left as "I don't know why this is stuck."

#### Task 3.1: Implement the biggest category

**Why:** If 12 of 21 puzzles need container cabal, that one rule gets you from 98% to 99.2%. Maximum ROI.

**Where it goes:** Container cabal is a confinement enumeration — it belongs at L6, right next to your existing complement composite rules. It's actually the dual of what complement composites do: complement composites say "these regions are confined to these rows, check the complement." Container cabal says "these rows are confined to these regions, check the rest of the regions."

**Implementation sketch (container cabal):**
1. For each subset of 2-4 rows: collect the set of regions that have unknown cells in those rows.
2. Count the total stars needed by those rows.
3. Count the total stars those regions can contribute from cells WITHIN those rows.
4. If the row demand equals the region supply within those rows: every cell in those regions OUTSIDE those rows can be marked.
5. This is O(rows^4 × regions) in the worst case, but you only need to check rows that share regions with each other, which prunes massively.

#### Task 3.2: Implement the second-biggest category (if time)

**Why:** If multi-line reserved areas account for another 5 puzzles, that gets you to 99.7%.

**Where it goes:** This extends your existing `reservedAreaRow`/`reservedAreaColumn` at L6. The current implementation might already handle multi-line — check if it iterates over line SETS or only single lines. If it only checks single lines, extend it to check pairs/triples of lines.

#### Task 3.3: Document disagreements

**Why:** Some of krazydad's "logic" might actually be bifurcation in disguise. If a puzzle requires multi-depth hypothetical chains, that crosses your stated boundary (single-depth only). Document it clearly: "This puzzle requires assuming cell A, deducing cell B, then checking if B breaks C — that's depth-2 bifurcation, which is beyond our solver's philosophy."

**Where:** Add a section to SATURDAYGOGO.md listing these puzzles and the reasoning. This is research output — it's valuable even if the solve rate isn't 100%.

#### Task 3.4: Validate

**Why:** New rules can break existing solves (if they fire too aggressively and produce incorrect deductions) or slow things down (if they fire on every puzzle but only help 12).

**How:** Run the full 1000-puzzle benchmark. Verify: (1) solve rate went up, (2) no previously-solved puzzles now fail, (3) performance didn't regress badly. If the new rule is slow, consider adding it after the hypotheticals in the rule order so it only fires on hard puzzles.

---

### Decision Points



- **After categorizing (Task 2.2):** If one category covers 15+ puzzles, spend all of Phase 3 on it. If they're evenly split, implement the easiest one first. If they're all different edge cases, document them and call 98% a win.

- **At hour 4:** If you're behind on speed, skip Phase 3 and focus on getting the profiling and gap analysis documented. A clear map of what's left is more valuable than a half-baked rule implementation.
