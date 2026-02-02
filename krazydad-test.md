# Krazydad Puzzle Testing

Testing solver against 1000 puzzles from Krazydad's 10x10 2-star collection.

## Process

1. **Converted raw data to SBF format** - Transformed `random_sample_10x10.txt` (CSV with regions as uppercase letters) into compact SBF format (`{size}x{stars}.{regions_base36}`)

2. **Ran solver on all 1000 puzzles** - Tracked rule usage statistics and solve rate

3. **Results**: 849/1000 solved (85%), 151 stuck

4. **Filtered unsolved puzzles** - Extracted the 151 puzzles that got stuck for further analysis

5. **Traced stuck puzzles** - Step-by-step solve attempts to identify where the solver gets blocked

## Data Formats

**Input** (`random_sample_10x10.txt`):

```
10,10,2,"AAAABBBBB...","0101000000..." # comment
```

**SBF** (`puzzles.sbf`):

```
10x2.0000111122...
```

## Commands

### Convert raw data to SBF format

```bash
./scripts/convert-to-sbf.sh random_sample_10x10.txt > puzzles.sbf
```

### Find first three unsolved puzzles

```bash
head -3 unsolved_clean.sbf | npx tsx src/sieve/cli.ts --sbf /dev/stdin --trace
```

### Run solver and get rule usage stats

```bash
npx tsx src/sieve/cli.ts --sbf puzzles.sbf
```

### Filter unsolved puzzles

```bash
npx tsx src/sieve/cli.ts --sbf puzzles.sbf --unsolved > unsolved.sbf 2>&1
cut -d' ' -f1 unsolved.sbf > unsolved_clean.sbf
```

### Trace puzzles

```bash
# Trace first 5 unsolved puzzles
head -5 unsolved_clean.sbf | npx tsx src/sieve/cli.ts --sbf /dev/stdin --trace

# Trace a specific puzzle (e.g., puzzle 3)
sed -n '3p' unsolved_clean.sbf | npx tsx src/sieve/cli.ts --sbf /dev/stdin --trace

# Trace all unsolved puzzles to a file
npx tsx src/sieve/cli.ts --sbf unsolved_clean.sbf --trace > trace_all.txt 2>&1
```

### Verbose mode (per-puzzle results)

```bash
npx tsx src/sieve/cli.ts --sbf puzzles.sbf --verbose
```

