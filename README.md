# Star Battle Generator

Star Battle puzzle generator that uses production rules that emulate logical human behavior to produce solvable puzzles without brute-force guessing or backtracking.

### Why Production Rules?

It is easy to generate a puzzle that has a "valid layout" and satisfies the **Star Battle Rules**. However, a valid layout may not be solvable by human deduction without guessing. This game is meant to be played by humans. Each rule is logical and able to be computed by a human.

### Star Battle Objectives

- Each row, column, and region must contain exactly the specified number of stars
- No two stars can touch horizontally, vertically, or diagonally

### Key Parts

- **Generator** - produces a randomized grid divided into _n_ regions. Validates that each region can fit required stars via 2x2 tiling.
- **Solver** - executes production rules in an ordered loop from simple to complex production rules
- **Production Rules** - set of rules and unit tests for different solving techniques able to be done by a human. Based off of Kris De Ana's [Star Battle Guide](https://kris.pengy.ca/starbattle).
- **Sieve** - the generator wrapper. Orchestrates the generator and solver, and assigns difficulty.

## Project Structure

```
src/sieve/
├── cli.ts          # CLI interface
├── sieve.ts        # Sieve
├── generator.ts    # Generator
├── solver.ts       # Solver
├── helpers/        # Shared utilities (tiling, regions, types)
└── rules/          # One folder per rule with implementation + tests
    ├── 01-trivialNeighbors/
    ├── 02-trivialRows/
    └── ... (14 rules total)
```

## Get Started

[TODO: add actual commands, make dummy proof]

### CLI Commands

```bash
# Generate puzzles
npm run sieve                           # 10x10, 2 stars, 1 puzzle
npm run sieve -- --size 8 --stars 1     # 8x8, 1 star
npm run sieve -- --count 10             # Generate 10 puzzles
npm run sieve -- --seed 12345           # Deterministic generation

todo: add full cli commands, how to use them, dummy proof

# Trace solve steps (requires --seed)
npm run sieve -- --seed 12345 --trace

# Solve custom puzzle (each number is region)
echo "0 0 1 1
0 0 1 1
2 2 3 3
2 2 3 3" | npm run sieve -- --stars 1

# Run tests
npm run test
```

## Production Rules

### Level 1: Trivial Marks

1. **Star Neighbors** - All cells neighboring a star must be marked

2. **Row Complete** - When all stars in a row are placed, mark the remaining cells

3. **Column Complete** - When all stars in a column are placed, mark the remaining cells

4. **Region Complete** - When all stars in a region are placed, mark the remaining cells

5. **Forced Placement** - When the number of unknown cells in each row/column/region equals the number of stars needed to complete the row/column/region, place the stars in the unknown cells

### Level 2: Counting

6. **Undercounting** - When _n_ regions are completely contained within _n_ rows/columns, mark all cells within those rows/columns that are not in the contained regions.

7. **Overcounting** - When _n_ regions completely contain _n_ rows/columns, mark all cells within those contained regions that are outside the set rows/columns.

### Level 3: Tiling

8. **2x2 Tiling** - Apply "Dancing Links" `src/sieve/helpers/dlx.ts` to tile regions with 2x2 tiles. Each 2x2 must have exactly one star. Stars and marks that are single-coverage in all tiling combinations are forced.

### Level 4: Confinement

9. **1xn Confinement** - When a single row/column in a region contains all of the region's unknown stars, those rows/columns need to be counted in the larger puzzle's row/column.
10. **Exclusion** - Mark cells where placing a star would make a region unable to fit all required stars. Single-depth search, deduced with **2x2 tiling**.

### Level 5: Pressure

11. **Pressured Exclusion** - Like **exclusion**, but considers 1xn **confinements** that span multiple regions. Mark cells where placing a star would make a region/row/column unable to fit all required stars. Single-depth search, deduced with **2x2 tiling** and **1xn Confinement**.

12. **The Squeeze** - Create side-by-side column/row pairs and run 2x2 tiling. Apply stars when **Forced Placements** occur, mark cells where **Exclusion** occurs.

### Level 6: Finned Counts

13. **Finned Counts** - Check for **Exclusion** scenarios when placing a star would violate an undercounting or overcounting scenario. Mark cells where **Exclusion** occurs.

### Level 7: Composite Regions

14. **Composite Regions** - Combine regions with known star counts into composite regions. If _n_ regions are contained by _m_ rows/columns (_m_ > _n_) and the leftover area has (_m_ - _n_) × _stars_, apply tiling logic to composites.

## Future Plans

React Native mobile app with puzzle libraries and daily/weekly/monthly challenges.
