# Star Battle Generator

Star Battle is an object placement puzzle - described as "binary sudoku".

## How to Use

[detail CLI commands]

## Key Files

- `/src`
  - `/sieve`
    - `generator` - creates reandom grid with regions
    - `cli` - CLI commands for the generator
    - `sieve` - wrapper for the generator and solver, seed generation, difficulty assignment
    - `solver` - Application of rules
  - `/helpers` - extracted fucntions used across rules
  - `rules` - collection of unit tests and functions fo reach rule

## How It Works

The sieve generates a deterministic seed, passed the seed to the generator. The generator creates a valid baord, then passes it to the sovler. the solver applies the production rules in order, solvable puzzles are passed abck to the sieve, a difficulty is assigned.

## Prodution Rules

The puzzles need to be human solvable. I created the rules based off Kris De Ana's Star Battle guide and my own experience. Essetnially, the human-solvable puzzle logic was reversed engineered, applied to rpoduction rules, and then the productin rules were applied in order to create a ranking and to follow how humans would solve (simple rules to more complciated rules)

No brute-force guessing, no backtracking

## Rules

**1. Star Neighbors** - All cells neighboring a star must be marked

**2. Trivial Rows** - When all stars in a row are palced, mark the remaining cells

**3. Trivial Columns** - When all stars in a column are palced, mark the remaining cells

**4. Trivial Regions** - When all stars in a region are palced, mark the remaining cells

**5. Forced Placement** - When the number of unknown cells in each row/column/region equals the number of stars needed to complete the row/column/region, place the stars in the unknown cells

**6. 2x2 Tiling** - Apply "Dancing Links" (`src/sieve/helpers/dlx.ts`). To discover Note: This rule has a backtrckign element to discover all psosible combinations of 2x2 tiles.

## Future Plans

React antive mobile app "Star Battle Free" - libraries of human-solvable puzzles and daily/weekly/monthly challenges

## TODOS

- Build a standardized star battle puzzle format for exporting to app
- Refine and test difficulty rankings
- Define app structure (how many puzzles, which categories, daily/weekly/monthly)
- React Native app specs
