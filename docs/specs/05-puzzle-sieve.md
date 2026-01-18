# Puzzle sieve

Jan 18th, 2026

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

- Rule unit tests: each rule returns correct eliminations/placements for sample baord states. For debugging in isolation
