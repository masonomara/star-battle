# Production Rules

Atomic condition → action pairs for the Star Battle solver.

Source: https://kris.pengy.ca/starbattle

## Puzzle Definition

- Grid divided into N shapes on an N×N grid
- Star count S (typically 1–6)
- Each row, column, and shape must contain exactly S stars
- No two stars adjacent horizontally, vertically, or diagonally

## Solver State

Beyond cell states (unknown, star, eliminated), the solver tracks:

- **Bounds**: Each region (shape, row, column, or composite) has `min` and `max` star counts
- **1×n markers**: Regions known to contain ≥1 star, confined to a single row or column
- **Star-containing 2×2s**: 2×2 regions known to contain exactly 1 star

---

## Tier 1: Trivial Rules

Direct consequences of placed stars and filled containers.

### R1.1 — Star Adjacency Elimination

- **Condition**: Cell X contains a star
- **Action**: Eliminate all 8 neighbors of X (cells sharing edge or corner)

### R1.2 — Row Complete

- **Condition**: Row R contains S stars
- **Action**: Eliminate all remaining unknown cells in R

### R1.3 — Column Complete

- **Condition**: Column C contains S stars
- **Action**: Eliminate all remaining unknown cells in C

### R1.4 — Shape Complete

- **Condition**: Shape P contains S stars
- **Action**: Eliminate all remaining unknown cells in P

### R1.5 — Row Forced

- **Condition**: Row R has K unknown cells remaining AND (S - stars_already_in_R) = K
- **Action**: Place stars in all K unknown cells in R

### R1.6 — Column Forced

- **Condition**: Column C has K unknown cells remaining AND (S - stars_already_in_C) = K
- **Action**: Place stars in all K unknown cells in C

### R1.7 — Shape Forced

- **Condition**: Shape P has K unknown cells remaining AND (S - stars_already_in_P) = K
- **Action**: Place stars in all K unknown cells in P

---

## Tier 2: Bound Propagation

Rules that compute and propagate star count bounds.

### R2.1 — 2×2 Maximum Bound

- **Condition**: Any 2×2 region Q of unknown cells
- **Action**: Q.max = 1 (adjacency constraint — any two stars in a 2×2 would touch)

### R2.2 — Region Tiling Bound

Compute the maximum stars a region can hold by covering it with 2×2s.

- **Condition**: Region R has unknown cells
- **Procedure to find minimal tiling**:
  1. Let `remaining` = set of unknown cells in R
  2. Let `count` = 0
  3. While `remaining` is non-empty:
     - Find any 2×2 that overlaps `remaining` in ≥1 cell
     - Remove those cells from `remaining`
     - Increment `count`
  4. If no 2×2 can be found but `remaining` is non-empty, each remaining cell forms its own "1×1 tile" (max 1 star, but only if non-adjacent to other 1×1s)
- **Action**: Set R.max = `count`

### R2.3 — Exact Tiling Deduction

- **Condition**: Region R requires exactly N stars AND R.max = N (from R2.2)
- **Action**: Each 2×2 in the minimal tiling contains exactly 1 star. Mark these as "star-containing 2×2s."

### R2.4 — 1×n Identification

A 1×n is a strip of cells (in one row or column) that must contain at least one star.

- **Condition**: Shape P, after applying R2.2, has some unknown cells not covered by any 2×2 in the tiling, AND those uncovered cells all lie in a single row R (or column C)
- **Action**: Mark those cells as a "1×n" with min=1

Alternative identification:
- **Condition**: Shape P requires S stars, the minimal 2×2 tiling covers S-1 stars worth, AND the remaining cells lie in a single row/column
- **Action**: Mark remaining cells as a 1×n with min=1

### R2.5 — 1×n Line Completion

- **Condition**: In row R (or column C), the sum of all 1×n.min values ≥ S
- **Action**:
  - Eliminate all cells in R outside any 1×n
  - If sum of 1×n.min = S exactly, set each 1×n.max = 1 (tighten to "exactly 1")

### R2.6 — Bound Tightening from 1×n

- **Condition**: A 1×n in shape P is tightened to max=1, AND P requires S stars total
- **Action**: The cells of P outside this 1×n require exactly S-1 stars. Recompute bounds for that sub-region.

---

## Tier 3: Exclusion

Eliminate cells where placing a star would make the puzzle unsolvable.

### R3.1 — Shape Exclusion

- **Condition**: For cell X in shape P:
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. Compute R2.2 (tiling bound) on remaining unknown cells in P
  4. Result: remaining.max < (S - stars_already_in_P - 1)
- **Action**: Eliminate X

### R3.2 — Row Exclusion

- **Condition**: For cell X in row R:
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. Compute R2.2 on remaining unknown cells in R
  4. Result: remaining.max < (S - stars_already_in_R - 1)
- **Action**: Eliminate X

### R3.3 — Column Exclusion

- **Condition**: For cell X in column C:
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. Compute R2.2 on remaining unknown cells in C
  4. Result: remaining.max < (S - stars_already_in_C - 1)
- **Action**: Eliminate X

### R3.4 — Star-Containing 2×2 Exclusion

When a star-containing 2×2 has some cells eliminated, the remaining cells' position constrains which row/column gets Q's star.

- **Condition**:
  1. A 2×2 Q is marked "contains exactly 1 star"
  2. Q has exactly 2 unknown cells remaining (call them A and B)
  3. A and B are positioned such that:
     - **Diagonal**: A is at (r1,c1), B is at (r2,c2) where r1≠r2 and c1≠c2
     - **Horizontal line**: same row, adjacent columns
     - **Vertical line**: same column, adjacent rows
  4. For diagonal case: Q's star must be in A or B, so it's in row r1 OR row r2
  5. Check row r1: stars_in_r1 + 1×n.min_in_r1 + 1 (if Q's star were in r1) > S
- **Action**: Q's star cannot be in row r1, so it must be in B (row r2). Eliminate A.

Same logic applies for columns, and for horizontal/vertical line cases where the star must land in one of two columns/rows.

---

## Tier 4: Counting

Cross-referencing rows/columns with shapes to find containment relationships.

### R4.1 — Undercounting

- **Condition**: There exist N shapes {P1, P2, ..., Pn} that are completely contained within N rows {R1, R2, ..., Rn}
- **Procedure to check**: For each subset of shapes of size N, check if union of shapes ⊆ union of some N rows
- **Action**: Eliminate all cells in {R1...Rn} that lie outside {P1...Pn}

Symmetric version for columns.

### R4.2 — Overcounting

- **Condition**: There exist N shapes {P1, P2, ..., Pn} that completely contain N rows {R1, R2, ..., Rn} (i.e., every cell in those rows is in one of those shapes)
- **Action**: Eliminate all cells in {P1...Pn} that lie outside {R1...Rn}

Symmetric version for columns.

### R4.3 — Finned Undercounting

- **Condition**:
  1. Cell X is in shape Px
  2. If X were eliminated, then N shapes (including Px) would be completely contained in N rows
  3. X lies outside those N rows
- **Action**: Eliminate X (placing a star there would force N×S stars into N rows that can only get stars from N shapes, but X would add an extra)

### R4.4 — Finned Overcounting

- **Condition**:
  1. Cell X is in shape Px
  2. If X were eliminated, then N shapes would completely contain N rows
  3. X lies outside those N rows but inside one of the N shapes
- **Action**: Eliminate X

### R4.5 — Squeeze

- **Condition**:
  1. Take two consecutive rows R1, R2 (or columns)
  2. Let `region` = all unknown cells in R1 ∪ R2
  3. Compute minimal 2×2 tiling of `region`
  4. Tiling uses exactly 2S 2×2s
- **Action**: Mark each 2×2 as "contains exactly 1 star"

### R4.6 — Composite Shape Formation

- **Condition**: Through R4.1, R4.2, or R4.5, a region (possibly spanning multiple shapes) is determined to contain exactly K stars
- **Action**:
  1. Create a virtual "composite shape" with star requirement K
  2. Apply R2.2, R2.3, R2.4 to this composite
  3. Apply R3.1 exclusion treating composite as a shape

---

## Tier 5: Geometric Patterns

Specific configurations with known consequences.

### R5.1 — Kissing Ls

Two star-containing 2×2s with L-shaped remaining cells in a "kissing" configuration.

- **Context**: Typically arises after a squeeze (R4.5) where some cells in the 2×2s are already eliminated

- **Configuration** (one example):
  ```
  . A B .     (row 0: corners eliminated)
  A A B B     (row 1: full)
      ^
      X (shared cell at col 1-2 boundary)
  ```
  After eliminations, A's unknown cells form an "L" and B's unknown cells form an "L".

- **Condition**:
  1. Two star-containing 2×2s A and B are horizontally (or vertically) adjacent
  2. Due to eliminations, A has 2-3 unknown cells forming an L-shape
  3. Due to eliminations, B has 2-3 unknown cells forming an L-shape
  4. Let X be a cell where the Ls "kiss" (shared or adjacent)
  5. Compute: if X were starred, how many stars land in X's row from A + B + existing?
  6. Compute: if X were NOT starred, how many stars land in X's row from A + B + existing?
  7. One of these computations exceeds S

- **Action**: Eliminate X (if starring X causes overflow) OR place star at X (if NOT starring X causes overflow)

- **Operational shortcut for 2★**: If two adjacent star-containing 2×2s could each place their star in the same row, and that row already has stars/1×ns, check if 2 additional stars would exceed S=2. If so, the shared boundary cell that would prevent this must be resolved.

### R5.2 — The M

- **Condition**: A 5-cell region in this configuration:
  ```
  . * .
  * * *
  ```
  (top-center and entire bottom row, forming an "M" or cross shape)
- **Action**: Set region.max = 2 (three stars would violate adjacency)
- **Usage**: When computing squeeze, treat M as contributing max 2 instead of tiling it with 2×2s

### R5.3 — Pressured T

- **Condition**:
  1. A T-tetromino region exists:
     ```
     T T T
       T
     ```
  2. A star or 1×n exists in the same row as the top edge (T T T)
- **Action**: Set T.max = 1 (the top row is "pressured", leaving only the stem as viable)

### R5.4 — Fish (X-Wing generalization)

- **Condition**:
  1. Select N columns {C1...Cn}
  2. In each column, find which rows contain unknown cells
  3. The union of these rows across all N columns = exactly N rows {R1...Rn}
  4. Each column has ≥1 unknown cell in these rows
- **Action**: Eliminate all cells in {R1...Rn} that are NOT in {C1...Cn}

Symmetric version: select N rows, find N columns.

**Operational procedure**:
- For N=2 (X-Wing): For each pair of columns, collect their unknown-cell rows. If both columns have unknowns in exactly the same 2 rows, eliminate other cells in those rows.
- For N=3 (Swordfish): Same with 3 columns/rows.

### R5.5 — Finned Fish

- **Condition**:
  1. N columns would form a Fish on N rows, EXCEPT one column has 1 extra cell outside those N rows
  2. That extra cell is X
- **Action**: Eliminate X (starring X breaks the fish, but fish would eliminate X's row anyway)

### R5.6 — N-Rooks Property

Applies to S★ puzzles on (4S+2)×(4S+2) grids.

- **Setup**: Subdivide grid into (2S+1)×(2S+1) meta-grid of 2×2 blocks
- **Property**: Exactly (2S+1) of these 2×2 blocks contain NO stars, and these empty blocks form an n-rooks pattern (one per meta-row, one per meta-column)
- **Operational use**:
  1. When R2.3 identifies star-containing 2×2s aligned to this meta-grid
  2. Count empty 2×2s in a meta-row or meta-column
  3. If a meta-row has (2S+1)-1 star-containing 2×2s, the remaining 2×2 is empty → eliminate all cells in it
  4. Apply rook constraints: if 3 empty 2×2s are in a 3×3 meta-region, remaining 2 empty 2×2s must be in opposite corners of the full meta-grid

---

## Tier 6: Uniqueness

Assume puzzle has exactly one solution. Use for speed-solving; avoid for difficulty rating.

### R6.1 — By a Thread

- **Condition**:
  1. Identify a region Q (possibly composite) that is "isolated": all cells adjacent to Q are either eliminated or part of Q
  2. Q requires K stars where K ≥ 1
  3. Q has exactly 2 valid configurations for placing its K stars (call them Config-A and Config-B)
  4. Exactly one cell X exists that is:
     - Adjacent to Q (shares edge/corner with a Q cell)
     - NOT eliminated
     - NOT in Q
  5. If X is NOT a star, both Config-A and Config-B remain valid (puzzle would have 2 solutions)
- **Action**: Place star at X

**Operational procedure**:
1. Find shapes/regions nearly surrounded by eliminations
2. Check if region has exactly 2 star configurations
3. Check if exactly 1 adjacent non-eliminated cell exists outside region
4. If that cell being empty leaves both configs valid → star it

### R6.2 — At Sea

- **Condition**:
  1. Identify region Q that is completely isolated (ALL adjacent cells eliminated, zero "threads")
  2. Q has 2+ valid configurations
  3. Some configurations are "symmetric" (swapping would give another valid solution)
- **Action**: Q must be in the unique non-symmetric configuration. Eliminate cells that would allow symmetric configs.

**Operational procedure**:
1. Find completely isolated regions
2. If region's stars could be in column A or column B with no external constraint → they must be in whichever column is NOT swappable with another isolated region
3. In practice: stars go in the "inner" column (not edge) to prevent swap-solutions

### R6.3 — By a Thread at Sea

- **Condition**: R6.2 determines Q must be in a specific configuration, AND exactly one external cell X can enforce this
- **Action**: Place star at X

---

## Implementation Notes

### Rule Ordering

Apply rules in tier order. Within a tier, any order works. After any successful rule application, restart from Tier 1.

### Difficulty Scoring

- Tier 1-2 only: Easy
- Requires Tier 3: Medium
- Requires Tier 4: Hard
- Requires Tier 5: Expert
- Requires Tier 6: Uses uniqueness assumption (avoid for difficulty rating)

### Scanning Strategy

For rules with "for each cell X" conditions:
- R3.x (Exclusion): Scan all unknown cells
- R4.1-4.2 (Counting): Enumerate shape subsets up to size N/2
- R4.3-4.4 (Finned): For each unknown cell, check if eliminating it creates counting scenario
- R5.4 (Fish): Enumerate column pairs, triples, etc.
- R6.x (Uniqueness): Scan for isolated regions (regions where most/all neighbors are eliminated)
