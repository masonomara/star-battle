# The Puzzle Sieve

## Overview

Puzzle sieve is what im callign the puzzle generator. The puzzle genreator 1) generates a board and then 2) solves it using these production rules.

We also need a file that handles functions for saving, loading, and listing puzzles. These should be stored right in d1 storage.

```
  src/sieve/
    rules.ts
    solver.ts
    generator.ts
    db.ts
```

Also need rule unit tests: each rule returns correct eliminations/placements for sample baord states. For debugging in isolation

Based on this StackExchange [comment](https://math.stackexchange.com/questions/4561407/creation-computation-of-two-not-touch-puzzles)

## Parts

1. Need an algorithm `layout()` that generates a randomized Star Battle style grid
   - Divides the grid into shapes. A 5x5 grid means 5 shapes, a 25x25 grid means 25 shapes, and so on
   - This algorithm would not know anything about where the stars should go
   - The resulting layout MAY or MAY NOT be a valid puzzle
2. Need an algorithm `solve()` that uses production rules to solve star battle puzzles
   - The production rules are the same kind of pattern-based rules a human might use to solve the puzzles, such as "if there is a star, the squares around it can be eliminated" or "if a container contains X stars, the remaining squares in the container can be eliminated" or "if a container has only enough open squares remaining to make X stars, those squares must be stars"
   - Determine the rules from solving the puzzles manually and observing patterns
   - The `solve()` algorithm is basically a repeated loop:
     - For each rule, check if the pattern is matched. If so, clear or set one or more squares as dictated by the rule and start the loop over
     - If, after following a rule, the puzzle is now fully solved, we are done
     - If the puzzle is still unsolved, and all the rules are examined with no hits, the puzzle is unsolvable or has multiple solutions
     - The algorithm can only find a solution when the puzzle has a single unique solution
   - NOTE: Production-rule solvers are better for estimating difficulty, but general purpose stack-based brute force attack solver can also work

## Steps

1. Generator calls `layout()` and produces a candidate layout
2. Solver attempts to solve it using `solve()`
3. Is it solved? GOOD — you have a valid puzzle and now you know where the stars go
4. Is it not solved? FAIL — go back to step 1

## Difficulty Measurement

The solver applies rules in cycles, ordered by complexity. Difficulty is measured by:

- Depth: How many deduction cycles needed
- Rule complexity: If needed advanced rules to solve, score higher

## Elements

- Position: position on the baord (e.g. row 1, column 4)
- Cell: a cell on the board - holds state, has region ID and positon
- Cell State - either "unknown", "star", or "marked"
- Region - a shape on the board, has ID and a list of positions
- Board - collection of cells and regions with set size and stars. determinsitclaly generatd by seed
- Puzzle - a bard that has a solution, the output of the puzzle sieve. Holds the board's seed #,

## Requirements

ultimatley, I woudl like to be able to enter a command like "npm sieve stars=6 grid=25 count=100"

The generator would use 'layout()' to produce a 25x25 board with regions

the solver woudl apply production

the output would be 100 puzzles of 26x26 boards that are solvable with 6 stars following the production rules, each baord has a seed and difficulty

- number of stars - "1 star" means 1 star per row, region, and column, "6 stars" means 6 stars per row, region, or column
- grid size - "26x26"
- count - how many puzles to generate
- seed - for reproducability
