# Production Rules

**LONG DOCUMENT**

Production rules are logic-based rules a human might use to solve puzzles. They are determined from manually solving the puzzles and recording patterns. They are for a `solve()` algorithm that is basically a repeated loop of these rules.

For each rule, the pattern will be checked if they match. Cells will be eliminated or starred as dictated by each rule and the loop is started over. If after following a rule, the puzzle is fully solved, algorithm is done. If the puzzle is still unsolved and all the rules are examined with no hits, the puzzle is unsolvable or has multiple solutions. The algorithm should only find a solution when the puzzle has a single unique solution.

They are sorted by difficulty and computing power, rules are to be cycled from least complicated to most complicated. Each puzzle's difficulty is rated on what rules are needed to be used.

All rules are Condition → action pairs so it is easier to turn into "functions".

## Definitions

- S - Star count (typically 1-6)
- R - Row
- C - Column
- P - Shape
- X - Cell
- T - Star
- K - Remaining unmarked Xs in a constraint (R, C, or P)
- N(R), N(C), N(P) - Stars still needed in constraint: S minus Ts already placed
- Unmarked - Cell that is neither starred nor eliminated
- Targeted - Shape where minTiles = N(P), meaning each tile must contain exactly one star

## Rules

- Each R, C, and P must contain exactly S
- No two Ts can be adjacent horizontally, vertically, or diagonally

## Tier 1. Trivial Moves

_Eliminations directly from the puzzle rules_

### R1.1 Eliminate Neighbors

- **Condition:** X contains a T
- **Action**: Eliminate all 8 neighbors of X (Xs sharing edge or corner)

### R2.1 Row Complete

- **Condition**: R contains S
- **Action**: Eliminate all remaining unmarked Xs in R

### R2.2 Column Complete

- **Condition**: C contains S
- **Action**: Eliminate all remaining unmarked Xs in C

### R2.3 Shape Complete

- **Condition**: P contains S
- **Action**: Eliminate all remaining unmarked Xs in P

## Tier 2. Forced Moves

_Direct star placements when remaining Xs exactly match Ts needed_

### R3.1 Row Forced

- **Condition**: R has K remaining AND (S - Ts in R) = K
- **Action**: Place T in all K in R

### R3.2 Column Forced

- **Condition**: C has K remaining AND (S - Ts in C) = K
- **Action**: Place T in all K in C

### R3.3 Shape Forced

- **Condition**: P has K remaining AND (S - Ts in P) = K
- **Action**: Place T in all K in P

### R4 Constraint Fills Shape

- **Condition**: All remaining unmarked Xs in a constraint (R or C) belong to a single P AND N(constraint) = N(P)
- **Action**: Eliminate all unmarked Xs in P not in that constraint

### R5 Shape Confined to Constraint

- **Condition**: All remaining unmarked Xs in P are in a single constraint (R or C) AND N(P) = N(constraint)
- **Action**: Eliminate all unmarked Xs in the constraint not in P

## Tier 3: Counting

### R6.1 Undercounting Rows

- **Condition**: All remaining unmarked Xs in Q shapes are completely contained within Q rows
- **Action**: Eliminate any cell in those Q rows that is NOT in any of the Q shapes

### R6.2 Undercounting Columns

- **Condition**: All remaining unmarked Xs in Q shapes are completely contained within Q columns
- **Action**: Eliminate any cell in those Q columns that is NOT in any of the Q shapes

### R7.1 Overcounting Rows

- **Condition**: All remaining unmarked Xs in Q rows are completely contained within Q shapes
- **Action**: Eliminate any cell in the Q shapes that is NOT in the Q rows

### R7.2 Overcounting Columns

- **Condition**: All remaining unmarked Xs in Q columns are completely contained within Q shapes
- **Action**: Eliminate any cell in the Q shapes that is NOT in the Q columns

## Tier 4: Tiling and Eliminations

### MinTiles Algorithm

Calculates the minimum number of tiles needed to cover a set of cells. Each tile holds at most 1 star, so `minTiles(P) = max stars P can hold`.

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
  1. If minTiles(P) = N(P), mark shape as "targeted"
  2. If minTiles(P) != N(P), mark shape as "untargeted"

### R9.1 Internal Exclusion

- **Condition**: Shape is "Targeted"
- **Action**:
  1. Simulate placing a star in the first top-left unmarked cell in P
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

- **Condition**: R8-R9 rules produced no progress this iteration AND P has K ≤ S×4 remaining unmarked cells
- **Action**: Find true minimum tiles via exhaustive search
  1. Generate all possible tilings of unmarked cells in P
  2. Find the tiling with minimum tile count
  3. If minTiles = N(P), mark shape as "targeted" and loop back to R9.1
  4. If minTiles < N(P), puzzle is unsolvable
  5. If minTiles > N(P), shape remains "untargeted"
