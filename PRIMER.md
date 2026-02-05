# Star Battle Puzzle

**Star battle rules:**

1. Star neighbors: No star can neighbor another star
2. Star quota: Each row, region, and column must contain _x_ amount of stars

---

## Production Rules

Produciton rules are series of applied "Observations -> Techniques -> Deductions" that are cycled through until a puzzle is solved or determined to be unsolvable

**Observations:**

Ways of seeing the board

1. Direct - Raw/container state. Used by simplest production rules
2. Tiling - Derived from adjancency rules. Stars occupy 2x2 tiles across the board, deduced from star neighbors rule
3. Confinement - Derived from star quota. A region locked into a line (or line licked into regions) links quotas

**Techniques:**

How you apply observations to reach deductions. See "On Guessing" for more details.

1. Inferences - Direct constraint propogration, see the state, deduce immediately
2. Enumerations - List all valid arrangemenets, make deductions from universal placements and marks\
3. Hypotheticals - Assume a placement, check for a contradiction, mark if broken


**Deductions**

Actions derived from observations and techniques

1. Marks - this cell can't be a star
2. Placements - this cell must be a star

---

## Decisions

**On Guessing:**

Techniques exist on a spectrum of "how much guesswork are you doing". Ranked from Pure Logic to Brute Force. 

I chose to cut off the techniques at Bifurcation (hypotheticals) becuase it is "sinlge depth". One placement is allowed, cascading humans do this ituitively

1. Inferences: (direct, constraint propogration). No brute force at all, this is pure logic.
2. Enumeration: Systematically listing all possible configurations, and then drawing onslutions from commonalities between them.
3. Bifurcation (Hypotehticals): Single assumption, pick a cell, assume "placement" or "mark", and see if assumption leads to a broken puzzle If so, deduce accordingly
4. Backtracking. Make a choice, propograte consequences/more assumptions until you hit a contracdiction, undo that choice, then try the next assumption. Runs exponentially.


