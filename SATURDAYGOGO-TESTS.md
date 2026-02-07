Running `npx tsx src/sieve/cli.ts --file puzzles.sbn` with all rules enabled:

```bash
Processed 1000 puzzles in 717.65s
Solve rate: 979/1000 (98%)
```

Running `npx tsx src/sieve/cli.ts --file puzzles.sbn` with hypotheticals disabled:

```bash
Processed 1000 puzzles in 378.21s
Solve rate: 788/1000 (79%)
```


Running `npx tsx src/sieve/cli.ts --file puzzles.sbn` with enumerations disabled:

```bash
Processed 1000 puzzles in 32.42s
Solve rate: 608/1000 (61%)
```
