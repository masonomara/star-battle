# Puzzle Generator

## Parts

1. Need an algorithm `layout()` that generates a randomized Star Battle style grid
   - Divides the grid into regions. A 5x5 grid means 5 regions, a 25x25 grid means 25 regions, and so on
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

1. Call `layout()` and produce a candidate layout
2. Attempt to solve it using `solve()`
3. Is it solved? GOOD—you have a valid puzzle and now you know where the stars go
4. Is it not solved? FAIL—go back to step 1

## Goal

- 98% of the candidates produced will not be valid puzzles
- That's ok if the algorithm is fast enough for this particular puzzle

## Tech Flow

1. **Durable Object** with **Alarm** triggers at scheduled times (daily at midnight, weekly on Monday, monthly on 1st)
2. **Alarm** handler invokes a **Worker** to run the puzzle generator algorithm
3. **Worker** then runs `layout()` and `solve()` in a loop until a valid puzzle is found
4. **Worker** then writes the solved puzzle definition to R2 with a key like `daily/2025-12-11.json`
5. **Worker** finally updates **KV** with puzzle metadata for fast CDN access
