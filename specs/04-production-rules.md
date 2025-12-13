# Production Rules

Atomic condition → action pairs for the Star Battle solver.

Source: https://kris.pengy.ca/starbattle

## Puzzle Definition

- Grid divided into N shapes on an N×N grid
- Star count S (typically 1–6)
- Each row, column, and shape must contain exactly S stars
- No two stars adjacent horizontally, vertically, or diagonally

## Tier 1: Trivial Marks

Eliminations that follow directly from the puzzle rules (documentation section 1.1).

### R1.1 — Star Adjacency Elimination

- **Condition**: Cell X contains a star
- **Action**: Eliminate all 8 neighbors of X (cells sharing edge or corner)
- **Documentation**: "Since no two stars can touch (even diagonally), you may mark all cells that share an edge or corner with a star."

### R1.2 — Row Complete

- **Condition**: Row R contains S stars
- **Action**: Eliminate all remaining unknown cells in R
- **Documentation**: "Since each row (or column) must contain exactly the specified number of stars, you may mark the remainder of a row (or column) once it has that many stars."

### R1.3 — Column Complete

- **Condition**: Column C contains S stars
- **Action**: Eliminate all remaining unknown cells in C
- **Documentation**: "Since each row (or column) must contain exactly the specified number of stars, you may mark the remainder of a row (or column) once it has that many stars."

### R1.4 — Shape Complete

- **Condition**: Shape P contains S stars
- **Action**: Eliminate all remaining unknown cells in P
- **Documentation**: "Since each shape must contain exactly the specified number of stars, you may mark the remainder of a shape once it has that many stars."

---

## Tier 2: Forced Placements

Direct star placements when remaining cells exactly match stars needed.

### R2.1 — Row Forced

- **Condition**: Row R has K unknown cells remaining AND (S - stars_already_in_R) = K
- **Action**: Place stars in all K unknown cells in R

### R2.2 — Column Forced

- **Condition**: Column C has K unknown cells remaining AND (S - stars_already_in_C) = K
- **Action**: Place stars in all K unknown cells in C

### R2.3 — Shape Forced

- **Condition**: Shape P has K unknown cells remaining AND (S - stars_already_in_P) = K
- **Action**: Place stars in all K unknown cells in P

---

## Tier 3: Bound Propagation

Rules that compute and propagate star count bounds.

### R3.1 — 2×2 Maximum Bound

- **Condition**: Any 2×2 region Q of unknown cells
- **Action**: Q.max = 1 (adjacency constraint — any two stars in a 2×2 would touch)

### R3.2 — Region Tiling Bound

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

### R3.3 — Exact Tiling Deduction

- **Condition**: Region R requires exactly N stars AND R.max = N (from R3.2)
- **Action**: Each 2×2 in the minimal tiling contains exactly 1 star. Mark these as "star-containing 2×2s."

### R3.4 — 1×n Identification

A 1×n is a strip of cells (in one row or column) that must contain at least one star.

- **Condition**: Shape P, after applying R2.2, has some unknown cells not covered by any 2×2 in the tiling, AND those uncovered cells all lie in a single row R (or column C)
- **Action**: Mark those cells as a "1×n" with min=1

Alternative identification:

- **Condition**: Shape P requires S stars, the minimal 2×2 tiling covers S-1 stars worth, AND the remaining cells lie in a single row/column
- **Action**: Mark remaining cells as a 1×n with min=1

### R3.5 — 1×n Line Completion

- **Condition**: In row R (or column C), the sum of all 1×n.min values ≥ S
- **Action**:
  - Eliminate all cells in R outside any 1×n
  - If sum of 1×n.min = S exactly, set each 1×n.max = 1 (tighten to "exactly 1")

### R3.6 — Bound Tightening from 1×n

- **Condition**: A 1×n in shape P is tightened to max=1, AND P requires S stars total
- **Action**: The cells of P outside this 1×n require exactly S-1 stars. Recompute bounds for that sub-region.

---

## Tier 4: Exclusion

Eliminate cells where placing a star would make the puzzle unsolvable. This includes both direct exclusion (breaking the region the cell is in) and cross-region exclusion (breaking other regions through adjacency effects). As stated in the documentation: "Such cells can be both inside and outside the considered region."

Exclusion comes in two main forms:

- **Pressured Exclusion (R4.7-R4.8)**: Direct capacity violations from existing stars and 1×ns in intersecting rows/columns
- **Tiling Exclusion (R4.1-R4.6)**: Insufficient remaining space after hypothetical placement and neighbor elimination

Both forms implement the "exclusion" concept from documentation §1.4-1.5.

### R4.1 — Direct Shape Exclusion

- **Condition**: For cell X in shape P:
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. Compute R3.2 (tiling bound) on remaining unknown cells in P
  4. Result: remaining.max < (S - stars_already_in_P - 1)
- **Action**: Eliminate X

### R4.2 — Direct Row Exclusion

- **Condition**: For cell X in row R:
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. Compute R3.2 on remaining unknown cells in R
  4. Result: remaining.max < (S - stars_already_in_R - 1)
- **Action**: Eliminate X

### R4.3 — Direct Column Exclusion

- **Condition**: For cell X in column C:
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. Compute R3.2 on remaining unknown cells in C
  4. Result: remaining.max < (S - stars_already_in_C - 1)
- **Action**: Eliminate X

### R4.4 — Cross-Region Shape Exclusion

Check if placing a star at X would prevent OTHER shapes from fitting their required stars. This implements the "outside the considered region" aspect of exclusion from the documentation.

- **Condition**: For any cell X (in any shape P_x):
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. For each shape P ≠ P_x that has cells affected by step 2:
     - Let `affected_cells` = cells in P that would be eliminated by X's neighbors
     - Let `remaining_cells` = unknown cells in P excluding `affected_cells`
     - Compute R3.2 (tiling bound) on `remaining_cells`
     - If remaining_cells.max < (S - stars_already_in_P), then X breaks P
  4. Result: X breaks at least one other shape
- **Action**: Eliminate X

**Operational note**: A cell in shape A can be eliminated because placing a star there would prevent shape B from fitting its required stars, even though the cell is "outside" shape B.

### R4.5 — Cross-Region Row Exclusion

Check if placing a star at X would prevent OTHER rows from fitting their required stars.

- **Condition**: For any cell X (in row R_x):
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. For each row R ≠ R_x that has cells affected by step 2:
     - Let `affected_cells` = cells in R that would be eliminated by X's neighbors
     - Let `remaining_cells` = unknown cells in R excluding `affected_cells`
     - Compute R3.2 (tiling bound) on `remaining_cells`
     - If remaining_cells.max < (S - stars_already_in_R), then X breaks R
  4. Result: X breaks at least one other row
- **Action**: Eliminate X

### R4.6 — Cross-Region Column Exclusion

Check if placing a star at X would prevent OTHER columns from fitting their required stars.

- **Condition**: For any cell X (in column C_x):
  1. Hypothetically place a star at X
  2. Hypothetically eliminate X's 8 neighbors
  3. For each column C ≠ C_x that has cells affected by step 2:
     - Let `affected_cells` = cells in C that would be eliminated by X's neighbors
     - Let `remaining_cells` = unknown cells in C excluding `affected_cells`
     - Compute R3.2 (tiling bound) on `remaining_cells`
     - If remaining_cells.max < (S - stars_already_in_C), then X breaks C
  4. Result: X breaks at least one other column
- **Action**: Eliminate X

### R4.7 — Pressured Exclusion

Eliminate cells where placing a star would cause a row, column, or shape to exceed its star capacity due to existing pressure from stars and 1×ns. This is "exclusion in the presence of other stars or 1×ns" from documentation §1.5 (first example).

**R4.7a — Row/Column Pressure**

- **Condition**: For cell X at (row R, column C):
  1. Compute row_pressure = stars_already_in_R + sum(min for all 1×ns in R)
  2. If row_pressure + 1 > S (placing star at X would exceed row capacity)
  3. OR: Compute col_pressure = stars_already_in_C + sum(min for all 1×ns in C)
  4. If col_pressure + 1 > S (placing star at X would exceed column capacity)
- **Action**: Eliminate X

**Operational notes:**

- This is the general case of "exclusion in the presence of stars/1×ns" from documentation §1.5
- Check this BEFORE tiling exclusion (R4.1-R4.3) as it's computationally cheaper
- Common scenario: a 1×n in a row creates pressure that eliminates cells in other shapes intersecting that row
- Example: If row R already has 1 star and a 1×n with min=1, then for S=2, row_pressure = 1 + 1 = 2, so any other cell in R must be eliminated

**R4.7b — Shape Pressure** (typically redundant with R1.4 and R7.1)

- **Condition**: For cell X in shape P:
  1. Compute shape_pressure = stars_already_in_P + sum(min for 1×ns that are exclusively contained in P)
  2. If shape_pressure + 1 > S
- **Action**: Eliminate X

**Note**: R4.7b is usually covered by R1.4 (Shape Complete) when shape_pressure = S, and by R4.1 (Direct Shape Exclusion) otherwise. Include only if implementation benefits from explicit pressure checking.

### R4.8 — Star-Containing 2×2 Pressured Exclusion

A specialized form of pressured exclusion (R4.7) that applies to star-containing 2×2s with L-shaped or diagonal unknown cell patterns. This implements the second part of documentation §1.5: "Pressured exclusions can be used extensively with identified star-containing-2×2s."

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

## Tier 5: Counting

Cross-referencing rows/columns with shapes to find containment relationships.

### R5.1 — Undercounting

- **Condition**: There exist N shapes {P1, P2, ..., Pn} that are completely contained within N rows {R1, R2, ..., Rn}
- **Procedure to check**: For each subset of shapes of size N, check if union of shapes ⊆ union of some N rows
- **Deduction**: The stars in {R1...Rn} must be in {P1...Pn} (because the N shapes require N×S stars total, and those N rows contain exactly N×S stars, with N shapes being the only source within those rows)
- **Action**: Eliminate all cells in {R1...Rn} that lie outside {P1...Pn}

Symmetric version for columns: If N shapes {P1...Pn} are completely contained within N columns {C1...Cn}, the stars in {C1...Cn} must be in {P1...Pn}. Eliminate all cells in {C1...Cn} that lie outside {P1...Pn}.

### R5.2 — Overcounting

Overcounting is equivalent to undercounting from the opposite direction (R5.1), but may be easier to spot in some situations.

- **Condition**: There exist N shapes {P1, P2, ..., Pn} that completely contain N rows {R1, R2, ..., Rn} (i.e., every cell in those rows is in one of those shapes)
- **Procedure to check**: For each subset of shapes of size N, check if union of N rows ⊆ union of those N shapes (i.e., every cell in the N rows is covered by at least one of the N shapes)
- **Deduction**: The stars in {P1...Pn} must be in {R1...Rn} (because N shapes need N×S stars total, and N rows can accommodate exactly N×S stars)
- **Action**: Eliminate all cells in {P1...Pn} that lie outside {R1...Rn}

Symmetric version for columns.

### R5.3 — Finned Undercounting

When trying to spot undercounting, shapes will inevitably just barely exceed the necessary conditions. If placing a star in a cell would create an undercounting scenario across rows (or columns) containing that cell, it would force too many stars into the undercounted rows (or columns), and thus can be marked.

- **Condition**:
  1. Cell X is unknown
  2. If X were eliminated, then N shapes would be completely contained in N rows
  3. X lies inside one of those N rows but outside all of the N shapes
  4. (X is the "fin" preventing the undercounting scenario)
- **Deduction**: The N shapes would provide exactly N×S stars to the N rows. If X were starred, it would add a (N×S + 1)th star to those rows, exceeding their capacity.
- **Action**: Eliminate X

**Symmetric version for columns**: If eliminating X would create N shapes ⊆ N columns, and X is in one of those N columns but outside all N shapes, eliminate X.

**Operational note**: The cell creating finned undercounting is typically in the same row as the shapes "just barely exceeding" the N-row containment. Look for cells that stick out from shape boundaries into rows that would otherwise create perfect undercounting.

### R5.4 — Finned Overcounting

Looking from the other direction, we can similarly spot finned overcounting. If placing a star in a cell would create an overcounting scenario across rows (or columns) that do not contain that cell but include that cell's shape, it would force too few stars into the overcounted rows (or columns), and thus can be marked.

- **Condition**:
  1. Cell X is unknown
  2. X is in shape Px
  3. If X were eliminated, then N shapes (including Px) would completely contain N rows
  4. X lies outside those N rows (but inside shape Px, which is one of the N shapes)
  5. (X is the "fin" preventing the overcounting scenario)
- **Deduction**: The N rows need exactly N×S stars total. Because the N shapes completely contain these rows (when X is ignored), all N×S stars for those rows must come from the N shapes. If X were starred, shape Px would place one of its S stars outside the N rows, leaving the N rows with fewer than N×S stars.
- **Action**: Eliminate X

**Symmetric version for columns**: If eliminating X would create N shapes ⊇ N columns, and X is in one of the N shapes but outside all N columns, eliminate X.

**Operational note**: The cell creating finned overcounting is typically just outside the row boundaries of an almost-perfect overcounting scenario. Look for cells in shapes that "stick out" beyond the rows that would otherwise be completely contained.

---

**Finned Counting Examples (2★)**:

**Finned Undercounting Example**:

- Shapes A, B, C would be contained in rows 3, 4, 5 (undercounting scenario)
- EXCEPT cell X at (row=3, col=7) is in row 3 but outside all three shapes
- If X were starred: rows 3,4,5 would need 6 stars, but shapes A,B,C provide 6, plus X makes 7
- Therefore: Eliminate X

**Finned Overcounting Example**:

- Shapes D, E, F completely contain rows 6, 7, 8 (overcounting scenario)
- EXCEPT cell Y at (row=9, col=2) is in shape D but outside rows 6,7,8
- If Y were starred: Shape D puts 1 of its 2 stars in row 9, leaving only 1 star for rows 6,7,8
- Therefore: rows 6,7,8 would get only 5 stars from shapes D,E,F (need 6)
- Therefore: Eliminate Y

**Relationship to base counting**:

- Finned undercounting is to undercounting (R5.1) what finned fish (R6.5) is to fish (R6.4)
- Finned overcounting is to overcounting (R5.2) what finned fish (R6.5) is to fish (R6.4)
- The "fin" is the single cell that prevents the perfect scenario

---

### R5.5 — Squeeze

A squeeze refers to minimally tiling 2×2s across pairs of consecutive rows (or columns) where every star can be accounted for.

- **Condition**:
  1. Take two consecutive rows R1, R2 (or columns)
  2. Let `region` = all unknown cells in R1 ∪ R2
  3. Compute minimal 2×2 tiling of `region`
  4. Tiling uses exactly 2S 2×2s (meaning all stars in those two rows/columns are accounted for)
- **Action**: Mark each 2×2 as "contains exactly 1 star"

**Operational procedure**:

- Squeezes are most easily spotted in consecutive row/column pairs that already have blocks of eliminated cells
- These existing marks reduce the number of possible 2×2 tilings, making the squeeze more impactful
- For S=2: Look for pairs of rows/columns where minimal tiling yields exactly 4 2×2s

**Follow-on deductions** after identifying star-containing 2×2s via squeeze:

- Apply R4.8 (Star-Containing 2×2 Pressured Exclusion) for immediate marks
- Check if the squeeze accounts for all stars in intersected shapes (enabling shape completion via R1.4)
- Check if combining squeeze results with other constraints accounts for all stars in the pair of rows/columns (enabling line completion via R1.2/R1.3)
- Consider forming composite shapes (R6.6) when squeeze results span multiple shapes
- Before concluding a squeeze is uninformative (e.g., 2S+1 2×2s for 2S stars), check for R6.2 (The M) or R6.3 (Pressured T) patterns within the squeezed region—these reduce effective tile count and may make the squeeze informative

- The pair of rows/columns with identified star-containing 2×2s becomes a composite region that can be used in R5.6 set differential operations

### R5.6 — Set Differential Computation

Set differentials generalize composite shape formation through algebraic addition and subtraction of regions with known star counts. As stated in documentation section 2.6: "We can add and subtract equivalent sets to identify regions with varying star counts, where addition and subtraction consist of incrementing (or decrementing) a count for each cell within a set while adding (or subtracting) the total star count across that set."

**Core Concept**: Addition and subtraction consist of incrementing (or decrementing) a count for each cell within a set while adding (or subtracting) the total star count across that set.

#### R5.6a — Differential Algebra

- **Condition**: Identify a sequence of operations on regions with known star counts

  **Eligible regions**:

  - Rows: Each contains exactly S stars
  - Columns: Each contains exactly S stars
  - Shapes: Each contains exactly S stars
  - Composite regions: Previously computed via R5.1, R5.2, R5.5, or R5.6

  **Operations**:

  - **Addition (+)**: For each cell in region R, increment its count by 1; add R's star count to total
  - **Subtraction (-)**: For each cell in region R, decrement its count by 1; subtract R's star count from total

- **Procedure**:

  1. Initialize: `cell_counts = {}` (maps each cell to integer count), `total_stars = 0`
  2. For each operation in sequence:
     - If `+RegionR`:
       - For each cell c in R: `cell_counts[c] += 1`
       - `total_stars += star_count(R)`
     - If `-RegionR`:
       - For each cell c in R: `cell_counts[c] -= 1`
       - `total_stars -= star_count(R)`
  3. Result: A set of cells with counts, and a total star count

- **Action**:
  - **IF** all `cell_counts` values are in {0, 1} (no negative or multi-counted cells):
    - Let `result_region` = {cells where cell_counts[c] = 1}
    - Create composite region with `star_requirement = total_stars`
    - Apply R3.2, R3.3, R3.4 to this composite
    - Apply R4.1 exclusion treating composite as a shape
  - **ELSE IF** all `cell_counts` values are ≥ 0 (no negative cells, but some multi-counted):
    - Record for potential use in R5.6b
  - **ELSE**: Discard this differential sequence (contains negative counts, invalid)

#### R5.6b — Multi-Counted Cell Simplification

When differential computation yields multi-counted cells, additional operations can simplify them.

- **Condition**:

  1. From R5.6a, a differential computation yields cells with counts > 1
  2. Identify regions that can be subtracted to reduce multi-counted cells to count 1 or 0
  3. After subtraction, all cells have counts in {0, 1}

- **Action**: Apply the additional subtraction and proceed as in R5.6a final step

**Example**:

- Add top row (2★): all cells in top row get count=1, total=2
- Add left column (2★): top-left corner now count=2, other column cells count=1, total=4
- Continue adding more regions as needed
- Subtract shapes to reduce multi-counted cells
- When all cells have count ∈ {0, 1}, create composite region from cells with count=1

#### R5.6c — Zero-Star Region Elimination

A special case when differential yields a region with zero stars.

- **Condition**: R5.6a or R5.6b yields `total_stars = 0` and all `cell_counts ∈ {0, 1}`

- **Action**: Eliminate all cells in `result_region` (a region with 0 stars cannot contain any stars)

**Example** (from documentation section 2.6):

- Add top row + bottom row (total: 4 stars in 2★ puzzle)
- Add left column + right column (total: 8 stars, corner cells now have count=2)
- Subtract 4 corner shapes (total: 8 stars)
- Result: 0 stars across the computed region (after resolving multi-counted corner cells to 0)
- Action: Mark all cells in result_region

**Note**: "Because the resulting set has no double-counted or negative cells, we can treat it as a region with a known star count of zero."

#### R5.6d — Operational Heuristics

Set differentials are most effective when:

1. **Targeting specific regions**: Work backwards from a region you want to prove has K stars

   - Identify which rows/columns/shapes cover it
   - Find combinations that isolate that region

2. **Exploiting symmetry**: Corners and edges often yield clean differentials

   - Example: All 4 corners, all 4 edges
   - Add perimeter rows/columns, subtract shapes

3. **Building on other rules**:

   - Use R5.1/R5.2 (undercounting/overcounting) to identify partial composites
   - Use R5.5 (squeeze) results as addable regions
   - Chain differentials: output of one becomes input to another

4. **Systematic enumeration** (for automated solving):
   - For each unknown region of interest
   - Try common patterns:
     - Add 2 rows ± 2 columns ± intersecting shapes
     - Add perimeter ± corner shapes
     - Add shapes ± containing rows/columns
   - Prioritize sequences that yield zero-star regions (R5.6c) for maximum eliminations

#### R5.6e — Relation to Other Rules

**Undercounting (R5.1) as differential**:

- N shapes completely in N rows
- Equivalent to: (+N rows) - (N shapes) = cells in rows but not shapes, with S×N - S×N = 0 stars
- Action: Eliminate (matches undercounting)

**Overcounting (R5.2) as differential**:

- N shapes completely contain N rows
- Equivalent to: (+N shapes) - (N rows) = cells in shapes but not rows, with S×N - S×N = 0 stars
- Action: Eliminate (matches overcounting)

**Squeeze composite (R5.5 follow-on)**:

- After identifying star-containing 2×2s, the pair of rows forms a composite region
- Can be added to other regions in further differential operations

**Composite shape formation (legacy concept)**:

- Simple composites (K stars in a region from direct counting) are the base case of set differentials
- R5.6 generalizes this to arbitrary algebraic combinations

**Note**: Rules R5.1 (undercounting), R5.2 (overcounting), and R5.5 (squeeze) remain as specialized rules for efficiency and clarity, but R5.6 provides the general framework that subsumes them.

4. If the composite can be further decomposed into consecutive row/column pairs, consider applying R5.5 (Squeeze) to gain additional information

---

## Tier 6: Geometric Patterns

Specific configurations with known consequences.

### R6.1 — Kissing Ls (2★)

Pattern where two adjacent star-containing 2×2s with L-shaped unknowns force too many stars into a single row/column. From the documentation: "Kissing Ls is an easy-to-spot pattern that shows up relatively often—particularly from the results of a squeeze. The pattern readily gives a mark in 2★, but can still apply in larger puzzles with sufficient pressure from additional stars (or 1×ns)."

- **Context**: Typically arises after a squeeze (R5.5) where some cells in the 2×2s are already eliminated

- **Geometric Requirements**:

  Two star-containing 2×2s A and B must be:

  1. Horizontally adjacent (share a vertical boundary) OR vertically adjacent (share a horizontal boundary)
  2. Each has 2-3 unknown cells forming an L-shape due to prior eliminations
  3. The L-shapes are oriented such that they "kiss" at or near their shared boundary

  **Horizontal Kissing Ls** (row-wise pressure):

  ```
  Row r:   [. A] [B .]     (corners eliminated, forming two Ls)
  Row r+1: [A A] [B B]
           ↑   ↑
           Both Ls can place stars in row r

  Or variations where the unknown cells in A and B form L-shapes
  that both have cells in the same row r
  ```

  **Vertical Kissing Ls** (column-wise pressure):

  ```
  Col c:   [.  A]
  Col c+1: [A  A]
           ─────
  Col c:   [B  B]
  Col c+1: [.  B]

  Both Ls can place stars in the same column
  ```

- **Condition**:

  1. Two star-containing 2×2s A and B are horizontally (or vertically) adjacent
  2. Due to eliminations, A has 2-3 unknown cells forming an L-shape
  3. Due to eliminations, B has 2-3 unknown cells forming an L-shape
  4. The L-shapes are positioned such that both A and B could place their required star in the same row r (for horizontal Kissing Ls) or same column c (for vertical Kissing Ls)
  5. Let X be the cell at the boundary between A and B that lies in the shared row r (or column c)
  6. Count pressure in row r (or column c): existing_stars + 1×n.min + potential_stars_from_other_sources
  7. If both A and B were to place their stars in row r (or column c), the total would exceed S

- **Action**: Eliminate X

- **Reasoning**: From the documentation: "We can get the mark because a star there would force too many stars into a given row (or column, with vertical Kissing Ls)."

  - If X (at the boundary) were a star, it would satisfy A's star requirement
  - B must then place its star in one of B's other unknown cells
  - If all of B's other unknown cells are also in row r (or column c), B is forced to place a star there
  - This gives at least 2 stars in row r from A and B alone
  - Combined with existing stars/1×ns/other constraints in row r, this exceeds S
  - Therefore X cannot be a star

- **Operational procedure for 2★**:

  1. After a squeeze (R5.5), scan pairs of adjacent star-containing 2×2s
  2. Check if both have L-shaped unknowns oriented toward each other (Kissing Ls configuration)
  3. Identify which row (or column) both Ls could place their star in
  4. Count existing pressure in that row: stars + 1×n.min + other star-containing 2×2s that could contribute
  5. If both Ls placing stars in that row would give 3+ stars total, eliminate the boundary cell X
  6. Often leads to immediate star placement in one of the Ls (via R1.4 or R3.3)

- **Examples from documentation**:

  - "We can see its application in the following row-wise squeeze: Counting from the left, the first two star-containing-2×2s form (partially occluded) Kissing Ls. This gives a mark (and a star)."
  - "The second and third 2×2s of the squeeze also form Kissing Ls. The resulting mark, however, is not as impactful."
  - Multiple Kissing Ls pairs can exist in the same squeeze

- **Generalization to S>2**:

  - Pattern applies when the shared row r (or column c) already has (S-1) stars accounted for from:
    - Existing stars
    - 1×ns with min=1
    - Other star-containing 2×2s
  - If both Ls could add their stars to row r, total would be (S-1) + 2 = S+1, exceeding S
  - Action remains: eliminate the kissing point X

- **Relationship to other rules**:
  - Kissing Ls is a specialized case of pressured exclusion (R4.7)
  - The "pressure" comes from the adjacent star-containing 2×2 plus existing row/column constraints
  - Identified as a separate pattern due to:
    - High frequency after squeezes
    - Visual distinctiveness (two L-shapes facing each other)
    - Ease of recognition during manual solving
  - The term "Kissing Ls" refers to the visual appearance: two L-shaped regions facing each other at their "kiss" point

**Relationship to Pressured Exclusion**: Kissing Ls is the pattern mentioned in documentation §1.5 regarding "L or diagonal shape" star-containing 2×2s creating marks given pressure in rows/columns. R4.7 (Pressured Exclusion) handles the general case of row/column pressure, R4.8 handles individual star-containing 2×2s with pressure, and R6.1 (Kissing Ls) handles the compound case of two adjacent 2×2s.

### R6.2 — The M (2★)

The M is a region that can be minimally tiled with three 2×2s but in a 2★ puzzle contains at most two stars.

- **Condition**: A 5-cell region in this configuration:

  ```
  . M .
  M M M
  ```

  (top-center and entire bottom row, forming an "M" or cross shape)

- **Geometric Property**:

  - Minimal 2×2 tiling requires 3 tiles to cover all 5 cells
  - However, placing 3 stars in this pattern always forces at least two stars to be adjacent (violates adjacency constraint)
  - Therefore: max stars = 2 (proven by exhaustive enumeration of all 3-star placements)

- **Action**: Set region.max = 2

- **Note**: The M may span multiple shapes. The max=2 bound applies regardless of shape boundaries.

- **Usage**: Spotting the M can enable squeezes that otherwise wouldn't be informative.
  - When computing a squeeze across a pair of rows/columns (R5.5), identify any M patterns within the region
  - A pair of rows in 2★ normally requires exactly 4 2×2 tiles (one per star)
  - If the pair contains an M pattern:
    1. The M contributes 3 tiles to the minimal tiling but only max 2 stars
    2. Subtract the M's contribution: treat the squeeze as having (total_tiles - 1) star-containing 2×2s
    3. Example: If minimal tiling = 5 2×2s and includes an M, then the remaining area has 5 - 3 = 2 tiles, plus the M with 2 stars = 4 stars total (the standard 2★ squeeze amount)
  - This enables squeezes that would otherwise be uninformative (e.g., 5-tile minimal tiling becomes a valid 4-star squeeze when M is accounted for)

**Operational procedure for identifying M in squeeze**:

1. Compute minimal 2×2 tiling of the squeeze region (pair of consecutive rows/columns)
2. If tiling count = 2S + 1 (one more than expected), check for M pattern
3. If M exists within the tiled region, separate it out:
   - Mark the non-M 2×2s (count = 2S - 1) as star-containing via R3.3
   - Apply R3.2 to the M region with max=2 bound
4. If M does not exist, consider Pressured T (R6.3) as an alternative explanation

### R6.3 — Pressured T

A Pressured T refers to a 2★ scenario where a T-tetromino has a star (or 1×n) in the same row (or column) as the long 1×3 section of the tetromino. In such cases, the T-tetromino contains at most one star.

- **Condition**:

  1. A T-tetromino region exists (4 cells forming a T shape in any orientation)
  2. A star or 1×n exists in the same row (or column) as the long 1×3 section of the T

- **Recognition of all T orientations**:

  **Horizontal T (stem down)**:

  ```
  T T T    ← long edge in row R
    T
  ```

  Pressure: star/1×n in row R → Set T.max = 1

  **Inverted T (stem up)**:

  ```
    T
  T T T    ← long edge in row R
  ```

  Pressure: star/1×n in row R → Set T.max = 1

  **Vertical T (stem right)**:

  ```
  T
  T T      ← long edge in column C
  T
  ```

  Pressure: star/1×n in column C → Set T.max = 1

  **Vertical T (stem left)**:

  ```
    T
  T T      ← long edge in column C
    T
  ```

  Pressure: star/1×n in column C → Set T.max = 1

- **Action**: Set T.max = 1 (the pressured long edge cannot viably contain a star alongside the external pressure, leaving only the stem cell as viable for the T's star)

- **Usage**: Similar to R6.2 (The M), spotting a Pressured T can enable squeezes that otherwise wouldn't be informative. When computing a squeeze (R5.5) that would normally be minimally tiled by (2S+1) 2×2s (uninformative for 2★), acknowledging a Pressured T with max=1 allows treating it as contributing at most 1 star instead of tiling it with multiple 2×2s. This can make the squeeze informative by reducing the effective tile count.

- **Operational notes**:
  - Most commonly applies to 2★ puzzles
  - The T-tetromino may span multiple shapes or be entirely within one shape
  - Pressure source must be in the same row (for horizontal T orientations) or column (for vertical T orientations) as the 1×3 section
  - After setting T.max = 1, recompute squeeze tilings (R5.5) and apply R3.2 for region bounds
  - Example from documentation: A pair of rows tiled with 5 2×2s (normally uninformative) becomes informative when a Pressured T is recognized, as the effective constraint is tighter than the naive tiling suggests

### R6.4 — Fish (X-Wing generalization)

Fish is a term borrowed from an analogous technique in Sudoku. It denotes patterns where across N columns, the stars are CONSTRAINED to be within the same N rows. In such cases, the rows may be marked in all cells outside those columns.

- **Condition**:
  1. Select N columns {C1...Cn}
  2. In each column Ci, identify all rows that contain unknown cells in Ci
  3. The union of these rows across all N columns = exactly N rows {R1...Rn}
  4. In other words: all unknown cells in {C1...Cn} lie entirely within {R1...Rn}
  5. Because each of the N columns requires S stars, the N columns collectively require N×S stars
  6. Because each of the N rows can hold at most S stars, the N rows collectively can hold at most N×S stars
  7. Therefore, ALL stars in {C1...Cn} must be in the intersection of {C1...Cn} and {R1...Rn}
  8. The N×S stars across the N rows are now fully accounted for by the N columns
- **Action**: Eliminate all cells in {R1...Rn} that are NOT in {C1...Cn}

**Symmetric version** (rows → columns):

The reverse is also true for N rows having stars constrained to the same N columns.

- **Condition**:
  1. Select N rows {R1...Rn}
  2. In each row Ri, identify all columns that contain unknown cells in Ri
  3. The union of these columns across all N rows = exactly N columns {C1...Cn}
  4. All unknown cells in {R1...Rn} lie entirely within {C1...Cn}
  5. The N×S stars in the N rows are accounted for by the N columns
- **Action**: Eliminate all cells in {C1...Cn} that are NOT in {R1...Rn}

**Operational procedure**:

- For N=2 (X-Wing): For each pair of columns, collect their unknown-cell rows. If both columns have unknowns in exactly the same 2 rows, the stars in those 2 columns are constrained to those 2 rows. Eliminate all other cells in those 2 rows (outside the 2 columns).
- For N=3 (Swordfish): Same with 3 columns constrained to 3 rows.
- For N=4+: Same generalization, though less common in practice.

**Note**: While such cases may arise in 2★ puzzles, Fish patterns are considerably more prevalent in 1★ puzzles—particularly finned fish (see R6.5).

### R6.5 — Finned Fish

Finned fish are "one mark away from being a fish." The "fin" is an unknown cell that, if starred, would complete a Fish pattern—but the star itself would fall in the Fish's elimination zone, creating a contradiction.

- **Condition**:
  1. Identify N columns {C1...Cn} and N rows {R1...Rn}
  2. Identify cell X (the potential "fin")
  3. Hypothetically place a star at X and eliminate X's 8 neighbors
  4. After these hypothetical eliminations:
     - Check if all remaining unknown cells in {C1...Cn} now lie entirely within {R1...Rn}
     - If YES: a Fish has formed on {C1...Cn} and {R1...Rn}
  5. The Fish (per R6.4) would eliminate all cells in {R1...Rn} that are outside {C1...Cn}
  6. Check if X itself is in row Ri where Ri ∈ {R1...Rn} AND X is outside {C1...Cn}
  7. If YES: X falls in the Fish's affected area (cells in {R1...Rn} outside {C1...Cn})
  8. Contradiction: X cannot both be a star and be eliminated by the Fish it creates
- **Action**: Eliminate X

**Symmetric version**: If starring X would create a Fish (by completing eliminations in N rows {R1...Rn} such that they constrain to N columns {C1...Cn}), and X is in column Ci ∈ {C1...Cn} but outside {R1...Rn}, and the Fish would eliminate cells in {C1...Cn} outside {R1...Rn} (including X), then eliminate X.

**Note**: Finned fish are particularly common in 1★ puzzles.

### R6.6 — N-Rooks Property

**Reference**: This rule formalizes the technique described in documentation §4.5 "n-Rooks" using the 10×10 2★ puzzle by Maho Yokota as a canonical example.

Applies to S★ puzzles on (4S+2)×(4S+2) grids (e.g., 6×6 1★, 10×10 2★).

- **Setup**: Subdivide the N×N grid into a (2S+1)×(2S+1) meta-grid of 2×2 blocks, aligned to even coordinates

  - For 10×10 2★:
    - Grid size: N = 10 = 4(2)+2 ✓
    - Meta-grid size: (2S+1) = (2×2+1) = 5×5
    - Meta-grid positions: (0,0), (0,2), (0,4), (0,6), (0,8), (2,0), ..., (8,8)
    - Total meta-cells: 25
    - Total stars in grid: N×S = 10×2 = 20
    - Total empty 2×2s: 25 - 20 = 5 (forming 5-rooks configuration)

- **Core Property**: Exactly (2S+1) of these 2×2 blocks contain NO stars, and these empty blocks form an n-rooks pattern (exactly one empty 2×2 in every meta-row AND every meta-column)

- **Intuition**: Why exactly (2S+1) empty 2×2s?

  - Total grid cells: N² = (4S+2)²
  - Total meta-grid 2×2 blocks: (2S+1)²
  - Each 2×2 contains 4 cells
  - Total cells covered: (2S+1)² × 4 = 4(4S²+4S+1) = 16S²+16S+4 = (4S+2)² ✓ (full coverage)
  - Total stars: N×S = (4S+2)×S = 4S²+2S
  - Maximum 2×2s with stars: N×S = 4S²+2S (each star-containing 2×2 has exactly 1 star, due to adjacency)
  - Empty 2×2s: (2S+1)² - (4S²+2S) = 4S²+4S+1 - 4S²-2S = 2S+1 ✓

- **Fundamental Constraint**: Across any pair of grid-rows (or grid-columns), there are exactly 2S stars. A pair of grid-rows contains 2N cells total (where N = 4S+2). If there were two meta-grid-aligned empty 2×2s across a pair of grid-rows:

  - These two 2×2s occupy 8 cells total
  - The remaining 2N-8 cells must contain 2S stars
  - Due to adjacency constraints, the maximum stars that fit in 2N-8 cells is approximately (2N-8)/2 = N-4 = (4S+2)-4 = 4S-2 = 2S-1 stars (for S≥1)
  - But we need exactly 2S stars (contradiction)
  - Therefore, any pair of grid-rows/columns contains at most one empty 2×2

  **Concrete example for 10×10 2★**:

  - Pair of rows = 20 cells total
  - Two empty 2×2s = 8 cells
  - Remaining = 12 cells, which can fit at most 3 stars (due to adjacency)
  - But we need exactly 4 stars (contradiction)

- **Operational use**:

  **R6.6a — Identifying Star-Containing 2×2s via Tiling Deficit**

  - **Condition**:
    1. A region R (shape or composite) requires K stars
    2. R can be minimally tiled with M meta-grid-aligned 2×2s (via R3.2)
    3. M > K (tiling deficit exists)
    4. Deficit = M - K empty 2×2s
  - **Action**:
    - The (M - K) empty 2×2s contribute to the n-rooks count
    - The remaining K 2×2s in the tiling each contain exactly 1 star (mark as star-containing 2×2s via R3.3)
    - These K star-containing 2×2s occupy K positions in the meta-grid

  **R6.6b — Deducing Empty 2×2 Positions from Rook Constraints**

  - **Condition**:
    1. Through R6.6a or other means, identify E empty 2×2s at meta-positions (mr₁,mc₁), (mr₂,mc₂), ..., (mrₑ,mcₑ)
    2. These E empty 2×2s occupy E meta-rows and E meta-columns
    3. The remaining (2S+1-E) empty 2×2s must occupy the remaining (2S+1-E) meta-rows and (2S+1-E) meta-columns
  - **Action**:
    - If a meta-row mr has (2S) meta-columns already containing star-containing 2×2s, the remaining meta-column in mr must contain the empty 2×2 → eliminate all 4 cells in that 2×2
    - If a meta-column mc has (2S) meta-rows already containing star-containing 2×2s, the remaining meta-row in mc must contain the empty 2×2 → eliminate all 4 cells in that 2×2

  **R6.6c — Corner Rook Deduction**

  - **Condition**:
    1. E empty 2×2s are identified in a central (2S+1-2)×(2S+1-2) meta-region (excluding the 4 corner meta-cells)
       - For 10×10 2★: central 3×3 meta-region (excluding 4 corners of the 5×5 meta-grid)
       - Central region size: (2S+1-2)×(2S+1-2) = (2S-1)×(2S-1) meta-cells
    2. E = (2S+1-2) (i.e., all but 2 rooks are in the central region)
       - For 10×10 2★: E = 3 rooks in the middle 3×3
       - These E rooks occupy E distinct meta-rows and E distinct meta-columns
       - For 10×10 2★: 3 rooks occupy meta-rows {1,2,3} and meta-columns {1,2,3} (middle positions)
    3. The 2 remaining empty 2×2s must be in opposite corners of the (2S+1)×(2S+1) meta-grid
       - Remaining meta-rows: 2 (top row 0 and bottom row 4 in 10×10 2★)
       - Remaining meta-columns: 2 (left column 0 and right column 4 in 10×10 2★)
       - Due to n-rooks constraint: cannot both be in same meta-row or meta-column
       - Therefore: must be at diagonally opposite corners
  - **Action**:
    - The 2 corner empty 2×2s cannot share a meta-row or meta-column (rook constraint)
    - Check each corner 2×2 for simple shape patterns or tiling constraints
    - If a corner 2×2 must contain a star (via R3.3 or simple shape analysis), the opposite corner 2×2 must be empty
    - For example, in 10×10 2★: if top-right corner 2×2 contains a star, bottom-left corner 2×2 is empty (eliminate all 4 cells)

  **R6.6d — Identifying Remaining Star-Containing 2×2s**

  - **Condition**:
    1. After applying R6.6a-c, some meta-positions are confirmed empty
    2. Other meta-positions in the same meta-row/column must contain stars to satisfy the n-rooks constraint
  - **Action**:
    - Mark the complementary 2×2s as star-containing
    - Apply R3.3 consequences (if a star-containing 2×2 has only 1 unknown cell in a region, star it)

- **Integration with Composite Shapes**: When R5.6 creates a composite shape, apply R6.6a to check if the composite's tiling deficit reveals empty 2×2s aligned to the meta-grid. These contribute to the total n-rooks count.

- **Integration with Squeezes**: N-rooks and squeezes work synergistically:

  1. **Squeezes identify star-containing 2×2s** (R5.5): Apply squeezes across pairs of rows/columns to mark which meta-grid-aligned 2×2s contain exactly 1 star
  2. **N-rooks identifies empty 2×2s** (R6.6a-b): Count the deficit between tiling and required stars to find empty 2×2s
  3. **Rook constraints deduce new star-containing 2×2s** (R6.6c-d): Use n-rooks rules to identify which remaining meta-positions must contain stars
  4. **Iterate**: Newly identified star-containing 2×2s enable new squeezes, which reveal more star-containing 2×2s, creating a "sea of squeezes"

  **Operational note**: When solving puzzles that activate R6.6, systematically apply squeezes after each n-rooks deduction to maximize progress. The documentation phrase "a sea of squeezes reveals that all of these 2×2s contain a star" refers to this iterative process.

#### Worked Example: 10×10 2★ Central Composite (from documentation §4.5)

This example demonstrates the full n-rooks deduction workflow:

**Setup**:

- Central composite shape (spanning multiple shapes)
- Region has 4 stars (from counting rules R5.1-R5.6)
- Region can be minimally tiled with 7 meta-grid-aligned 2×2s

**Step 1: Apply R6.6a (Tiling Deficit)**

- Tiling count M = 7
- Required stars K = 4
- Deficit = M - K = 3 empty 2×2s
- Therefore: 3 of the 7 2×2s are empty, and these contribute 3 of the 5 total rooks
- The remaining 4 2×2s each contain exactly 1 star (mark as star-containing)

**Step 2: Apply R6.6b (Rook Constraint Analysis)**

- The 3 empty 2×2s identified lie in the middle 3×3 portion of the 5×5 meta-grid
- These 3 rooks occupy 3 meta-rows and 3 meta-columns (the middle ones)
- The remaining 2 rooks must occupy:
  - The 2 remaining meta-rows (top and bottom)
  - The 2 remaining meta-columns (left and right)
  - Due to n-rooks constraint, they cannot share a meta-row or meta-column

**Step 3: Apply R6.6c (Corner Rook Deduction)**

- The 2 remaining rooks must be in opposite corners of the 5×5 meta-grid
- Possible positions: (top-left, bottom-right) OR (top-right, bottom-left)
- Check top-right corner 2×2 using simple shape analysis (R2.1-R2.3, R3.2-R3.3)
- If top-right 2×2 must contain a star → top-right is NOT a rook
- Therefore: bottom-left and top-left (or bottom-right) must be the 2 corner rooks
- More specifically: if top-right contains a star, then the 2 rooks are at top-left and bottom-right

**Step 4: Apply R6.6d + Iterative Squeezes**

- Mark the identified corner 2×2s as empty (eliminate all 4 cells in each)
- Mark their complementary 2×2s in the same meta-rows/columns as star-containing
- Apply R5.5 (squeezes) across pairs of rows/columns intersecting the central composite
- Each squeeze may reveal additional star-containing 2×2s
- "A sea of squeezes" iteratively identifies that all remaining 2×2s in the central composite contain stars

**Step 5: Propagate Consequences**

- Once all 4 stars in the composite are precisely located via star-containing 2×2s
- Apply R3.3 (if a star-containing 2×2 has only 1 viable cell, star it)
- Apply R1.4 (if an intersected shape reaches S stars, mark remainder)
- Continue with standard rules

---

## Tier 7: Uniqueness

Assume puzzle has exactly one solution. Use for speed-solving; avoid for difficulty rating.

**Important**: Uniqueness arguments require careful reasoning about what the "rest of the board" can and cannot specify. Key questions:

- Can an external star/constraint distinguish between two configurations?
- Would swapping stars between regions create another valid solution?
- Is there a "thread" (adjacent unknown cell) that breaks symmetry?

Uniqueness deductions build on each other: R7.1 establishes the "thread" concept, R7.2 addresses "at sea" (no threads), and R7.3 combines both.

### R7.1 — By a Thread

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

### R7.2 — At Sea: Isolated Region Constraint

When regions are completely isolated ("at sea") with no "thread" to influence them, uniqueness requires their star placements to be non-interchangeable.

**Core Principle**: If isolated regions could have stars in different columns/rows with no way for the rest of the board to specify which configuration, this would violate uniqueness. Combined with R7.1's observations, such ambiguity is only resolvable by forcing stars into the same column/row.

#### R7.2a — Same Column/Row Requirement

- **Condition**:

  1. Identify two or more regions {Q1, Q2, ...} where each Qi is:
     - Isolated: all adjacent cells are eliminated OR part of another isolated region in the set
     - Requires at least 1 star
  2. No "thread" exists: there is NO cell that:
     - Is outside all {Q1, Q2, ...}
     - Is unknown (not eliminated)
     - Is adjacent (shares edge/corner) to cells in multiple Qi regions
  3. For each Qi, enumerate possible star placements
  4. Stars in these regions could be distributed across multiple columns (or rows) with no external constraint to specify which distribution is correct

- **Action**: All regions {Q1, Q2, ...} must have their stars in the SAME column (or row). Specifically:
  - If considering column-wise: all stars from {Q1, Q2, ...} must land in the same column
  - If considering row-wise: all stars from {Q1, Q2, ...} must land in the same row
  - Eliminate cells in each Qi that would place stars in different columns/rows from each other

**Example**: In a 2★ puzzle, two isolated 1-star regions in the bottom-left corner have no thread between them. If their stars could be in column 0 vs column 1 independently, this would create multiple solutions. Therefore, both regions' stars must be in the same column.

#### R7.2b — Non-Swappable Configuration Selection

Once R7.2a determines stars must be in the same column/row, select which specific column/row.

- **Condition**:

  1. From R7.2a: regions {Q1, Q2, ...} must have stars in the same column (call the candidates {C1, C2, ...})
  2. For candidate column Ci:
     - Count total stars that would be placed in Ci from {Q1, Q2, ...}
     - Count total stars that would be placed in other columns from {Q1, Q2, ...}
  3. Check if placing stars in Ci vs Cj would create a "swap-symmetric" solution:
     - If all stars in Ci could swap with all stars in Cj
     - AND both configurations satisfy all row/column/shape constraints
     - AND swapping them doesn't affect the rest of the board
     - Then Ci and Cj are swap-symmetric

- **Action**: Eliminate cells that would place stars in swap-symmetric columns. Stars must be in the column that is NOT swappable.

**Operational heuristics**:

- **For 10×10 2★ specifically**: If isolated regions in a corner could have stars in the edge column vs the adjacent "inner" column, stars must be in the inner column (edge column would allow swapping with its neighbor)
- **General case**: Prefer columns/rows that are:
  - Not adjacent to the edge (edge positions often allow swaps)
  - More constrained by other regions (less swappable)
  - Asymmetrically positioned relative to the rest of the board

**Note**: The 10×10 2★ case has an additional constraint (mentioned in documentation): if stars were in the leftmost column, columns 2 and 3 would fit at most 3 stars total, which is insufficient. This board-size-specific arithmetic can reinforce the deduction but is not generalizable.

#### R7.2c — Implication Propagation

- **Condition**: R7.2b determines that isolated regions {Q1, Q2, ...} must have stars in column Cx
- **Action**:
  1. The remaining columns that intersect with {Q1, Q2, ...} must contain their required stars from OTHER regions/constraints
  2. If any other region overlaps with these remaining columns, propagate bounds and apply Tier 1-5 rules
  3. This often reveals that the puzzle will "force" specific placements in those other columns through standard logical rules

**Example**: In the documentation example, determining that red/blue stars must be in column 1 (not column 0) implies that the "yellow" stars must be in column 0. This may not be immediately deducible from R7.2 alone but becomes clear when other rules are applied.

### R7.3 — By a Thread at Sea

Combines R7.1 (By a Thread) with R7.2 (At Sea). This addresses the critical insight that R7.2's uniqueness-based determination (stars must be in a specific column/row) itself requires enforcement. The "thread" cell is not merely distinguishing between configurations—it's the mechanism by which R7.2's required configuration becomes enforceable by the puzzle.

- **Condition**:

  1. From R7.2a: Multiple isolated regions {Q1, Q2, ...} must have stars in the same column/row
  2. From R7.2b: The specific column/row is determined (call it Cx)
  3. Exactly ONE cell X exists that:
     - Is NOT in any Qi region
     - Is NOT eliminated
     - Is adjacent to cells in the Qi regions
     - Can act as a "thread" to enforce the required configuration
  4. If X were NOT a star, the R7.2-determined requirement (stars in {Q1, Q2, ...} must be in column Cx) would be unenforceable:
     - Without X as a star, both "stars in Cx" and "stars in other columns" configurations would satisfy all non-uniqueness constraints
     - X being a star is the ONLY mechanism by which the puzzle can force the Cx configuration
     - Therefore X must be a star (otherwise R7.2's uniqueness argument would fail and the puzzle would have multiple solutions)

- **Action**: Place star at X

**Operational procedure**:

1. After applying R7.2a and R7.2b to determine required configuration (stars must be in column Cx)
2. Recognize that R7.2's conclusion is based on uniqueness, not direct logical constraints
3. Scan for cells adjacent to the isolated regions that could enforce this requirement
4. Check if exactly ONE such cell X exists that:
   - Being a star would force the Cx configuration through normal rules (R1-R6)
   - NOT being a star would leave both "Cx" and "not-Cx" configurations valid under normal rules
5. If exactly one such enforcer cell exists → star it (it's the only way R7.2's requirement can be realized)

**Example from documentation section 3.3**:

Setup: Two isolated regions (red and blue) in a 2★ puzzle, each requiring one star.

1. **R7.2 application**: Red and blue stars must be in the inner (second) column

   - R7.2a: Stars must be in the same column (no thread to specify different columns)
   - R7.2b: Must be inner column, not edge (edge would be swappable)

2. **R7.3 recognition**: The yellow cell is adjacent to the isolated regions and is the ONLY thread by which the "inner column" requirement can be enforced

   - If yellow is NOT a star: Both "inner column" and "edge column" configurations satisfy all non-uniqueness rules
   - If yellow IS a star: Through normal rules (adjacency, row/column constraints), it forces the inner column configuration

3. **R7.3 conclusion**: Yellow must be a star—it's the enforcement mechanism for R7.2's uniqueness-based requirement

This demonstrates the key insight: "Based on 3.2, the red and blue stars must be in the inner column. However—like 3.1—the yellow cell is the only 'thread' by which this can be enforced!"

**Key distinction from R7.1**:

- **R7.1 (By a Thread)**: Thread distinguishes between two valid configurations within an isolated region
- **R7.3 (By a Thread at Sea)**: Thread enforces a configuration requirement that was determined by R7.2 (At Sea)

In R7.3, the thread is not choosing between local configurations—it's enforcing a global uniqueness constraint. Without it, R7.2's reasoning would be correct but unenforceable.

---

## Implementation Notes

### Rule Ordering

Apply rules in tier order. Within a tier, any order works. After any successful rule application, restart from Tier 1.

### Difficulty Scoring

- Tier 1-3 only: Easy
- Requires Tier 4: Medium
- Requires Tier 5 (excluding R5.6 or simple R5.6): Hard
- Requires Tier 5 (R5.6 with ≥3 operations) or Tier 6: Expert
- Requires Tier 6 (multiple advanced patterns) or complex R5.6: Expert+
- Requires Tier 7: Uses uniqueness assumption (avoid for difficulty rating)

**R5.6 complexity** (Set Differentials):

- 1-2 operations: Equivalent to R5.1/R5.2 (Hard tier)
- 3-4 operations: Expert tier
- ≥5 operations: Expert+ tier

**Note on R7.2**: The "At Sea" rules (R7.2a, R7.2b, R7.2c) are broken into sub-rules for clarity, but are conceptually a single deduction. In practice:

- R7.2a identifies that isolated regions must align column-wise/row-wise
- R7.2b selects the specific column/row
- R7.2c propagates implications
  Apply all three together when isolated regions are detected.

### Scanning Strategy

For rules with "for each cell X" conditions:

- R4.x (Exclusion): Scan all unknown cells
- R5.1-R5.2 (Counting): Enumerate shape subsets up to size N/2
- R5.3-R5.4 (Finned Counting): For each unknown cell, check if eliminating it creates counting scenario
- R6.4 (Fish): Enumerate column pairs, triples, etc.
- R7.x (Uniqueness): Scan for isolated regions (regions where most/all neighbors are eliminated)

### Exclusion Rule Application Order

Within Tier 4, apply exclusion rules in this order for efficiency:

1. **Direct exclusion first** (R4.1, R4.2, R4.3): Check if placing a star breaks the cell's own region

   - Faster to compute (only checks one region per cell)
   - More common than cross-region exclusion

2. **Cross-region exclusion** (R4.4, R4.5, R4.6): Check if placing a star breaks other regions

   - More expensive (checks multiple regions per cell)
   - Only needed when direct exclusion doesn't apply
   - Can be optimized: only check regions that actually have cells adjacent to X's 8-neighbor elimination pattern

3. **Pressured exclusion** (R4.7-R4.8): Apply after star-containing 2×2s are identified
   - Requires prior application of R3.3 or R5.5

**Optimization**: For cross-region rules (R4.4-R4.6), precompute which regions could possibly be affected by each cell X based on adjacency. Most cells only affect 1-3 other shapes/rows/columns through their 8 neighbors.

### Set Differential Implementation Strategy

R5.6 (Set Differentials) is the most computationally intensive rule. Implementation strategies:

**For human solvers**:

- Learn common patterns (corners, edges, perimeter combinations)
- Apply R5.6c (zero-star elimination) most frequently
- Use R5.6d heuristics to identify opportunities
- Prefer specialized rules (R5.1, R5.2, R5.5) when they apply directly

**For automated solvers**:

_Lazy evaluation_:

1. Only invoke R5.6 when Tier 1-5 rules (excluding R5.6) make no progress
2. Start with small operation sequences (≤3 operations)
3. Gradually increase complexity if no progress

_Heuristic search_:

1. Identify "interesting" regions (partially marked, adjacent to known stars)
2. Generate candidate operation sequences targeting those regions
3. Prune sequences that yield negative or many multi-counted cells
4. Prioritize zero-star results (R5.6c) as they eliminate most cells

_Caching_:

- Cache computed differentials keyed by operation sequence
- Reuse when board state changes elsewhere

_Complexity bounds_:

- Limit operation sequence length (e.g., ≤ 5 for most puzzles)
- Limit number of sequences tried per iteration (e.g., ≤ 100)
- For 10×10 2★ puzzles: Most applications use 3-4 operations
