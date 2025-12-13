# Production Rules

**LONG DOCUMENT**

Production rules are logic-based rules a human might use to solve puzzles. They are determined from manually solving the puzzles and recording patterns. They are for a `solve()` algorithm that is basically a repeated loop of these rules.

For each rule, the pattern will be checked if they match. CELLS will be eliminated or starred as dictated by each rule and the loop is started over. If after following a rule, the puzzle is fully solved, algorithm is done. If the puzzle is still unsolved and all the rules are examined with no hits, the puzzle is unsolvable or has multiple solutions. The algorithm should only find a solution when the puzzle has a single unique solution.

They are sorted by difficulty and computing power, rules are to be cycled from least complicated to most complicated. Each puzzle's difficulty is rated on what rules are needed to be used.

All rules are Condition → action pairs so it is easier to turn into "functions".

## Definitions

- STAR COUNT - number of stars that need to be in each row, column and shape for this particular puzzle


## Rules

- Each ROW, COLUMN, and SHAPE must contain exactly S
- No two STARS can be adjacent horizontally, vertically, or diagonally

## Tier 1. Trivial Moves

_Eliminations directly from the puzzle rules_

### R1.1 Eliminate Neighbors

- **Condition:** CELL contains a STAR
- **Action**: Eliminate all 8 neighbors of CELL (CELLS sharing edge or corner)

### R2.1 Row Complete

- **Condition**: ROW contains STAR COUNT
- **Action**: Eliminate all remaining unmarked CELLS in ROW

### R2.2 Column Complete

- **Condition**: COLUMN contains STAR COUNT
- **Action**: Eliminate all remaining unmarked CELLS in COLUMN

### R2.3 Shape Complete

- **Condition**: SHAPE contains STAR COUNT
- **Action**: Eliminate all remaining unmarked CELLS in SHAPE

## Tier 2. Forced Moves

_Direct star placements when remaining CELLS exactly match STARS needed_

### R3.1 Row Forced

- **Condition**: ROW has K remaining AND (STAR COUNT - STARS in ROW) = K
- **Action**: Place STAR in all K in ROW

### R3.2 Column Forced

- **Condition**: COLUMN has K remaining AND (STAR COUNT - STARS in COLUMN) = K
- **Action**: Place STAR in all K in COLUMN

### R3.3 Shape Forced

- **Condition**: SHAPE has K remaining AND (STAR COUNT - STARS in SHAPE) = K
- **Action**: Place STAR in all K in SHAPE

### R4.1 Constraint Fills Shape

- **Condition**: All remaining unmarked CELLS in a constraint (ROW or COLUMN) belong to a single SHAPE AND N(constraint) = N(SHAPE)
- **Action**: Eliminate all unmarked CELLS in SHAPE not in that constraint

### R5.1 Shape Confined to Constraint

- **Condition**: All remaining unmarked CELLS in SHAPE are in a single constraint (ROW or COLUMN) AND N(SHAPE) = N(constraint)
- **Action**: Eliminate all unmarked CELLS in the constraint not in SHAPE

## Tier 3: Counting

### R6.1 Undercounting Rows

- **Condition**: All remaining unmarked CELLS in Q shapes are completely contained within Q rows
- **Action**: Eliminate any cell in those Q rows that is NOT in any of the Q shapes

### R6.2 Undercounting Columns

- **Condition**: All remaining unmarked CELLS in Q shapes are completely contained within Q columns
- **Action**: Eliminate any cell in those Q columns that is NOT in any of the Q shapes

### R7.1 Overcounting Rows

- **Condition**: All remaining unmarked CELLS in Q rows are completely contained within Q shapes
- **Action**: Eliminate any cell in the Q shapes that is NOT in the Q rows

### R7.2 Overcounting Columns

- **Condition**: All remaining unmarked CELLS in Q columns are completely contained within Q shapes
- **Action**: Eliminate any cell in the Q shapes that is NOT in the Q columns

## Tier 4: Tiling and Eliminations

### MinTiles Algorithm

Calculates the minimum number of tiles needed to cover a set of cells. Each tile holds at most 1 star, so `minTiles(SHAPE) = max stars SHAPE can hold`.

```
function minTiles(cells):
  uncovered = cells.copy()
  tileCount = 0

  while uncovered not empty:
    // Try 2×2 first (covers up to 4 cells)
    best2x2 = find 2×2 position covering most uncovered (≥2)
    if best2x2 exists:
      mark those cells covered
      tileCount++
      continue

    // Then L-shape (2×2 minus corner, covers 3 cells)
    bestL = find L-shape covering ≥2 uncovered
    if bestL exists:
      mark covered
      tileCount++
      continue

    // Then 1×3 or 3×1 (covers up to 3 cells)
    best1x3 = find 1×3 covering ≥2 uncovered
    if best1x3 exists:
      mark covered
      tileCount++
      continue

    // Then 1×2 or 2×1 (covers 2 cells)
    best1x2 = find 1×2 covering 2 uncovered
    if best1x2 exists:
      mark covered
      tileCount++
      continue

    // Remaining singles
    tileCount += uncovered.length
    break

  return tileCount
```

### R8.1 Greedy Tiling

- **Condition**: Tier 1-3 rules produced no eliminations or placements this iteration. Evaluate shapes in order of fewest unmarked cells.
- **Action**: Run MinTiles on unmarked cells in P
  1. If minTiles(SHAPE) = N(SHAPE), mark shape as "targeted"
  2. If minTiles(SHAPE) != N(SHAPE), mark shape as "untargeted"

### R9.1 Internal Exclusion

- **Condition**: Shape is "Targeted"
- **Action**:
  1. Simulate placing a star in the first top-left unmarked cell in SHAPE
  2. If the placement of the star forces the minimum amount of tiles to be less than the remaining stars in that shape, eliminate that cell
  3. If the placement of that star does not force the minimum amount of tiles to be less than the remaining stars, then remove the simulated star and continue
  4. Cycle through 1-3 with the next cell

### R9.2 External Exclusion

- **Condition**: Shape is "Targeted"
- **Action**:
  1. Simulate placing a star in a cell that borders the shape vertically, horizontally, or diagonally
  2. If the placement of the star forces the minimum amount of tiles in the targeted shape to be less than the remaining stars in that shape, eliminate that cell
  3. If the placement of that star does not force the minimum amount of tiles to be less than the remaining stars, then remove the simulated star and continue
  4. Cycle through 1-3 with the next bordering cell

### R10.1 Exhaustive Tiling

- **Condition**: R8-R9 rules produced no progress this iteration AND SHAPE has K ≤ S×4 remaining unmarked cells
- **Action**: Find true minimum tiles via exhaustive search
  1. Generate all possible tilings of unmarked cells in SHAPE
  2. Find the tiling with minimum tile count
  3. If minTiles = N(SHAPE), mark shape as "targeted" and loop back to R9.1
  4. If minTiles < N(SHAPE), puzzle is unsolvable
  5. If minTiles > N(SHAPE), shape remains "untargeted"
