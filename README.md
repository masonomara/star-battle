# Star Battle Generator

Star Battle puzzle generator using inference rules that emulate human deduction to produce solvable puzzles without brute-force guessing or backtracking.

### Why Inference Rules?

Generating a puzzle with a valid layout and satisfies Star Battle Rules is easy. However, a valid layout may not be solvable by human deduction without guessing. This game is meant to be played by humans. Each rule is logical and able to be computed by a human.

### Star Battle Constraints

- Each row, column, and region must contain exactly _n_ stars
- Stars cannot touch horizontally, vertically, or diagonally

### Key Components

- **Generator** – produces a randomized grid divided into _n_ regions, validates star placement via 2×2 tiling
- **Solver** – executes inference rules from simple to complex
- **Inference Rules** – logical solving techniques a human can perform, based on [Kris De Asis's Star Battle Guide](https://kris.pengy.ca/starbattle)
- **Sieve** – orchestrates generation and solving, assigns difficulty ratings

## Project Structure

```
src/sieve/
├── cli.ts          # CLI interface
├── sieve.ts        # Sieve orchestrator
├── generator.ts    # Board generator
├── solver.ts       # Rule-based solver
├── helpers/        # Shared utilities (tiling, regions, types)
└── rules/          # One folder per rule with implementation + tests
    ├── 01-starNeighbors/
    ├── 02-rowComplete/
    └── ...         # 14 rules total
```

## Get Started

```bash
git clone https://github.com/masonomara/star-battle.git
cd star-battle
npm install
```

### Generate Puzzles

```bash
npm run sieve                    # Default: 10×10 grid, 2 stars
npm run sieve -- --size 8        # 8×8 grid
npm run sieve -- --stars 1       # 1 star per row/column/region
npm run sieve -- --count 5       # Generate 5 puzzles
npm run sieve -- --seed 42       # Reproducible output
```

### Filter by Difficulty

```bash
npm run sieve -- --minDiff 20              # Only harder puzzles
npm run sieve -- --maxDiff 10              # Only easier puzzles
npm run sieve -- --minDiff 15 --maxDiff 25 # Specific range
```

### Trace Solve Steps

```bash
# Requires `--seed`
npm run sieve -- --seed 42 --trace
```

### Solve Custom Puzzles

```bash
# Each number is a region
echo "0 0 1 1
0 0 1 1
2 2 3 3
2 2 3 3" | npm run sieve -- --stars 1
```

### Run Tests

```bash
npm test
```

### CLI Reference

- `--size` – Grid size. Default 10. Accepts 4–25
- `--stars` – Stars per row/column/region. Default 2. Accepts 1–6
- `--count` – Puzzles to generate. Default 1. Accepts 1–300
- `--seed` – Deterministic seed. Random by default
- `--minDiff` – Minimum difficulty
- `--maxDiff` – Maximum difficulty
- `--trace` – Show solve steps (requires `--seed`)
- `--help` – Show options

## Inference Rules

### Level 1: Trivial Marks

1. **Star Neighbors** – When a star is placed, mark all unknown neighbors as eliminated.

2. **Row Complete** – When a row has all its stars, mark the remaining unknown cells

3. **Column Complete** – When a column has all its stars, mark the remaining unknown cells

4. **Region Complete** – When a column has all its stars, mark the remaining unknown cells

5. **Forced Placement** – When the number of unknown cells in each row/column/region equals the number of stars needed to complete the row/column/region, place the stars in the unknown cells

### Level 2: Counting

6. **Undercounting** – When _n_ regions are completely contained within _n_ rows/columns, mark all cells within those rows/columns that are not in the contained regions.

7. **Overcounting** – When _n_ regions completely contain _n_ rows/columns, mark all cells within those contained regions that are outside the set rows/columns.

### Level 3: Tiling

8. **2×2 Tiling** – Apply "Dancing Links" `src/sieve/helpers/dlx.ts` to tile regions with 2×2 tiles. Each 2×2 must have exactly one star. Stars and marks that are single-coverage in all tiling combinations are forced.

### Level 4: Confinement

9. **1×n Confinement** – When a region's unknown cells are confined to a single row/column, its stars must go there. If the confined regions account for all stars a row/column needs, mark cells outside those regions.

10. **Exclusion** – Mark cells where placing a star would make a row/column/region unable to fit its required stars. Single-depth search, deduced with **2×2 Tiling**.

### Level 5: Pressure

11. **Pressured Exclusion** – Like **Exclusion**, but considers **1×n Confinements** that span multiple regions. Mark cells where placing a star would make a region/row/column unable to fit all required stars. Single-depth search, deduced with **2×2 Tiling** and **1×n Confinement**.

12. **Finned Counts** – Check for **Exclusion** scenarios when placing a star would violate an undercounting or overcounting scenario. Mark cells where **Exclusion** occurs.

13. **The Squeeze** – Create side-by-side column/row pairs and run 2x2 tiling. Apply stars when **Forced Placements** occur, mark cells where **Exclusion** occurs.

### Level 6: Composite Regions

14. **Composite Regions** – Combine regions with known star counts into composite regions. If _n_ regions are contained by _m_ rows/columns (_m_ > _n_) and the leftover area has (_m_ - _n_) × _stars_, apply tiling logic to composites for **Forced Placement** and **Exclusion**.

## Future Plans

React Native mobile app with puzzle libraries and daily/weekly/monthly challenges.


Wht was the big problem: 

I attatcked the production rules as "simulations of what the human mind does" when they shoudl really be "programs that validate and replicate human intuition"

