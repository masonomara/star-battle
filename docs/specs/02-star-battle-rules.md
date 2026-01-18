# Solving Star Battle Documentation

## Elements

Core Elements:

- Position: position on the baord (e.g. row 1, column 4)
- Cell: a cell on the board - holds state, has region ID and positon
- Cell State - either "unknown", "star", or "marked"
- Region - a shape on the board, has ID and a list of positions
- Board - collection of cells and regions with set size and stars

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

## Testing

Rule unit tests: each rule returns correct eliminations/placements for sample baord states. For debugging in isolation

## Requirements

ultimatley, I woudl like to be able to enter a command like "npm sieve stars=6 grid=25 count=100"

the output would be 100 puzzles of 26x26 boards that are solvable with 6 stars following the production rules, each baord has a seed and difficulty

- number of stars - "1 star" means 1 star per row, region, and column, "6 stars" means 6 stars per row, region, or column
- grid size - "26x26"
- count - how many puzles to generate
- seed - for reproducability

ultimatley, I woudl like to be able to enter a command like "npm generate stars=6 grid=26 count=100"
