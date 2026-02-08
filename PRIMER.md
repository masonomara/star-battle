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

Production rules are a series of applied "Observations -> Techniques -> Deductions" that are cycled through until a puzzle is solved or determined to be unsolvable.

A production system on top of a Constrain Satisfaction Problem

**Observations:**

Ways of seeing the board.

1. Direct - Raw/container state. Used by simplest production rules
2. Tiling - Derived from adjacency rules. Stars occupy 2x2 tiles across the board, deduced from star neighbors rule
3. Confinement - Derived from star quota. A region locked into a line (or line locked into regions) links quotas

**Techniques:**

How you apply observations to reach deductions. See "On Guessing" for more details.

1. Inferences - Direct constraint propagation, see the state, deduce immediately
2. Enumerations - List all valid arrangements, make deductions from universal placements and marks
3. Hypotheticals - Assume a placement, check for a contradiction, mark if broken

**Deductions:**

Actions derived from observations and techniques.

1. Marks - this cell can't be a star
2. Placements - this cell must be a star


### Direct Inferences

**Star Neighbors:** If a star is placed, then no star can touch it, so mark all of the star's surrounding neighbors diagonally, horizontally, and vertically.

**Trivial Marks:** If a row/column/region has all of the needed stars, then no more stars can be placed, so mark the remaining cells.

**Forced Placements:** If a row/column/region has the same number of unknown cells as needed stars, then those unknown cells must be the remaining stars, so place stars there.

### Confinement Inferences

_implementation splits into row/column variants_

**Overcounting (lines confined to regions):** If a group of _n_ rows/columns are completely covered by a group of _n_ regions, then all of those regions' stars must be within those covered rows/columns, so mark all cells in the regions outside the covered lines.

**Undercounting (regions confined to lines):** If a group of _n_ regions' unknown cells are all contained within the same group of _n_ rows/columns, then all of the rows/columns' stars must be placed within the constrained regions, so mark all cells in the rows/columns that are not in the confined regions.

**Consumed Line:** If a region needs _n_ stars and a particular row/column can give at most _m_ stars and _m_ < _n_, then the remaining (_n_ - _m_) must go to the region's cells outside that row/column. If the region's unknown cells outside the row/column equal the remaining stars, then place stars in all of the region's unknown cells outside the row/column.

**Consumed Region:** If a row/column needs _n_ stars and a particular region can give at most _m_ stars and _m_ < _n_, then the remaining (_n_ - _m_) stars must go to the row/column's cells outside that region. If the unknown cells outside the region equal the remaining stars, then place stars in all of the unknown cells.

### Tiling Enumeration

**Tiling Observation:** Given that stars cannot touch, you can fit all stars in a grid of 2x2 tiles. "Tiling" is a way of seeing the board split into 2x2 tiles, where you can make deductions based on overlap when you try to fit the tiles into a region or a pair of rows/columns. If a row/column/region's tiling capacity (max tiles placed) equals the needed stars, then every tile must contribute exactly one star.

**Tiling Forced:** If a cell is a star in every valid tiling of the row/column/region, then it must be a star, so place a star.

**Tiling Adjacent:** If a cell never appears as a star in a valid tiling assignment of a region, then it can't be a star, so mark the cell.

**Tiling Overhang:** If a cell outside a region is covered by a tile in every valid tiling assignment of the region, then that cell can't be a star, so mark the cell.

### Squeeze

**Key Observation:** Tiling applied to consecutive row/column pairs. If a pair of consecutive rows/columns has a tiling capacity equal to its combined needed stars, then each tile must contribute exactly one star.

**Squeeze Forced:** If a cell is a star in every valid tiling of the pair, then it must be a star, so place a star.

**Squeeze Adjacency:** If a cell never appears as a star in any valid tiling assignment across the consecutive pair, then it can't be a star, so mark that cell.

**Squeeze Overhang:** If a cell outside the pair of consecutive rows/columns is covered by a tile in every valid tiling of the pair, then that cell can't be a star, so mark the cell.

### Direct Hypotheticals

**Key Observation:** For each unknown cell, assume a star is placed there and mark its neighbors.

**Hypothetical Row Count:** If any nearby row (the star's row or its immediate neighbors) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Column Count:** If any nearby column (the star's column or its immediate neighbors) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

**Hypothetical Region Count:** If any affected region (the star's region or its neighbors' regions) no longer has enough unknown cells to meet its needed stars after a hypothetical placement, then the assumption leads to a contradiction, so mark the cell.

### Tiling Hypotheticals

**Hypothetical Row Capacity:** If any nearby row's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

**Hypothetical Column Capacity:** If any nearby column's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

**Hypothetical Region Capacity:** If any nearby region's remaining unknown cells can no longer fit enough 2x2 tiles for the needed stars after a hypothetical is placed, then the assumption leads to a contradiction, so mark that cell.

### Confinement Hypotheticals

**Hypothetical Undercounting Row:** If a hypothetical is placed and which regions are confined to which rows is recalculated and any group of confined regions needs more stars than its rows can provide, then the assumption leads to a contradiction, so place a mark.

**Hypothetical Undercounting Column:** If a hypothetical is placed and which regions are confined to which columns is recalculated and any group of confined regions needs more stars than its columns can provide, then the assumption leads to a contradiction, so place a mark.

**Hypothetical Overcounting Row:** If a hypothetical is placed and which rows are confined to which regions is recalculated and any group of confined rows needs more stars than its regions can provide, then the assumption leads to a contradiction, so place a mark.

**Hypothetical Overcounting Column:** If a hypothetical is placed and which columns are confined to which regions is recalculated and any group of confined columns needs more stars than its regions can provide, then the assumption leads to a contradiction, so place a mark.
