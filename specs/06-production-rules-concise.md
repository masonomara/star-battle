# Production Rules

Condition → action pairs for the Star Battle solver.

## Puzzle Definition

- N×N grid with N shapes, star count S (typically 1–6)
- Each row, column, and shape contains exactly S stars
- No two stars adjacent (including diagonally)

### Data Structures

**Star-Containing 2×2 Registry**: Set of 2×2 regions (identified by top-left corner) known to contain exactly one star. Rules that establish exact star counts in 2×2 regions MUST register them here. Consuming rules (R4.8, R5.5b, R6.1) query this registry.

---

## Tier 1: Trivial Marks

### R1.1 — Star Adjacency Elimination

- **Condition**: Cell X contains a star
- **Action**: Eliminate all 8 neighbors of X

### R1.2 — Row Complete

- **Condition**: Row R contains S stars
- **Action**: Eliminate remaining cells in R

### R1.3 — Column Complete

- **Condition**: Column C contains S stars
- **Action**: Eliminate remaining cells in C

### R1.4 — Shape Complete

- **Condition**: Shape P contains S stars
- **Action**: Eliminate remaining cells in P

---

## Tier 2: Forced Placements

### R2.1 — Row Forced

- **Condition**: Row R has K unknown cells AND needs K more stars
- **Action**: Place stars in all K cells

### R2.2 — Column Forced

- **Condition**: Column C has K unknown cells AND needs K more stars
- **Action**: Place stars in all K cells

### R2.3 — Shape Forced

- **Condition**: Shape P has K unknown cells AND needs K more stars
- **Action**: Place stars in all K cells

---

## Tier 3: Bound Propagation

### R3.1 — 2×2 Maximum Bound

- **Condition**: Any 2×2 region of unknown cells
- **Action**: max = 1 (adjacency prevents 2+ stars in any 2×2)

### R3.2 — Region Tiling Bound

- **Condition**: Region R has unknown cells
- **Procedure**: Cover R with 2×2s greedily; count tiles used
- **Action**: R.max = tile count

### R3.3 — Exact Tiling Deduction

- **Condition**: Region R requires N stars AND R.max = N
- **Action**: Each 2×2 in tiling contains exactly 1 star; register all N 2×2s as star-containing

### R3.3b — Single-Cell Overlap Forced Placement

- **Condition**: R3.3 applies AND a 2×2 tile overlaps exactly 1 cell of region R
- **Action**: Place star in that cell

### R3.4 — 1×n Identification

- **Condition**: Shape P has unknown cells
- **Procedure**:
  1. Tile P with 2×2s greedily; track covered cells
  2. Identify uncovered cells
  3. If all uncovered cells lie in a single row (or column): mark as 1×n
- **Action**: Set 1×n.min = 1; record the covering 2×2s for P

### R3.5 — 1×n Line Completion

- **Condition**: Row/column has sum(1×n.min) ≥ S
- **Action**:
  1. Eliminate cells outside all 1×ns in that row/column
  2. If sum = S exactly: set each 1×n.max = 1
  3. For each 1×n with max=1, trigger R3.6 on its parent shape

### R3.6 — Bound Tightening from 1×n

- **Condition**: 1×n (from partial-tiling of shape P) tightened to max=1
- **Procedure**:
  1. Remaining cells = P minus 1×n cells
  2. Remaining cells require (S - 1) stars
  3. Re-tile remaining cells with 2×2s greedily; count = T
  4. If T = S - 1: each 2×2 contains exactly 1 star
- **Action**: Register all T 2×2s as star-containing; apply R3.3b to newly-exact 2×2s

---

## Tier 4: Exclusion

Eliminate cells where placing a star makes the puzzle unsolvable.

**Remainder Definition**: When testing cell X against region R:

1. Hypothetically star X
2. Eliminate X's 8 neighbors
3. Remainder = R's unknown cells − {X} − (neighbors of X ∩ R)
4. Compute tiling on remainder

### R4.1 — Shape Direct Exclusion

- **Condition**: X is in shape P. Hypothetically star X, eliminate neighbors, compute tiling on remaining unknown cells of P.
- **Action**: If remaining.max < (P.needed - 1), eliminate X

### R4.2 — Row Direct Exclusion

- **Condition**: X is in row R. Hypothetically star X, eliminate neighbors, compute tiling on remaining unknown cells of R.
- **Action**: If remaining.max < (R.needed - 1), eliminate X

### R4.3 — Column Direct Exclusion

- **Condition**: X is in column C. Hypothetically star X, eliminate neighbors, compute tiling on remaining unknown cells of C.
- **Action**: If remaining.max < (C.needed - 1), eliminate X

### R4.4 — Shape Neighbor Exclusion

- **Condition**: X is NOT in shape P, but a neighbor of X is in P. Hypothetically star X, eliminate neighbors, compute tiling on remaining unknown cells of P.
- **Action**: If remaining.max < P.needed, eliminate X

### R4.5 — Row Neighbor Exclusion

- **Condition**: X is NOT in row R, but a neighbor of X is in R. Hypothetically star X, eliminate neighbors, compute tiling on remaining unknown cells of R.
- **Action**: If remaining.max < R.needed, eliminate X

### R4.6 — Column Neighbor Exclusion

- **Condition**: X is NOT in column C, but a neighbor of X is in C. Hypothetically star X, eliminate neighbors, compute tiling on remaining unknown cells of C.
- **Action**: If remaining.max < C.needed, eliminate X

### R4.7 — Pressured Exclusion

- **Condition**: Hypothetically star X in row R (or column C). Eliminate neighbors.
- **Procedure**:
  1. Let `stars_needed = S - existing_stars - 1` (the -1 accounts for X)
  2. Identify non-overlapping 1×ns in R; let `pressure = sum(1×n.min)`
  3. Let `free_cells` = remaining unknown cells in R excluding 1×n cells
  4. Compute `free_cells.max` via 2×2 tiling
- **Action**: If `free_cells.max + pressure < stars_needed`, eliminate X

### R4.8 — Star-Containing 2×2 Pressured Exclusion

- **Condition**: A star-containing 2×2 has unknown cells in one of these configurations:
  - **L-shape** (3 cells): One corner eliminated
  - **Diagonal** (2 cells): Two opposite corners eliminated
  - **Line** (2 cells): Two adjacent cells in same row or column
- **Procedure**: For each unknown cell X, check if placing a star there would:
  1. Force the row (or column) containing X's eliminated neighbor to exceed capacity given existing stars/1×ns
- **Action**: If starring X exceeds row/column pressure, eliminate X; if only one cell remains valid, place star there

---

## Tier 5: Counting

### R5.1 — Undercounting

- **Condition**: N shapes completely contained in N rows (or columns)
- **Action**: Eliminate cells in those rows outside those shapes

### R5.1b — Composite from Containment

- **Condition**: N shapes completely contained within M rows (or columns), where M > N
- **Action**:
  1. Composite region = cells in M rows outside N shapes
  2. Composite requires (M − N) × S stars
  3. Apply R3.2–R3.6 to composite region

### R5.1c — Region Union Composite

- **Condition**: Disjoint regions R₁, R₂, ... (typically shapes) require S₁, S₂, ... stars respectively
- **Procedure**:
  1. Form composite C = R₁ ∪ R₂ ∪ ...
  2. C requires S₁ + S₂ + ... stars
  3. Tile C with 2×2s greedily; count = T
  4. If T = total stars required: each 2×2 contains exactly 1 star
- **Action**: Register all T 2×2s as star-containing; apply R3.3b to single-cell overlaps

**Search heuristic**: Prioritize adjacent shapes where combining creates a more rectangular/compact region that tiles efficiently.

### R5.2 — Overcounting

- **Condition**: N shapes completely contain N rows (or columns)
- **Action**: Eliminate cells in those shapes outside those rows

### R5.3 — Finned Undercounting

- **Condition**: N shapes are contained in N rows except for cell X; X is in one of the N shapes but outside all N rows
- **Verification**: Starring X places a shape-star outside the rows — the N rows would receive at most (N×S − 1) stars from shapes while requiring N×S
- **Action**: Eliminate X

### R5.4 — Finned Overcounting

- **Condition**: N rows are contained in N shapes except for cell X; X is in the N rows but outside all N shapes
- **Verification**: Starring X places a row-star outside the shapes — the N shapes would receive at most (N×S − 1) stars from rows while requiring N×S
- **Action**: Eliminate X

### R5.5 — Squeeze

- **Condition**: Two consecutive rows/columns tile to exactly 2S 2×2s
- **Targeting**: Prioritize row/column pairs with existing eliminations (marks reduce cell count, making exact tiling more likely)
- **Action**: Each 2×2 contains exactly 1 star; register all 2S 2×2s as star-containing
- **Chaining**: After registration, apply R4.8 to each newly registered 2×2 where corner eliminations create L-shape, diagonal, or line configurations
- **Note**: Registration is valuable even without immediate eliminations—subsequent rules (R4.8, R5.5b, R6.1) consume the registry

### R5.5b — Squeeze Cross-Region Accounting

- **Condition**: R5.5 applies. The star-containing 2×2s from the squeeze intersect region R (row, column, or shape) and fully account for R's star requirement
- **Action**: Eliminate remaining cells in R outside the squeeze's 2×2s

### R5.6 — Set Differential Computation

Add/subtract regions algebraically to create composite regions with known star counts.

**Procedure**:

1. For each cell, track count (+1 on add, -1 on subtract)
2. Track total stars (sum of added regions minus subtracted regions)

**Example** (10×10 2★):

- Add rows 1,10: count=1 for 20 cells, total=4★
- Add cols 1,10: count=2 at corners, total=8★
- Subtract 4 corner shapes: corners→0, total=0★
- Result: cells with count=1 have zero stars → eliminate

**Actions**:

- **R5.6a**: If all counts ∈ {0,1}, treat count=1 cells as composite region
- **R5.6b**: If total > 0, apply R3.2–R3.6 to composite region
- **R5.6c**: If total = 0, eliminate all count=1 cells (no stars possible)

### R5.7 — Bound Intersection

- **Condition**: Region R partitions into sub-regions {A, B, ...}; R requires N stars; sum(sub-region.max) = N
- **Action**: Each sub-region contains exactly sub-region.max stars; apply R3.3 to each

---

## Tier 6: Geometric Patterns

### R6.1 — Kissing Ls (2★)

Two star-containing 2×2s with L-shaped unknowns, positioned such that a cell X can force both stars into X's row/column, exceeding S.

**Definitions**:
- **L-shape**: A 2×2 with exactly one corner eliminated, leaving 3 cells
- **L orientation**: Named by eliminated corner — TL (top-left), TR (top-right), BL (bottom-left), BR (bottom-right)
- **Inner cell**: The cell of an L diagonally opposite the eliminated corner (forms the L's concave vertex)

**General Condition**:
1. Two star-containing 2×2s, each with 3 unknown cells forming an L
2. Cell X exists outside both 2×2s
3. Starring X would eliminate cells from both Ls such that:
   - Each L's remaining cells are confined to a single row (or column)
   - Both Ls are confined to the SAME row (or column)
   - X is also in that row (or column)
4. Result: 3 stars in one row/column (X + L₁ + L₂) > S=2

**Action**: Eliminate X

---

#### R6.1a — Horizontal Kissing Ls (Gap Configuration)

**Geometry**: Two 2×2s in the same row-pair, separated by a gap column.

```
     c0  c1  c2  c3  c4
r0:  [A] [B]  ·  [E] [F]    ← 2×2 regions in rows r0-r1
r1:  [C] [D] [X] [G] [H]    ← gap at column c2
```

- **Left 2×2**: cells {A, B, C, D} at columns c0-c1
- **Right 2×2**: cells {E, F, G, H} at columns c3-c4
- **Gap**: column c2

**Valid L orientations** (Ls open toward gap):
- Left 2×2: TL eliminated (A removed) → L = {B, C, D}, inner cell = D
- Right 2×2: TR eliminated (F removed) → L = {E, G, H}, inner cell = G

**Cell X position**: (r1, c2) — in gap column, in row r1

**Elimination chain**:
1. Star X at (r1, c2)
2. X's neighbors include: B(diagonal), D(orthogonal), E(diagonal), G(orthogonal)
3. After elimination:
   - Left L remaining: C only (at r1)
   - Right L remaining: H only (at r1)
4. Stars forced to r1: X + C's 2×2 + H's 2×2 = 3 > S=2

**Symmetric case** (X in r0):
- Left 2×2: BL eliminated (C removed) → L = {A, B, D}, inner cell = B
- Right 2×2: BR eliminated (H removed) → L = {E, F, G}, inner cell = F
- Cell X at (r0, c2)
- After starring X: Left L → D only (r1), Right L → G only (r1)
- But X is in r0, not r1 — does NOT exceed r1
- This configuration does NOT produce a valid Kissing Ls elimination

**Working configuration summary**:
| Left L (corner eliminated) | Right L (corner eliminated) | X position | Forced row | Valid? |
|---------------------------|----------------------------|------------|------------|--------|
| TL (A)                    | TR (F)                     | (r1, c2)   | r1         | ✓      |
| BL (C)                    | BR (H)                     | (r0, c2)   | r0         | ✓      |
| TL (A)                    | BR (H)                     | —          | —          | ✗      |
| BL (C)                    | TR (F)                     | —          | —          | ✗      |

---

#### R6.1b — Vertical Kissing Ls (Gap Configuration)

**Geometry**: Two 2×2s in the same column-pair, separated by a gap row.

```
     c0  c1
r0:  [A] [B]
r1:  [C] [D]    ← top 2×2
r2:  [X]  ·     ← gap row
r3:  [E] [F]
r4:  [G] [H]    ← bottom 2×2
```

- **Top 2×2**: cells {A, B, C, D} at rows r0-r1
- **Bottom 2×2**: cells {E, F, G, H} at rows r3-r4
- **Gap**: row r2

**Challenge**: Unlike horizontal, X in the gap row cannot simultaneously:
1. Eliminate enough cells from both Ls to confine them to ONE column
2. Be in that same column

**Analysis**: X at (r2, c0) is adjacent to:
- Top 2×2: C(orthogonal), D(diagonal), A(2 rows away — NOT adjacent)
- Bottom 2×2: E(orthogonal), F(diagonal), G(2 rows away — NOT adjacent)

Even with optimal L orientations, X can only eliminate 2 cells from each L (the bottom row of top 2×2, top row of bottom 2×2). The remaining cells in each L span both columns.

**Conclusion**: Standard vertical gap configurations do NOT produce valid Kissing Ls.

**Exception**: Vertical Kissing Ls CAN work when:
1. The gap contains multiple cells (wider gap)
2. Additional eliminations from other sources (shape boundaries, prior marks) have already reduced the Ls
3. The 2×2s are diagonally offset (see R6.1e)

---

#### R6.1c — Adjacent Kissing Ls (No Gap)

**Geometry**: Two directly adjacent 2×2s (sharing a boundary, no gap).

```
     c0  c1  c2  c3
r0:  [A] [B] [E] [F]
r1:  [C] [D] [G] [H]
```

**Problem**: No cell X exists outside both 2×2s that is adjacent to inner cells of both Ls simultaneously.

For cell X at (r2, c1):
- Adjacent to D (orthogonal) and G (diagonal)
- Starring X eliminates D and G
- Left L remaining: depends on which corner was eliminated
- If B eliminated: L = {A, C, D} → after D eliminated → {A, C} spans both rows
- Neither L is forced to a single row

**Conclusion**: Adjacent 2×2s (no gap) do NOT produce valid Kissing Ls eliminations through external cell X.

**Exception — Squeeze Context**: When Kissing Ls arise from a squeeze, the "cell X" may be a cell within the squeeze region but outside the two specific 2×2s forming the Kissing Ls. The squeeze provides additional 2×2s that constrain the geometry.

---

#### R6.1d — Diagonal Offset Kissing Ls

**Geometry**: Two 2×2s sharing one row (or column) but offset, creating a stair-step pattern.

```
     c0  c1  c2  c3
r0:  [A] [B]  ·   ·
r1:  [C] [D] [E] [F]    ← shared row
r2:   ·   ·  [G] [H]
```

- **Left 2×2**: {A, B, C, D} at (r0-r1, c0-c1)
- **Right 2×2**: {E, F, G, H} at (r1-r2, c2-c3)
- **Shared boundary**: row r1, between c1 and c2

**Valid L orientations** (Ls face the shared boundary):
- Left 2×2: BR eliminated (D removed) → L = {A, B, C}, inner cell = C
- Right 2×2: TL eliminated (E removed) → L = {F, G, H}, inner cell = F

**Cell X position**: (r1, c1) — but this is inside left 2×2 (cell D, already eliminated)

**Problem**: The natural X position falls inside one of the 2×2s.

**Working configuration**: Requires additional gap cell between the 2×2s.

```
     c0  c1  c2  c3  c4
r0:  [A] [B]  ·   ·   ·
r1:  [C] [D] [X] [E] [F]    ← X in gap between 2×2s
r2:   ·   ·   ·  [G] [H]
```

With gap at c2:
- Left 2×2: BR eliminated (D) → L = {A, B, C}
- Right 2×2: TL eliminated (E) → L = {F, G, H}
- X at (r1, c2)

**Elimination chain**:
1. Star X at (r1, c2)
2. X's neighbors: C(diagonal), D(orthogonal but eliminated), E(orthogonal but eliminated), F(diagonal)
3. After elimination:
   - Left L: {A, B} remaining (C eliminated) — both in r0
   - Right L: {G, H} remaining (F eliminated) — both in r2
4. Left forced to r0, right forced to r2 — DIFFERENT rows

**Conclusion**: Diagonal offset configurations do NOT produce valid Kissing Ls because the Ls get forced to different rows.

---

#### R6.1e — Squeeze-Derived Kissing Ls

**Context**: After a squeeze identifies N star-containing 2×2s across a row/column pair, where shape boundaries or prior marks have eliminated corners.

```
Squeeze across r0-r1:
     c0  c1  c2  c3  c4  c5  c6  c7
r0:  [  2×2₁  ][  2×2₂  ][  2×2₃  ][  2×2₄  ]
r1:  [        ][        ][        ][        ]
r2:       [X]                              ← X below squeeze
```

**When Kissing Ls arise from squeezes**:

1. Shape boundaries eliminate corners of adjacent 2×2s, creating Ls
2. The squeeze region spans exactly 2 rows (or columns)
3. Cell X exists outside the squeeze region (row r2 or r-1) but adjacent to inner cells of consecutive Ls

**Key insight**: Unlike gap configurations, squeeze-derived Kissing Ls work because:
- The 2×2s are directly adjacent (no gap between them)
- X is positioned OUTSIDE the squeeze rows (above or below)
- X can be adjacent to inner cells of both Ls diagonally

**Example**:
```
     c0  c1  c2  c3
r0:  [A] [X] [X] [F]    ← B and E eliminated by shape boundary
r1:  [C] [D] [G] [H]
r2:       [X]           ← candidate elimination cell
```

- Left L: {A, C, D} with inner cell D
- Right L: {F, G, H} with inner cell G
- X at (r2, c1): adjacent to D(orthogonal), G(diagonal)

**Elimination chain**:
1. Star X at (r2, c1)
2. Eliminates: C(diagonal), D(orthogonal), G(diagonal)
3. Left L remaining: A only (r0)
4. Right L remaining: F, H — spans r0 and r1, NOT forced

**Issue**: Even with squeeze context, forcing both Ls to same row requires specific corner eliminations that typically don't occur.

**Practical applicability**: Kissing Ls in squeeze context most commonly produce eliminations when:
1. Prior marks have reduced Ls beyond just corner elimination
2. The Ls happen to have geometry matching R6.1a (horizontal gap)
3. Multiple consecutive 2×2s create compound pressure effects

---

#### R6.1 Summary

**Verified working configuration**: R6.1a (Horizontal Gap)

| L₁ Eliminated | L₂ Eliminated | X Position | Forced Row | Stars in Row |
|---------------|---------------|------------|------------|--------------|
| TL (A)        | TR (F)        | (r1, gap col) | r1 (bottom) | X + L₁ + L₂ = 3 |
| BL (C)        | BR (H)        | (r0, gap col) | r0 (top)    | X + L₁ + L₂ = 3 |

**Non-working configurations**:
- Vertical gap: X cannot force both Ls to same column while being in that column
- Adjacent (no gap): No external X position available
- Diagonal offset: Ls get forced to different rows

**Implementation recommendation**:
1. Only implement R6.1a (horizontal gap configuration)
2. Require minimum 1-column gap between the 2×2s
3. Check that eliminated corners are same-row opposites (TL+TR or BL+BR)
4. Verify X position is in gap column AND in the forced row
5. Generalize to higher S by checking row pressure before elimination

---

#### Reconciliation with Documentation (Section 4.1)

The documentation states Kissing Ls appear "particularly from the results of a squeeze" with adjacent 2×2s. This analysis shows adjacent configurations don't work through pure geometry. The reconciliation:

1. **"Partially occluded"**: Documentation mentions "partially occluded Kissing Ls" — this suggests more than one corner eliminated per 2×2, creating reduced L-shapes where the geometry differs from the standard 3-cell L.

2. **Compound effects**: In squeeze context, the elimination may come from:
   - Pressured exclusion (R4.7-R4.8) on cells adjacent to the Ls
   - Shape boundary interactions creating effective gaps
   - Star-containing 2×2 cross-accounting (R5.5b)

3. **Visual pattern vs. rule**: "Kissing Ls" in documentation is a visual pattern to recognize opportunities. The underlying mechanism may be a combination of R4.8 (star-containing 2×2 pressured exclusion) and row/column pressure rather than a standalone rule.

**Recommendation**: Implement R6.1a for the clear geometric case. For squeeze-derived patterns, rely on R4.8 and pressured exclusion rules which handle the underlying logic without requiring explicit Kissing Ls detection.

### R6.2 — The M Pattern (2★)

**Core Principle**: When 3 2×2 tiles share a common column (or row) in their minimal tiling, placing one star per tile would violate adjacency. The region contains at most 2 stars.

- **Condition**: Region R requires 3 2×2s to tile, AND all three share cells in a common column (or row)
- **Action**: R.max = 2

**Common Configurations**:
1. **Horizontal strip**: ≥5 consecutive cells in one row (tiles overlap in middle column)
2. **Vertical strip**: ≥5 consecutive cells in one column (tiles overlap in middle row)
3. **Staggered regions**: Any shape where minimum 3-tile coverage produces shared-column (or shared-row) overlap

**Application**: When evaluating squeeze exactness, M patterns contribute max 2 stars instead of 3

### R6.3 — Pressured T (2★)

- **Condition**: T-tetromino (4 cells: 1×3 long edge + 1 perpendicular cell) where a star or 1×n exists in the same row/column as the 1×3 long edge
- **Action**: T.max = 1

### R6.3b — Pressured T Squeeze Enabling

- **Condition**: Attempting squeeze on row/column pair. Normal tiling yields N tiles where N > 2S. A Pressured T exists within the squeeze region.
- **Procedure**:
  1. Exclude Pressured T cells from tiling (contributes max 1 star)
  2. Tile remaining cells; count = M
  3. If M + 1 = 2S: squeeze is valid
- **Action**: Register all M 2×2s as star-containing; Pressured T contains exactly 1 star. Apply R3.3b to single-cell overlaps.

### R6.4 — Fish

- **Condition**:
  1. N columns have unknowns only within the same N rows
  2. (Remaining stars needed in N columns) = (Remaining stars needed in N rows)
- **Action**: Eliminate cells in those N rows outside those N columns

**Rationale**: Columns must place all remaining stars in those rows (geometric constraint). If counts match, those stars fully account for the rows' needs—no stars can exist in those rows outside those columns.

(Symmetric for rows→columns)

### R6.5 — Finned Fish

- **Condition**:
  1. N columns have unknowns only in N rows, except for cell X (the "fin")
  2. X is in one of those N rows but outside those N columns
  3. (Remaining stars needed in N columns) = (Remaining stars needed in N rows)
- **Action**: Eliminate X

**Rationale**: Starring X completes the Fish (satisfies R6.4.1). R6.4 would then eliminate X. Contradiction.

(Symmetric for rows→columns)

### R6.6 — N-Rooks Property

**Applicability**: S★ on (4S+2)×(4S+2) grids only (e.g., 6×6 1★, 10×10 2★)

**Data Structure**: Meta-grid M of (2S+1)×(2S+1) cells, each tracking a 2×2 block.

- M[i,j] ∈ {unknown, empty, star-containing}
- Invariant: Exactly one empty per meta-row, one per meta-column

#### R6.6a — Tiling Deficit Detection

- **Condition**: Region R has known star count N; R can be tiled with T meta-grid-aligned 2×2s where T > N
- **Procedure**:
  1. Identify which meta-positions the T tiles occupy
  2. Deficit D = T - N (exactly D of these tiles are empty)
  3. If D tiles span exactly D meta-rows (or D meta-columns): those D positions are the only candidates for empties in those rows/columns
- **Action**: If candidate set for a meta-row/column reduces to 1 → mark that block empty

#### R6.6b — Rook Constraint Propagation

- **Condition**: Meta-grid M has updated state
- **Procedure** (iterate until stable):
  1. For each meta-row with (2S) star-containing blocks: mark remaining block empty
  2. For each meta-row with 1 empty block: mark remaining (2S) blocks star-containing
  3. Repeat for meta-columns
- **Action**: Update M; register newly-confirmed star-containing blocks

#### R6.6c — Corner Deduction

- **Condition**: Central (2S-1)×(2S-1) region of meta-grid has all empties determined
- **Procedure**:
  1. Count empties in central region = C
  2. Remaining empties = (2S+1) - C must be on border
  3. Apply rook constraints: if C = (2S-1), remaining 2 empties must be opposite corners
- **Action**: Mark corner blocks accordingly; propagate via R6.6b

#### R6.6d — Complementary Marking

- **Condition**: All (2S+1) empty positions determined
- **Action**: Mark all remaining unknown blocks as star-containing; register in Star-Containing 2×2 Registry

---

## Tier 7: Uniqueness

Assume exactly one solution. Use for speed-solving only.

### Definitions

**Isolated Region**: A connected set of unknown cells where every orthogonally adjacent cell outside the set is eliminated.

**Thread**: A single unknown cell X outside an isolated region R, where X is diagonally or orthogonally adjacent to at least one cell in R. A region with a thread is **threaded**; a region with no adjacent unknowns outside itself is **unthreaded**.

**Binary Region**: An isolated region R where:
1. R needs exactly 1 more star
2. R's unknown cells span exactly 2 columns (or 2 rows)
3. Each of those 2 columns (or rows) contains at least 1 cell of R

**Column-Pair** (or **Row-Pair**): The 2 columns (or rows) spanned by a binary region.

**Aligned Set**: A set of binary regions sharing the same column-pair (or row-pair). Within an aligned set, existing row/column star counts force each region's star into opposite columns—if region A places its star in column 1, some other region B must place in column 2, and vice versa.

### R7.1 — By a Thread

**Condition**:
1. Binary region A is threaded (has exactly 1 thread cell X)
2. Binary region B is unthreaded
3. A and B share the same column-pair (or row-pair)
4. X is adjacent to A but not adjacent to B

**Procedure**:
1. Identify all shapes needing exactly 1 star
2. For each, check if unknown cells form an isolated region
3. Classify as binary if spanning exactly 2 columns (or rows)
4. Group binary regions by column-pair
5. For each group of size ≥ 2:
   - Count threads per region
   - If exactly one region A has a thread X, and at least one region B is unthreaded:
     - Verify X is not adjacent to B

**Reasoning**: Without X starred, A and B can swap configurations (A in col 1 ↔ B in col 2 vs A in col 2 ↔ B in col 1). No other cell can break symmetry. X must be starred to force a unique configuration.

**Action**: Place star in X

### R7.2 — At Sea

**Condition**:
1. Two or more binary regions {A, B, ...} share the same column-pair (or row-pair)
2. All regions are unthreaded (no external unknowns adjacent to any)
3. The regions are interchangeable: swapping column assignments (A↔col1, B↔col2 vs A↔col2, B↔col1) produces equivalent valid configurations

**Procedure**:
1. Identify aligned set of unthreaded binary regions in shared column-pair {C1, C2}
2. **Swap test**: If column assignments can be swapped freely, the puzzle has multiple solutions unless all regions use the SAME column
3. **Capacity test** for each alignment:
   - If all stars in C1: can adjacent columns still fit S stars?
   - If all stars in C2: can adjacent columns still fit S stars?
4. The infeasible alignment is eliminated; the feasible one is forced

**Reasoning**: Swappable opposite-column placements create solution ambiguity (swap any pair → another valid solution). Same-column placement eliminates swap opportunities. Column capacity determines which column is forced.

**Action**:
1. Determine the forced column (where capacity test passes)
2. Eliminate cells in the non-forced column for all regions in the aligned set

### R7.3 — By a Thread at Sea

**Condition**:
1. R7.2's aligned set exists (multiple binary regions, same column-pair)
2. All but one region are unthreaded
3. Exactly one region A has exactly one thread X
4. Starring X eliminates A's cell in one column, forcing A into the other column
5. That forced column matches the "same column" required by R7.2

**Procedure**:
1. Detect R7.2 scenario but with one threaded region A
2. Determine which column the aligned set must use (per R7.2 reasoning)
3. Check if X is adjacent to A's cell in the opposite column
4. If starring X forces A into the required column → X must be starred

**Reasoning**: The aligned set must place all stars in the same column for uniqueness. A has a thread that can enforce this. Without X starred, A could go either way, allowing configuration swaps across the entire set.

**Action**: Place star in X

### Tier 7 Implementation Notes

**Detection Order**: R7.2 → R7.1 → R7.3 (R7.3 depends on R7.2's column determination)

**Complexity**: O(shapes) to find binary regions, O(binary²) to find aligned pairs. Cheaper than full solution enumeration.

**When to Apply**: After Tiers 1–6 stall. These rules often break late-game deadlocks in computer-generated puzzles.

**Validation**: Before applying, verify the puzzle is advertised as having a unique solution. Hand-set puzzles may have intended non-uniqueness routes; avoid Tier 7 for those.

---

## Implementation Notes

**Rule Ordering**: Apply by tier. Restart from Tier 1 after any success.

**Difficulty**:

- Tier 1-3: Easy
- Tier 4: Medium
- Tier 5: Hard
- Tier 6 or complex R5.6: Expert
- Tier 7: Uniqueness (don't rate)

**Exclusion Order**: Direct (R4.1-3) → Neighbor (R4.4-6) → Pressured (R4.7-8)
