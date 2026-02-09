# Star Battle Production Rules

Production rule system over constraint satisfaction problem for a human-solvable Star Battle puzzle generator.

## Star Battle Constraints

1. **Star Neighbors:** No star may touch another star horizontally, vertically, or diagonally.
2. **Star Quotas:** Each row, column, and region must contain exactly _n_ stars.

## System Framework

Series of **production rules** that emulate human deduction to validate solvable puzzles without brute-force guessing or backtracking. Applies one observation with a technique to produce a deduction. The solver cycles through rules in order until the puzzle is solved or determined to be unsolvable.

### Observations - Ways of Seeing the Board

1. **Direct** - Raw cell and container state: which cells are unknown, how many stars a container still needs.
2. **Tiling** - Derived from the Star Neighbors constraint. Given no two stars can be adjacent, every star can be contained within a 2x2 tile. Non-overlapping tiles placed on a container reveal the upper bound on its stars - its tiling capacity.
3. **Counting** - Derived from the Star Quotas constraint. Given that each container has a fixed star quota, overlaps between containers create forced deductions.

### Techniques - Methods of Reasoning

Techniques exist on a spectrum of "how much guesswork are you doing", ranked from "Pure Logic" to "Brute Force". This system cuts off at Bifurcation because it is single-depth - one assumption, immediately cascading consequences. Humans do this intuitively.

1. **Inferences** - Direct constraint propagation. See the state, deduce immediately. No search.
2. **Enumerations** - List all valid arrangements. What's a star in every arrangement must be a star. What's a mark in every arrangement must be a mark.
3. **Hypotheticals (Bifurcation)** - Single assumption. Pick a cell, assume a star placement, and see if it leads to a contradiction. If so, mark the cell.

Beyond Bifurcation lies **Backtracking** - make a choice, propagate multiple assumptions until arriving at a contradiction, undo, try the next. Backtracking is exponential and not human-solvable.

### Deductions - Solver Actions

1. **Marks** - Cell cannot contain a star.
2. **Placements** - Cell must contain a star.

## Production Rules

### 1. Star Neighbors - _Direct × Inference_

**Star Neighbors:** If a star is placed, then no star can touch it, so mark all of the star's surrounding neighbors diagonally, horizontally, and vertically.

### 2. Forced Placements - _Direct × Inference_

**Forced Placements:** If a container has the same number of unknown cells as needed stars, then those unknown cells must be the remaining stars, so place stars there.

### 3. Trivial Marks - _Direct × Inference_

**Trivial Marks:** If a container has all its needed stars, then no more stars can be placed, so mark the remaining cells.

### 4. Tiling Enumeration - _Tiling × Enumeration_

**Tiling Observation:** Given that no star can neighbor another star, any two cells within a 2x2 tile would be neighbors - so each tile holds at most one star. The maximum number of non-overlapping 2x2 tiles that fit in a container's unknown cells is the container's tiling capacity: the upper bound on stars that can be placed in that container. If a container's tiling capacity equals its needed stars, then every tile must contribute exactly one star, so enumeration produces all valid tiling assignments.

**Tiling Forced:** If a cell is a star in every valid tiling assignment of the container, then it must be a star, so place a star.

**Tiling Adjacency:** If a cell never appears as a star in any valid tiling assignment of a region, then it can't be a star, so mark the cell.

**Tiling Overhang:** If a cell outside of a region is covered by a tile in every valid tiling assignment of the region, then that cell can't be a star, so mark the cell.

### 5. Counting Enumerations - _Counting × Enumeration_

**Counting Observation:** Given that each container has a fixed star quota, overlaps between containers create forced deductions. A region overlapping a group of lines can contribute at most its remaining needed stars to those lines, capped by the number of unknown cells in the overlap. If the sum of every region's maximum contribution equals the line group's combined needed stars, the constraint is tight - each region must contribute exactly its maximum.

**Counting Marks:** If a tight constraint forces a region to place all its remaining stars inside a line group, then the region's cells outside the line group cannot be stars, so mark them.

### 6. Tiling Pairs - _Tiling × Enumeration_

**Tiling Pairs Observation:** Tiling extends naturally to pairs of consecutive rows or columns. If the pair's combined tiling capacity equals its combined needed stars, every tile must contribute exactly one star - the same tight condition as single-container tiling, applied across two lines at once.

**Tiling Pairs Forced:** If a cell is a star in every valid tiling of the pair, then it must be a star, so place a star.

**Tiling Pairs Adjacency:** If a cell never appears as a star in any valid tiling of the pair, then it can't be a star, so mark the cell.

**Tiling Pairs Overhang:** If a cell outside the pair is covered by a tile in every valid tiling of the pair, then that cell can't be a star, so mark the cell.

### 7. Tiling Counting - _Tiling + Counting × Enumeration_

**Tiling Counting Observation:** For a line (row or column), each touching region must place a minimum number of stars in that line - computed as `starsNeeded − capacity(cells outside the line)`. If the sum of these minimums equals the line's star quota, every region contributes exactly its minimum.

**Tiling Counting Marks:** If a region's minimum contribution to the line is zero, its cells in the line can't be stars, so mark them.

**Tiling Counting Forced:** If a tight constraint requires a region to place a specific number of stars outside the line, and the region has exactly that many unknown cells outside the line, then those cells must be stars, so place them.

**Grouped Tiling Counting Marks:** If a region's minimum contribution to a group of lines is zero, its cells in those lines can't be stars, so mark them. Grouped tiling counting fully subsumes single-line tiling counting - they are separated in the solver for execution simplicity and to match how humans apply the heuristic.

### 8. Direct Hypotheticals - _Direct × Hypothetical_

**Key Observation:** For each unknown cell, assume a star is placed there and mark its neighbors.

**Hypothetical Row Count:** If any nearby row (the star's row or its immediate neighbors) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Column Count:** If any nearby column (the star's column or its immediate neighbors) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Region Count:** If any affected region (the star's region or its neighbors' regions) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

### 9. Tiling Hypotheticals - _Tiling × Hypothetical_

**Hypothetical Row Capacity:** If any nearby row's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

**Hypothetical Column Capacity:** If any nearby column's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

**Hypothetical Region Capacity:** If any nearby region's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

### 10. Counting Hypotheticals - _Counting × Hypothetical_

**Counting Hypothetical Observation:** Given a hypothetical star is placed, certain consequences can be propagated through deterministic forced placements. The resulting board state is then checked against counting constraints. Hypothetical stars that create a contradiction can be marked.

**Hypothetical Counting Row:** If a hypothetical is placed, consequences propagated, and any group of rows now needs more stars than its overlapping regions can provide, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Counting Column:** If a hypothetical is placed, consequences propagated, and any group of columns now needs more stars than its overlapping regions can provide, then the assumption leads to a contradiction, so mark the cell.

### 11. Propagated Hypotheticals - _Direct + Tiling + Counting × Hypothetical_

**Propagation Observation:** Given a hypothetical star is placed and its neighbors marked, a container may now have exactly as many unknown cells as needed stars - triggering a Forced Placement. The forced star must also be placed and its neighbors marked, potentially propagating further with deterministic placements. If any consequence in this chain breaks the puzzle, the original hypothesis creates a contradiction and can be marked.

**Propagated Row Count:** If a hypothetical placement propagates forced placements and any row no longer has enough unknown cells to meet its needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Column Count:** If a hypothetical placement propagates forced placements and any column no longer has enough unknown cells to meet its needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Region Count:** If a hypothetical placement propagates forced placements and any region no longer has enough unknown cells to meet its needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Row Capacity:** If a hypothetical placement propagates forced placements and any nearby row's remaining cells can no longer fit enough 2x2 tiles for the needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Column Capacity:** If a hypothetical placement propagates forced placements and any nearby column's remaining cells can no longer fit enough 2x2 tiles for the needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Region Capacity:** If a hypothetical placement propagates forced placements and any affected region's remaining cells can no longer fit enough 2x2 tiles for the needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Counting Row:** If a hypothetical placement propagates forced placements and any group of rows now needs more stars than its overlapping regions can provide, then the assumption leads to a contradiction, so mark the cell.

**Propagated Counting Column:** If a hypothetical placement propagates forced placements and any group of columns now needs more stars than its overlapping regions can provide, then the assumption leads to a contradiction, so mark the cell.
