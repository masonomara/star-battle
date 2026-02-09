# Star Battle Puzzle

## Star Battle Rules

1. **Star Neighbors:** No star can neighbor another star (horizontally, vertically, or diagonally)
2. **Star Quotas:** Each row, column, and region must contain exactly N stars

---

## Decisions

**On Guessing:**

Techniques exist on a spectrum of "how much guesswork are you doing", ranked from "Pure Logic" to "Brute Force".

I chose to cut off at Bifurcation (hypotheticals) because it is "single depth". One assumption, immediately cascading consequences — humans do this intuitively.

1. Inferences: Direct constraint propagation. No brute force, pure logic.
2. Enumeration: Systematically list all possible configurations, then draw conclusions from commonalities between them.
3. Bifurcation (Hypotheticals): Single assumption — pick a cell, assume "placement" or "mark", and see if it leads to a broken puzzle. If so, deduce accordingly.
4. Backtracking: Make a choice, propagate consequences/more assumptions until you hit a contradiction, undo that choice, then try the next assumption. Runs exponentially.

**On Organizing:**

Humans don't think like how I described above. Humans think like humans. The tools above were extremely useful for "making sure all my gaps were covered" but not very useful for teaching. Now that I knew gaps were covered, I was able to teach, watch how people learned the game, and talk through different ways of teaching. Here's how I recorded the results:

## Production Rules

Production rules are a series of applied "Observations -> Techniques -> Deductions" that are cycled through until a puzzle is solved or determined to be unsolvable. The solver acts as a production system on top of a constraint satisfaction problem.

**Observations - ways of seeing the board:**

1. Direct - Raw cell and container state (which cells are unknown, how many stars a container still needs).
2. Tiling - Derived from Star Neighbors rule. Given no two stars can be adjacent, every star can be contained within a 2x2 tile. Non-overlapping tiles placed on a container reveal the upper bound on its stars.
3. Counting - Derived from Star Quotas rule. Given that each container has a fixed star quota, overlaps between containers create forced deductions.

**Techniques - how you apply observations:**

1. Inferences - Direct constraint propagation. See the state, deduce immediately. No search.
2. Enumerations - List all valid arrangements. What's a star in every arrangement must be a star. What's a mark in every arrangement must be a mark.
3. Hypotheticals - Assume a star placement, propagate deterministic consequences. If there is a contradiction, the assumption should be marked.

**Deductions - actions taken:**

1. Marks - this cell can't be a star
2. Placements - this cell must be a star

### Direct Inferences

**Star Neighbors:** If a star is placed, then no star can touch it, so mark all of the star's surrounding neighbors diagonally, horizontally, and vertically.

**Forced Placements:** If a container has the same number of unknown cells as needed stars, then those unknown cells must be the remaining stars, so place stars there.

**Trivial Marks:** If a container has all its needed stars, then no more stars can be placed, so mark the remaining cells.

### Tiling Enumeration

**Tiling Observation:** Given that no star can neighbor another star, any two cells within a 2x2 tile would be neighbors — so each tile holds at most one star. The maximum number of non-overlapping 2x2 tiles that fit in a container's unknown cells is the container's tiling capacity: the upper bound on stars that can be placed in that container. If a container's tiling capacity equals its needed stars, then every tile must contribute exactly one star, so enumeration produces all valid tiling assignments.

**Tiling Forced:** If a cell is a star in every valid tiling assignment of the container, then it must be a star, so place a star.

**Tiling Adjacency:** If a cell never appears as a star in any valid tiling assignment of a region, then it can't be a star, so mark the cell.

**Tiling Overhang:** If a cell outside of a region is covered by a tile in every valid tiling assignment of the region, then that cell can't be a star, so mark the cell.

### Counting Enumerations

**Counting Observation:** Given that each container has a fixed star quota, overlaps between containers create forced deductions. If a region overlapping a group of lines can contribute at most its remaining needed stars to those lines, capped by the number of unknown cells in the overlap. If the sum of every region's maximum contribution equals the line group's combined needed stars, the constraint is tight — each region must contribute exactly its maximum.

**Counting Marks:** If a tight constraint forces a region to place all its remaining stars inside a line group, then the region's cells outside the line group cannot be stars, so mark them.

### Tiling Pairs

**Tiling Pairs Observation:** Tiling extends naturally to pairs of consecutive rows or columns. If the pair's combined tiling capacity equals its combined needed stars, every tile must contribute exactly one star — the same tight condition as single-container tiling, applied across two lines at once.

**Tiling Pairs Forced:** If a cell is a star in every valid tiling of the pair, then it must be a star, so place a star.

**Tiling Pairs Adjacency:** If a cell never appears as a star in any valid tiling of the pair, then it can't be a star, so mark the cell.

**Tiling Pairs Overhang:** If a cell outside the pair is covered by a tile in every valid tiling of the pair, then that cell can't be a star, so mark the cell.

### Tiling Counting

**Tiling Counting Observation:** For a line (row or column), each touching region must place a minimum number of stars in that line — computed as `starsNeeded − capacity(cells outside the line)`. If the sum of these minimums equals the line's star quota, every region contributes exactly its minimum. "These regions must each send at least this many stars into the line. Together, that's all the line needs. No room for anyone else."

**Tiling Counting Marks:** If a region's minimum contribution to the line is zero, its cells in the line can't be stars, so mark them.

**Tiling Counting Forced:** If a tight constraint requires a region to place a specific number of stars outside the line, and the region has exactly that many unknown cells outside the line, then those cells must be stars, so place them.

**Grouped Tiling Counting Marks:** If a region's minimum contribution to a group of lines is zero, its cells in those lines can't be stars, so mark them. Grouped tiling counting fully subsumes single-line tiling counting — they are separated in the solver for execution simplicity and to match how humans apply the heuristic.

### Direct Hypotheticals

**Key Observation:** For each unknown cell, assume a star is placed there and mark its neighbors.

**Hypothetical Row Count:** If any nearby row (the star's row or its immediate neighbors) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Column Count:** If any nearby column (the star's column or its immediate neighbors) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Region Count:** If any affected region (the star's region or its neighbors' regions) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

### Tiling Hypotheticals

**Hypothetical Row Capacity:** If any nearby row's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

**Hypothetical Column Capacity:** If any nearby column's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

**Hypothetical Region Capacity:** If any nearby region's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

### Counting Hypotheticals

**Counting Hypothetical Observation:** After a hypothetical star is placed, its consequences are propagated through forced placements. The resulting board state is then checked against counting constraints.

**Hypothetical Counting Row:** If a hypothetical is placed, consequences propagated, and any group of rows now needs more stars than its touching regions can provide, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Counting Column:** If a hypothetical is placed, consequences propagated, and any group of columns now needs more stars than its touching regions can provide, then the assumption leads to a contradiction, so mark the cell.

### Propagated Hypotheticals

**Propagation Observation:** After a hypothetical star is placed and its neighbors marked, a container may now have exactly as many unknown cells as needed stars — triggering a Forced Placement. That forced star must also be placed and its neighbors marked, potentially cascading further. If any consequence in this chain breaks the puzzle, the original hypothesis was wrong.

**Propagated Row Count:** If a hypothetical placement cascades through forced placements and any row no longer has enough unknown cells to meet its needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Column Count:** If a hypothetical placement cascades through forced placements and any column no longer has enough unknown cells to meet its needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Region Count:** If a hypothetical placement cascades through forced placements and any region no longer has enough unknown cells to meet its needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Row Capacity:** If a hypothetical placement cascades through forced placements and any nearby row's remaining cells can no longer fit enough 2x2 tiles for the needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Column Capacity:** If a hypothetical placement cascades through forced placements and any nearby column's remaining cells can no longer fit enough 2x2 tiles for the needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Region Capacity:** If a hypothetical placement cascades through forced placements and any affected region's remaining cells can no longer fit enough 2x2 tiles for the needed stars, then the assumption leads to a contradiction, so mark the cell.

**Propagated Counting Row:** If a hypothetical placement cascades through forced placements and any group of rows now needs more stars than its touching regions can provide, then the assumption leads to a contradiction, so mark the cell.

**Propagated Counting Column:** If a hypothetical placement cascades through forced placements and any group of columns now needs more stars than its touching regions can provide, then the assumption leads to a contradiction, so mark the cell.
