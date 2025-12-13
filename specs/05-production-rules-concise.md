# Production Rules

Condition → action pairs for the Star Battle solver.

## Puzzle Definition

- N×N grid with N shapes, star count S (typically 1–6)
- Each row, column, and shape contains exactly S stars
- No two stars adjacent (including diagonally)

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
- **Action**: Each 2×2 in tiling contains exactly 1 star

### R3.4 — 1×n Identification

- **Condition**: Shape P has uncovered cells (after tiling) in a single row/column
- **Action**: Mark as 1×n with min=1

### R3.5 — 1×n Line Completion

- **Condition**: Row/column has sum(1×n.min) ≥ S
- **Action**: Eliminate cells outside 1×ns; if sum = S exactly, set each 1×n.max = 1

### R3.6 — Bound Tightening from 1×n

- **Condition**: 1×n in shape P tightened to max=1
- **Action**: Remaining cells in P require S-1 stars; recompute bounds

---

## Tier 4: Exclusion

Eliminate cells where placing a star makes the puzzle unsolvable.

### R4.1–R4.3 — Direct Exclusion (Shape/Row/Column)

- **Condition**: Hypothetically star X, eliminate neighbors, compute tiling on remaining cells in X's region
- **Action**: If remaining.max < (needed stars - 1), eliminate X

### R4.4–R4.6 — Cross-Region Exclusion

- **Condition**: Starring X would break a different shape/row/column (remaining.max < needed)
- **Action**: Eliminate X

### R4.7 — Pressured Exclusion

- **Condition**: Cell X at (R, C) where row_pressure or col_pressure + 1 > S
  - pressure = existing_stars + sum(1×n.min)
- **Action**: Eliminate X

### R4.8 — Star-Containing 2×2 Pressured Exclusion

- **Condition**: 2×2 marked "contains 1 star" has 2 unknown cells (diagonal or line); placing star in one would exceed row/column pressure
- **Action**: Eliminate that cell; star must be in the other

---

## Tier 5: Counting

### R5.1 — Undercounting

- **Condition**: N shapes completely contained in N rows (or columns)
- **Action**: Eliminate cells in those rows outside those shapes

### R5.2 — Overcounting

- **Condition**: N shapes completely contain N rows (or columns)
- **Action**: Eliminate cells in those shapes outside those rows

### R5.3 — Finned Undercounting

- **Condition**: Cell X prevents undercounting; X is in the N rows but outside all N shapes
- **Action**: Eliminate X

### R5.4 — Finned Overcounting

- **Condition**: Cell X prevents overcounting; X is in one of N shapes but outside all N rows
- **Action**: Eliminate X

### R5.5 — Squeeze

- **Condition**: Two consecutive rows/columns tile to exactly 2S 2×2s
- **Action**: Each 2×2 contains exactly 1 star

### R5.6 — Set Differential Computation

Add/subtract regions (rows, columns, shapes, composites) algebraically.

**Procedure**:

1. For each cell, track count (incremented on add, decremented on subtract)
2. Track total star count

**Actions**:

- If all counts ∈ {0,1}: create composite region with computed star requirement
- If total = 0: eliminate all cells with count = 1 (R5.6c)

---

## Tier 6: Geometric Patterns

### R6.1 — Kissing Ls (2★)

- **Condition**: Two adjacent star-containing 2×2s with L-shaped unknowns; both could place stars in same row/column, exceeding S
- **Action**: Eliminate boundary cell

### R6.2 — The M (2★)

- **Condition**: 5-cell cross pattern (top-center + bottom row)
- **Action**: max = 2 (despite 3-tile coverage)

### R6.3 — Pressured T

- **Condition**: T-tetromino with star/1×n in same row/column as its long edge
- **Action**: T.max = 1

### R6.4 — Fish

- **Condition**: N columns have unknowns only in same N rows
- **Action**: Eliminate cells in those N rows outside those N columns (symmetric for rows→columns)

### R6.5 — Finned Fish

- **Condition**: Starring X would complete a Fish pattern, but X falls in the Fish's elimination zone
- **Action**: Eliminate X

### R6.6 — N-Rooks Property

For S★ on (4S+2)×(4S+2) grids: subdivide into (2S+1)×(2S+1) meta-grid of 2×2 blocks.

- Exactly (2S+1) blocks are empty, forming n-rooks pattern (one per meta-row/column)
- **R6.6a**: Tiling deficit reveals empty blocks
- **R6.6b**: Rook constraints deduce remaining empty positions
- **R6.6c**: Corner rook deduction from central region analysis
- **R6.6d**: Mark complementary blocks as star-containing

---

## Tier 7: Uniqueness

Assume exactly one solution. Use for speed-solving only.

### R7.1 — By a Thread

- **Condition**: Isolated region Q has exactly 2 valid star configs; exactly 1 adjacent non-eliminated cell X outside Q
- **Action**: If X not starred leaves both configs valid → star X

### R7.2 — At Sea

- **Condition**: Multiple isolated regions with no thread between them
- **Action**: Stars must align to same column/row; eliminate cells that would place stars differently

### R7.3 — By a Thread at Sea

- **Condition**: R7.2 determines required configuration; exactly 1 cell X can enforce it
- **Action**: Star X

---

## Implementation Notes

**Rule Ordering**: Apply by tier. Restart from Tier 1 after any success.

**Difficulty**:

- Tier 1-3: Easy
- Tier 4: Medium
- Tier 5: Hard
- Tier 6 or complex R5.6: Expert
- Tier 7: Uniqueness (don't rate)

**Exclusion Order**: Direct (R4.1-3) → Cross-region (R4.4-6) → Pressured (R4.7-8)
