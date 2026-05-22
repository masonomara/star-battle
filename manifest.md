# Pack Manifest

## Step 1 — Generate missing puzzles

Run these to fill the gaps. They resume automatically if interrupted (`.state` files track progress):

```sh
# 14x14-hard needs 21 more puzzles (currently have 99, need 120 total)
npx tsx src/cli.ts --size 14 --stars 3 --count 21 --output puzzles-14x3.sbn

# daily needs 210 more 17×4 puzzles (have 155, need 365)
npx tsx src/cli.ts --size 17 --stars 4 --count 210 --output puzzles-17x4.sbn --inverse

# weekly needs 43 more 21×5 puzzles (have 9, need 52)
npx tsx src/cli.ts --size 21 --stars 5 --count 43 --output puzzles-21x5.sbn --inverse

# monthly needs 6 more 25×6 puzzles (have 6, need 12)
npx tsx src/cli.ts --size 25 --stars 6 --count 6 --output puzzles-25x6.sbn --inverse
```

## Step 2 — Convert all packs

Once puzzle files are full, run the converter for each pack:

```sh
# ── Regular packs ──────────────────────────────────────────────────────
npx tsx src/converter.ts \
  --input puzzles-5x1.sbn  --id 5x5-normal   --name "5×5 / 1★ Normal"   --free --count 60

npx tsx src/converter.ts \
  --input puzzles-6x1.sbn  --id 6x6-normal   --name "6×6 / 1★ Normal"   --free --count 60

npx tsx src/converter.ts \
  --input puzzles-6x1.sbn  --id 6x6-hard     --name "6×6 / 1★ Hard"     --free --skip 60 --count 60

npx tsx src/converter.ts \
  --input puzzles-8x1.sbn  --id 8x8-normal   --name "8×8 / 1★ Normal"   --free --count 60

npx tsx src/converter.ts \
  --input puzzles-8x1.sbn  --id 8x8-hard     --name "8×8 / 1★ Hard"     --free --skip 60 --count 60

npx tsx src/converter.ts \
  --input puzzles-10x2.sbn --id 10x10-normal  --name "10×10 / 2★ Normal" --free --count 60

npx tsx src/converter.ts \
  --input puzzles-10x2.sbn --id 10x10-hard    --name "10×10 / 2★ Hard"   --free --skip 60 --count 60

npx tsx src/converter.ts \
  --input puzzles-14x3.sbn --id 14x14-normal  --name "14×14 / 3★ Normal" --free --count 60

npx tsx src/converter.ts \
  --input puzzles-14x3.sbn --id 14x14-hard    --name "14×14 / 3★ Hard"   --free --skip 60 --count 60

# ── Streak packs ────────────────────────────────────────────────────────
npx tsx src/converter.ts \
  --input puzzles-17x4.sbn --id daily   --name "Daily"   --free --count 365

npx tsx src/converter.ts \
  --input puzzles-21x5.sbn --id weekly  --name "Weekly"  --free --count 52

npx tsx src/converter.ts \
  --input puzzles-25x6.sbn --id monthly --name "Monthly" --free --count 12
```

Each command outputs `<id>.json` in the current directory, ready to upload to Supabase Storage at `packs/<id>.json`.
