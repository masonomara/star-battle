# Krazydad Puzzle Testing

## Convert raw data to SBF format

```bash
./scripts/convert-to-sbf.sh random_sample_10x10.txt > puzzles.sbf
```

## Run solver and get rule usage stats

```bash
npx tsx src/sieve/cli.ts --sbf puzzles.sbf
```

## Filter unsolved puzzles

```bash
npx tsx src/sieve/cli.ts --sbf puzzles.sbf --unsolved > unsolved.sbf 2>&1
cut -d' ' -f1 unsolved.sbf > unsolved_clean.sbf
```

## Trace puzzles

```bash
# Trace first 5 unsolved puzzles
head -5 unsolved_clean.sbf | npx tsx src/sieve/cli.ts --sbf /dev/stdin --trace

# Trace a specific puzzle (e.g., puzzle 3)
sed -n '3p' unsolved_clean.sbf | npx tsx src/sieve/cli.ts --sbf /dev/stdin --trace

# Trace all unsolved puzzles to a file
npx tsx src/sieve/cli.ts --sbf unsolved_clean.sbf --trace > trace_all.txt 2>&1
```

## Verbose mode (per-puzzle results)

```bash
npx tsx src/sieve/cli.ts --sbf puzzles.sbf --verbose
```
