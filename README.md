# Star Battle Generator

<!-- TODO: replace with actual gif -->

![Solver in action](assets/solver-demo.gif)

A production rule system that generates human-solvable Star Battle puzzles using formalized deduction techniques — no brute-force guessing or backtracking. See [Production Rules](PRODUCTION_RULES.md) for the full system framework.

## Why Production Rules?

Generating a valid Star Battle layout is easy. Generating one that a human can solve through logic alone is hard. Each production rule in this system corresponds to a deduction a human can perform — the solver never guesses, so neither does the player.

## Architecture

- **Generator** — Produces randomized grids with region layouts and validates boards with tiling assignment.
- **Solver** — Applies production rules in logical order until a solution or invalid state is reached.
- **Production Rules** — Logical solving techniques a human can perform, derived from [Kris De Asis's Star Battle Guide](https://kris.pengy.ca/starbattle) and [KrazyDad's Two Not Touch Advanced Tutorial](https://krazydad.com/twonottouch/adv_tutorial/).
- **Sieve** — Coordinates generation and solving. Assigns difficulty ratings based on rule usage.

## Getting Started

```bash
git clone https://github.com/masonomara/star-battle.git
cd star-battle
npm install
```

### Generate Puzzles

```bash
npx tsx src/sieve/cli.ts                        # Default: 10x10, 2 stars
npx tsx src/sieve/cli.ts --size 8               # 8x8 grid
npx tsx src/sieve/cli.ts --stars 1              # 1 star per container
npx tsx src/sieve/cli.ts --count 5              # Generate 5 puzzles
npx tsx src/sieve/cli.ts --seed 42              # Reproducible output
npx tsx src/sieve/cli.ts --seed 42 --trace      # Step-by-step solve trace
```

### Solve a Custom Puzzle

Pass a puzzle string directly using the `.sbn` format — `{size}x{stars}.{layout}`:

```bash
# 10x10, 2 stars — layout is 100 region characters (A-J), read left-to-right top-to-bottom
npx tsx src/sieve/cli.ts --puzzle "10x2.AAAABBBBBCDDDDBEEBBCDDDDBECBCCDDBBBECCCCDDBBBEFCCCDDGGFFFGGCDDGGFGGGGCHGGGGGGGICHGGJJJJGIIHGIIIIIIII"

# With trace to see each rule fire
npx tsx src/sieve/cli.ts --puzzle "10x2.AAAABBBBBCDDDDBEEBBCDDDDBECBCCDDBBBECCCCDDBBBEFCCCDDGGFFFGGCDDGGFGGGGCHGGGGGGGICHGGJJJJGIIHGIIIIIIII" --trace
```

You can also solve a batch from a file (one puzzle string per line):

```bash
npx tsx src/sieve/cli.ts --file my-puzzles.sbn
npx tsx src/sieve/cli.ts --file my-puzzles.sbn --verbose
npx tsx src/sieve/cli.ts --file my-puzzles.sbn --unsolved   # Only show failures
```

### Filter by Difficulty

```bash
npx tsx src/sieve/cli.ts --minDiff 20              # Harder puzzles only
npx tsx src/sieve/cli.ts --maxDiff 10              # Easier puzzles only
npx tsx src/sieve/cli.ts --minDiff 15 --maxDiff 25 # Specific range
```

### Run Tests

```bash
npm test
```

### CLI Reference

- `--size` — Grid size (4–25, default: 10)
- `--stars` — Stars per container (1–6, default: 2)
- `--count` — Puzzles to generate (1–300, default: 1)
- `--seed` — Deterministic seed (random by default)
- `--minDiff` — Minimum difficulty
- `--maxDiff` — Maximum difficulty
- `--puzzle` — Solve a single puzzle string
- `--file` — Solve puzzles from a `.sbn` file
- `--verbose` — Show details per puzzle
- `--unsolved` — Only output unsolved puzzles
- `--trace` — Step-by-step solve trace
- `--help` — Show options

## Production Rules Overview

Rules combine an **Observation** (how you see the board) with a **Technique** (how you reason) to produce a **Deduction** (mark or placement). The solver cycles through rules in order, restarting from the top whenever a rule fires.

1. **Star Neighbors** — Direct × Inference
2. **Forced Placements** — Direct × Inference
3. **Trivial Marks** — Direct × Inference
4. **Tiling Enumeration** — Tiling × Enumeration
5. **Counting Enumerations** — Counting × Enumeration
6. **Tiling Pairs** — Tiling × Enumeration
7. **Tiling Counting** — Tiling + Counting × Enumeration
8. **Direct Hypotheticals** — Direct × Hypothetical
9. **Tiling Hypotheticals** — Tiling × Hypothetical
10. **Counting Hypotheticals** — Counting × Hypothetical
11. **Propagated Hypotheticals** — Direct + Tiling + Counting × Hypothetical

See [Production Rules](PRODUCTION_RULES.md) for full definitions of each rule.

## Results

<!-- TODO: replace with actual screenshot -->

![Benchmark results](assets/results.png)
