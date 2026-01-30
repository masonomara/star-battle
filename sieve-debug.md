I ran `npm run sieve` and msot of the puzzles were good, but it also gave me two puzzles that were unsolvable and said that they were accepted:


here are teh two, if you runt hem throught he solver, you cans ee int eh final result the solved puzzles find a "solution" that violates the star battle contraisnts of two stars cannot touch:

GRID 1:

echo "3 3 3 2 2 2 1 1 1 1
3 3 3 2 2 2 2 1 1 1
3 3 3 2 0 0 0 0 1 1
3 3 3 3 0 0 0 0 0 1
3 3 3 4 4 4 4 4 4 1
9 9 8 8 6 6 6 6 4 1
9 9 8 8 6 6 6 6 6 1
7 9 8 8 6 6 6 6 5 5
7 8 8 8 8 8 8 8 5 5
7 7 8 8 8 8 8 8 5 5" \
| npx tsx src/sieve/cli.ts --stars 2


and GRID 2:

echo "3 3 3 2 2 2 1 1 1 1
3 3 3 2 2 2 2 1 1 1
3 3 3 2 0 0 0 0 1 1
3 3 3 3 0 0 0 0 0 1
3 3 3 4 4 4 4 4 4 1
9 9 8 8 6 6 6 6 4 1
9 9 8 8 6 6 6 6 6 1
7 9 8 8 6 6 6 6 5 5
7 8 8 8 8 8 8 8 5 5
7 7 8 8 8 8 8 8 5 5" \
| npx tsx src/sieve/cli.ts --stars 2


in GRID 1, the error si made during --- Cycle 24: Forced Placement (level 1) ---
. . X X X X ★ . . .
. . X X ★ X X X X .
X X X X X X . . . .
★ X X X ★ X X X X X
X X ★ X X X ★ X X X
. X X X X X X X . .
. X ★ X X . . . . .
. X X X X . . . . .
. . X ★ X X X . . .
. . X ★ X . . . . .

in GRID 2, the errors imade during --- Cycle 3: Forced Placement (level 1) ---
X X . . . . . . . .
X X . . . . . . . .
X X . . . . . . . .
X X . . . . . . . .
X X . . . . . . . .
★ ★ . . . . . . X X
X X . . . . . . X X
★ X . . . . . . . .
. X . . . . . . . .
. ★ . . . . . . . .
