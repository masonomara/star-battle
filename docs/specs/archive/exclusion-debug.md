When we run the following command, we get stuck at cycle 90:

cli command:

```bash
echo "A A A A A B B B B B B B B B B B B C C C C C C C D
A A E A A A E B E B E B F F F F F C C C C C D D D
 A E E E E A E E E E E B F F F F F F C C C C C C D
 A A A A E A E E E E E E F F F F F F C C C C C C D
 E E E E E E E E E E E E F F F F F C C C C C D D D
 E G E G G G E H E E E F F F F F F F C C I D D I D
 E G E E G H H H E E E J F J F F F I I I I I I I D
 E G E G G G H E E E K J J J J J F I I I I I I I D
 E G G G H H H K K K K J L J L J J J M M I I I D D
 E N G N H H K K K K K K L L L M M M M M O O I I I
 E N G N H K K K K K K K L L M M M M M O O I I I I
 N N N N H K K K K K K L L L M M M M M M O I I I I
 P P N H H K K K K K L L L L L M M M M M O O O O Q
 P P N H H K H K K K L L L L L M M M M M O Q Q Q Q
 P P N N H H H K K K L L L L R M M M O O O Q Q Q Q
 P P P N P H S T K K L L L L R M M M O Q Q Q Q Q Q
 P P P P P P S T T T L T L R R R M U O Q Q V Q Q V
 P P P P P P S S S T L T T T R U U U U Q Q V V V V
 P P P P S P S S T T T T T R R R R U U Q V V V V V
 P P P P S S S S S T T T R R W R U U U Q Q V V V V
 X X X P P P S S Y T Y T R R W R R U U U U U V V V
 X X X P S S S S Y T Y W W W W U R R U U U U V V V
 X X P P X X S S Y Y Y Y W Y W U U R U U U U V V V
 X X X X X X S S S S Y W W Y W U U U U U U U V V V
 X X X X X X X X Y Y Y Y Y Y W W W U U U U U U U U" | npx tsx src/sieve/cli.ts --stars 6
```

CLI output:
```bash
--- Cycle 90: squeeze (level 5) ---
X X X X X X X . X . . X ★ X ★ X ★ X ★ X . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X X . . . X .
X X X X X X X . X . X ★ X ★ X ★ X ★ X . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . . .
X X X X X X X . X . X ★ X ★ X . . . . . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . . .
X X X X X X X . X . X ★ X ★ X . . . . . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . . .
X X X X X X X . X . X ★ X ★ X ★ X ★ X . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . . .
X X X X X X X X . X . . . . . . . . . . . . . . .
★ X ★ X ★ X ★ X . X X X X X X X X X X . . . . . .
X X X X X X X X . X ★ X ★ X ★ X . . . . . . . . .
★ X ★ X ★ X ★ X . X X X X X X X X . . . . . . . .
X X X X X X X X X . . . . . . . . . . . . . . . .
X ★ X ★ X ★ X ★ X X X X X X X X X . . . . . . . .
X X X X X X X X X ★ X ★ X ★ X . . . . . . . . . .
★ X ★ X ★ X ★ X X X X X X X X X X . . . . . . . .
X X X X X X X X ★ X ★ X ★ X . . . . . . . . . . .
X X ★ X ★ X ★ X X X X X X X . X . . . . . . . . .
★ X X X X X X X ★ X ★ X X X . X . . . . . . . . .
X X ★ X ★ X ★ X X X X X ★ X . X . . . . . . . . .
★ X X X X X X X ★ X ★ X X X . X . . . . . . . . .
X X . X . X ★ X X X X X ★ X . X X X . . . . . . .
★ X . X . X X X ★ X ★ X X X . X ★ X . . . . . . .
```


Two cells that I believe should be marked are column 15, row 15 in region U (top left, surrounded by region R's) and column 25, row 4 (bottom right region C, bordered by region D on the right and the bottom). Coordinates are 0-indexed.

If a star were placed on column 15, row 15, then the star's neighbors would make it impossible to place 6 stars in region R.

If you place a star on column 25, row 4, region D would be unable to be completed. Is this crazy? How do we improve the exclusion rule so it catches this should-be mark?

The tests are passing. I'm concerned there must be some sort of pre-filter that blocks the exclusion function from searching in the smelly areas I mentioned earlier.

## Update

Now when we run the puzzle bash command, we get stuck at cycle 44:

```bash
--- Cycle 44: squeeze (level 5) ---
X X X X X X X . X . . . . . . . . . . . . . . X .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . X .
X X X X X X X . X . X ★ X ★ X . . . . . . . . X .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . X .
X X X X X X X . X . . . . . . . . . . . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . X .
X X X X X X X . X . X ★ X ★ X . . . . . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . X .
X X X X X X X . X . X ★ X ★ X ★ X ★ X . . . . . .
X ★ X ★ X ★ X . X . X X X X X X X X X . . . . . .
X X X X X X X X . X . . . . . . . . . . . . . . .
★ X ★ X ★ X ★ X . X X X X X X X X X X . . . . . .
X X X X X X X X . X ★ X ★ X ★ X . . . . . . . . .
★ X ★ X ★ X ★ X . X X X X X X X X . . X . X . . .
X X X X X X X X X . . . . . . . . . . . . . . . .
X ★ X ★ X ★ X ★ X X X X X X X X X X . X . . . . .
X X X X X X X X X ★ X ★ X ★ X . . . . . . . . . .
★ X ★ X ★ X ★ X X X X X X X X X X . . . . . . . .
X X X X X X X X ★ X ★ X ★ X . . . . . . . . . . .
X X ★ X ★ X ★ X X X X X X X . X X X . . . . . . .
★ X X X X X X X ★ X ★ X X X . X ★ X . . . . . . .
X X ★ X ★ X ★ X X X X X ★ X . X X X . . . . . . .
★ X X X X X X X ★ X ★ X X X . X . . . . . . . . .
X X . X . X ★ X X X X X ★ X . X X X . . . . . . .
★ X . X . X X X ★ X ★ X X X . X ★ X . . . . . . .
```


It seems the changes to the 2x2 tiling interrupted what the squeeze can do, if i understand correctly, row 3 column 3 cell shoudl be marked. im not sure the squeeze funciton is designed properly.