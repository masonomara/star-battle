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
