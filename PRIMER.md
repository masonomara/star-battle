# Star Battle Puzzle

**Star battle rules:**

1. Star neighbors: No star can neighbor another star

---

## Production Rules

Production rules are a series of applied "Observations -> Techniques -> Deductions" that are cycled through until a puzzle is solved or determined to be unsolvable.

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

---

## Decisions

**On Guessing:**

Techniques exist on a spectrum of "how much guesswork are you doing", ranked from "Pure Logic" to "Brute Force".

I chose to cut off at Bifurcation (hypotheticals) because it is "single depth". One assumption, immediately cascading consequences — humans do this intuitively.

1. Inferences: Direct constraint propagation. No brute force, pure logic.
2. Enumeration: Systematically list all possible configurations, then draw conclusions from commonalities between them.
3. Bifurcation (Hypotheticals): Single assumption — pick a cell, assume "placement" or "mark", and see if it leads to a broken puzzle. If so, deduce accordingly.
4. Backtracking: Make a choice, propagate consequences/more assumptions until you hit a contradiction, undo that choice, then try the next assumption. Runs exponentially.

**On Organizing**

Humans Dont think like how I described above. Humans think like humans. The tools above were extremely useful for "making sure all my gaps were covered" but not very useful for teaching information. Now that I KNEW gaps were covered, I was able to teaach, watch how people learned the game, talked through different ways of teaching. Heres how i recorded the results:


## Rules

**Direct Inferences**

Star Neighbors: if a star is placed, then no star can touch it, so mark all of the stars surrounding neighbors diagonally, horizontally, and verticallay
Trivial Marks: if a row/column/region has all of hte needed stars, then no more stars can be placed, so mark the remaining cells
Forced Placements: if a row/column/region has the same amount of unknown cells as they do needed stars, then those unknown cells have to be the raimaing stars, so palce stars there

**Confnement Inferecnes**

Overcounting: (lines confined to regions): if a group of _n_ row/columns are completely covered  by a group of _n_ regions, then all of those region's stars must be within those covered rows/columns, so mark all cells in the regions outside the covered lines.

Undercounting (regions confined to lines): If a group of _n_ regions' unknown cells all are contained within the same group of _n_ rows/columns, then all of the rows/columns stars must be placed within the constrained regions, so mark all the cells in the rows/columns that are not in the confined regions.

Consumed Line: if a region needs _n_ stars and a particular row/column can give at most _m_ stars and _m_ < _n_, then the reamaing (_n_ - _m_) must go to the region's cells outside that row/column. if the region's unknwon cells outside the row/column equals the remianign stars, then place stars in all of the region's unknown cells outside the row/column

Consumed Region: If a row/column needs _n_ stars, and a particular region can give at most _m_ stars and _m_ < _n_, then the remainign stars (_n_ - _m_) must go to the row/column's cells outside of that region. if the unknown cells outside the region equal the remainign stars, then place all stars in the unknown cells.

**Tiling Enumeration**

Key Observation: Given that stars cannot touch, you can fit all stars in a grid of 2 cell by 2 cell tiles . "Tiling" is a way of seeing the board split into 2x2 tiles, where you can make deductiosn based on overlap when you try to "fit" the tiles into a region or a pair of rows/columns


Tiling Forced: If all combinations of tiles show that a star should be placed here, then a star belongs there for a solve, so place a star

Tiling Adjacent: If all cominations of tiles show that a mark would displace the monumim amount of 2x2 tiles in a the stars region region to below the stars needed, then a star palcement there woudl break the needed stars be valid so palce a mark

Tiling Overhang: If all cominations of tiles show that a mark would displace the monumim amount of 2x2 tiles in a the stars neighboring region to below the stars needed, then a star palcement there woudl break the needed stars be valid so palce a mark