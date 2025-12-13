# Production Rules

**LONGER DOC**

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
- K - Remaining unknown Xs in a constraint (R, C, or P)

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
- **Action**: Eliminate all remaining Xs in R

### R2.2 Column Complete

- **Condition**: C contains S
- **Action**: Eliminate all remaining Xs in C

### R2.3 Shape Complete

- **Condition**: P contains S
- **Action**: Eliminate all remaining unknown Xs in P

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

### R4.1 Shape Fills Column

- **Condition**: All remaining Xs in C belong to a single P AND (S - Ts in C) = (S - Ts in P)
- **Action**: Eliminate all Xs in P not in C

### R4.2 Shape Fills Row

- **Condition**: All remaining Xs in R belong to a single P AND (S - Ts in R) = (S - Ts in P)
- **Action**: Eliminate all Xs in P not in R

### R5.1 Shape Confined to Column

- **Condition**: All remaining Xs in P are in a single C AND (S - Ts in P) = (S - Ts in C)
- **Action**: Eliminate all Xs in C not in P

### R5.2 Shape Confined to Row

- **Condition**: All remaining Xs in P are in a single R AND (S - Ts in P) = (S - Ts in R)
- **Action**: Eliminate all Xs in R not in P

## Tier 3: Tiling and Eliminations

### R6.1 Tiling - WIP

- **Condition**: No Trivial or Forced Moves remain
- **Action**: Tile shapes with 2×2 regions to bound star counts
  1. Tile each P with non-overlapping 2×2 regions (4-cell squares)
  2. Fill gaps with 3-cell L-shapes (2×2 minus corner)
  3. Fill gaps with 3-cell 1×3 regions
  4. Fill gaps with 2-cell 1×2 regions
  5. Fill remaining with 1×1 tiles
  6. Count minimum tiles needed to cover P
  7. If min tiles = (S - Ts in P), each tile contains exactly one T
  8. Apply exclusions to tiles with exactly one valid T placement
