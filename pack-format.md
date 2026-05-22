# Star Battle Pack Format

This document describes the JSON format for puzzle packs and how to deliver them to Supabase. The converter (owned by the generator codebase) is responsible for producing files that match this spec.

---

## Overview

The converter takes puzzle data from the generator and outputs one JSON file per pack. That file gets uploaded to Supabase Storage. The app downloads it on demand — there is no puzzle database table.

---

## Pack JSON

Upload one file per pack to the **`packs` Storage bucket** as `{packId}.json` (e.g. `5x5-normal.json`).

```json
{
  "id": "5x5-normal",
  "name": "5×5 / 1★ Normal",
  "version": 1,
  "free": true,
  "gridSize": 5,
  "stars": 1,
  "puzzles": [
    {
      "sbn": "5x1.EEECBEEEEBAAEEBAADDDAAADD.s-1429660675d1l3c12v1",
      "solution": [[0,1],[1,3],[2,0],[3,2],[4,4]],
      "hints": [
        {
          "rule": "Forced Regions",
          "level": 1,
          "placements": [[0,1]],
          "marks": [[0,0],[0,2],[0,3],[0,4]]
        },
        {
          "rule": "Row Elimination",
          "level": 2,
          "placements": [],
          "marks": [[1,1],[1,2]]
        }
      ]
    }
  ]
}
```

### Top-level fields

| field | type | description |
|---|---|---|
| `id` | string | Must match the filename (without `.json`) and the `packs` table row |
| `name` | string | Display name shown in the app |
| `version` | integer | Increment when pack content changes |
| `free` | boolean | Whether the pack is free |
| `gridSize` | integer | Grid dimension — e.g. `5` for a 5×5 grid |
| `stars` | integer | Stars per region |
| `puzzles` | array | Ordered array of puzzles, sorted by difficulty ascending |

### Per puzzle

| field | type | description |
|---|---|---|
| `sbn` | string | Full SBN string from the generator |
| `solution` | `[row, col][]` | Zero-indexed star coordinates, one per star. An N×N / K-star puzzle has N×K entries. Order doesn't matter. |
| `hints` | array | Optional. Required for the in-app hint button to work. |

### Hint steps

Each entry in `hints` is one logical deduction, in order:

| field | type | description |
|---|---|---|
| `rule` | string | Name of the deduction rule applied |
| `level` | integer | Difficulty of this rule (1 = easiest) |
| `placements` | `[row, col][]` | Stars placed in this step |
| `marks` | `[row, col][]` | Cells eliminated in this step |

Difficulty from the generator is used **only** to sort puzzles within the pack — it is not stored in the puzzle JSON.

---

## SBN string format

`{gridSize}x{stars}.{layout}.{metadata}`

- `layout` — one letter per cell (A–Z) identifying the region, row by row, left to right. A 5×5 grid = 25 letters.
- `metadata` — encoded generator fields (seed, difficulty, max rule level, cycles, version)

---

## Supabase `packs` table

Insert one row per pack after uploading the JSON file. The `packs` table schema:

```sql
create table public.packs (
  id text not null,
  name text not null,
  grid_size integer not null,
  stars integer not null,
  difficulty text not null,
  is_free boolean not null default false,
  price_usd numeric(6, 2) null,
  puzzle_count integer not null,
  storage_path text null,
  published boolean not null default false,
  created_at timestamp with time zone null default now(),
  constraint packs_pkey primary key (id),
  constraint packs_difficulty_check check (
    difficulty = any (array['normal'::text, 'hard'::text])
  )
);
```

| column | value |
|---|---|
| `id` | e.g. `5x5-normal` — must match the JSON `id` and filename |
| `name` | display name |
| `grid_size` | e.g. `5` |
| `stars` | e.g. `1` |
| `difficulty` | `"normal"` or `"hard"` |
| `is_free` | boolean |
| `price_usd` | nullable |
| `puzzle_count` | length of the `puzzles` array in the JSON |
| `storage_path` | e.g. `5x5-normal.json` |
| `published` | set to `true` to make the pack visible in the app |

---

## Streak packs

Streak packs (`daily`, `weekly`, `monthly`) use the exact same JSON format with the following differences:

- `id` is the streak type: `daily`, `weekly`, or `monthly`
- Uploaded as `daily.json`, `weekly.json`, `monthly.json` to the `packs` Storage bucket
- **No row needed in the `packs` table** — the app fetches them directly by name

---

## Converter requirements

The converter lives in the generator codebase so it stays in sync when difficulty scoring or hint format changes.

**Inputs:**
- List of puzzles from the generator, each with: SBN string, solution, hints, difficulty score
- Pack metadata: id, name, free, gridSize, stars

**Behavior:**
- Sort puzzles by difficulty ascending
- Output a single JSON file matching this spec
- `puzzle_count` in the `packs` table row should match the length of the output `puzzles` array
