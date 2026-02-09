# Star Battle Puzzle

## Star Battle Rules

1. **Star Neighbors:** No star can neighbor another star (horizontally, vertically, or diagonally)
2. **Star Quotas:** Each row, column, and region must contain exactly N stars
3. 
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

Production rules are a series of applied "Observations -> Techniques -> Deductions" that are cycled through until a puzzle is solved or determined to be unsolvable. The solver acts as a production system on top of a constrain satisfaction problem.

**Observations - ways of seeing the board:**

1. Direct - Raw cell and container state (which cells are unknown, how many stars a container still needs).
2. Tiling - Derived from Star Neighbors rule. Given no two stars can be adjacent, every star can be contained within a 2x2 tile. Non-overlapping tiles placed on a container reveal the upper bound on it's stars.
3. Counting - Derived from Star Quota rule. Given that each container (row/column/region) has a set needed amount fo stars, overlap between containers create forced deductions.

**Techniques - how you apply observations:**

1. Inferences - Direct constraint propagation. See the state, deduce immediately. No search.
2. Enumerations - List all valid arrangements. What's a star in every arrangment must be a star. What's a mark in every configuration must be a mark.
3. Hypotheticals - Assume a star placement, propagate deterministic consequences. If there is a contradiction, the assumption should be marked.

**Deductions - actions taken:**

1. Marks - this cell can't be a star
2. Placements - this cell must be a star

### Direct Inferences

**Star Neighbors:** If a star is placed, then no star can touch it, so mark all of the star's surrounding neighbors diagonally, horizontally, and vertically.

**Trivial Marks:** If a container has all its needed stars, then no more stars can be placed, so mark the remaining cells.

**Forced Placements:** If a container has the same number of unknown cells as needed stars, then those unknown cells must be the remaining stars, so place stars there.

### Tiling Enumeration

**Tiling Observation:** Given that no star can neighbor another star and two cells within a 2x2 tile would be neighbors, then each 2x2 tile can only hold one star. As a result, the maximum number of non-overlapping 2x2 tiles that fit in a container's unknown cells is the container's tilign capacity - the upper bound on the amount of stars that can be placed in that container. When a container's tiling capacity equals its needed stars, every tile must contribute exactly one star. Enumeration produces all valid tiling assignments.

**Tiling Forced:** If a cell is a star in every valid tiling assignment of the container, then it must be a star, so place a star.

**Tiling Adjacent:** If a cell is never a star in every valid tiling assignment of region, then it can't be a star, so mark the cell.

**Tiling Overhang:** If a cell outside of a region is covered by a tile in every valid tiling assignment of the region, then that cell can't be a star, so mark the cell.

### Counting Enumerations

_AI-generated language_

_implementation splits into row/column variants_

**Counting Observation:** For any group of rows (or columns), each region within the group of rows/columnscan contribute at most min(its stars needed, its unknowns inside the group). If the sum of these max contributions exactly equals the group's combined star need, the constraint is tight — every region must contribute its max. "These lines need exactly this many stars. These regions can provide exactly this many. No slack."

**Counting Observation** Given that for any group of rows/columns, each region within teh group of rows/columns can contribute at most its stars needed and unknowns inside the group

**Counting Marks:** If a region must contribute all its remaining stars inside the group (max contribution equals its stars needed), then its cells outside the group can't be stars, so mark them.

**Counting Forced:** If a region has exactly as many unknowns inside the group as it must contribute, those cells must all be stars, so place them.

### Squeeze

**Key Observation:** Tiling applied to consecutive row/column pairs. If a pair of consecutive rows/columns has a tiling capacity equal to its combined needed stars, then each tile must contribute exactly one star.

**Squeeze Forced:** If a cell is a star in every valid tiling of the pair, then it must be a star, so place a star.

**Squeeze Adjacency:** If a cell never appears as a star in any valid tiling assignment across the consecutive pair, then it can't be a star, so mark that cell.

**Squeeze Overhang:** If a cell outside the pair of consecutive rows/columns is covered by a tile in every valid tiling of the pair, then that cell can't be a star, so mark the cell.

### Tiling Counting

**Tiling Counting Observation:** For a line (row or column), each touching region must place a minimum number of stars in that line — computed as `starsNeeded − capacity(cells outside the line)`. If the sum of these minimums equals the line's star quota, every region contributes exactly its minimum. "These regions must each send at least this many stars into the line. Together, that's all the line needs. No room for anyone else."

**Tiling Counting Marks:** If a region's minimum contribution to the line is zero, its cells in the line can't be stars, so mark them.

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

_AI-generated language_

**Hypothetical Counting Row:** If a hypothetical is placed and all row group counting constraints are enumerated and any group of rows now needs more stars than its touching regions can provide, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Counting Column:** If a hypothetical is placed and all column group counting constraints are enumerated and any group of columns now needs more stars than its touching regions can provide, then the assumption leads to a contradiction, so mark the cell.

### Forced-Star Hypotheticals

_AI-generated language_

**Key Observation:** After a hypothetical star is placed and its neighbors marked, a row, column, or region may now have exactly as many unknown cells as needed stars — a Forced Placement. That forced star must also be placed, and its neighbors marked. If the forced star's consequences break the puzzle, the original hypothesis was wrong.

**Hypothetical Forced Row Count:** If a hypothetical is placed, that forces another star via Forced Placement, and any nearby row no longer has enough unknown cells to meet its needed stars after marking the forced star's neighbors, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Forced Column Count:** If a hypothetical is placed, that forces another star via Forced Placement, and any nearby column no longer has enough unknown cells to meet its needed stars after marking the forced star's neighbors, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Forced Region Count:** If a hypothetical is placed, that forces another star via Forced Placement, and any affected region no longer has enough unknown cells to meet its needed stars after marking the forced star's neighbors, then the assumption leads to a contradiction, so mark the cell.
