# Database Schema

D1 (SQLite) tables and cell state encoding.

---

## D1 Schema

```sql
-- Users (anonymous or registered)
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID, generated client-side for anon
  email TEXT UNIQUE,                -- NULL for anonymous users
  created_at INTEGER NOT NULL,      -- Unix timestamp ms
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

-- Puzzle progress (one row per user per puzzle)
CREATE TABLE puzzle_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,          -- "1star-5x5:12", "daily:2025-01-30"
  cells TEXT NOT NULL,              -- JSON: flattened cell states
  time_ms INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  completed_at INTEGER,             -- Unix timestamp ms
  hints_used INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, puzzle_id)
);

CREATE INDEX idx_progress_user ON puzzle_progress(user_id);
CREATE INDEX idx_progress_puzzle ON puzzle_progress(puzzle_id);

-- User settings and account state
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Gameplay settings
  auto_x INTEGER NOT NULL DEFAULT 1,           -- 0 or 1
  highlight_errors INTEGER NOT NULL DEFAULT 1, -- 0 or 1
  show_timer INTEGER NOT NULL DEFAULT 1,       -- 0 or 1
  show_coordinates INTEGER NOT NULL DEFAULT 0, -- 0 or 1
  thick_borders INTEGER NOT NULL DEFAULT 0,    -- 0 or 1
  colored_regions INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  pin_toolbar INTEGER NOT NULL DEFAULT 0,      -- 0 or 1

  -- App settings
  theme TEXT NOT NULL DEFAULT 'light',         -- 'light', 'dark', 'midnight'
  sound INTEGER NOT NULL DEFAULT 1,            -- 0 or 1
  haptics INTEGER NOT NULL DEFAULT 1,          -- 0 or 1

  -- Hints
  hints_remaining INTEGER NOT NULL DEFAULT 3,

  -- Streaks (UTC-based)
  streak_daily INTEGER NOT NULL DEFAULT 0,
  streak_weekly INTEGER NOT NULL DEFAULT 0,
  streak_monthly INTEGER NOT NULL DEFAULT 0,
  last_daily TEXT,                             -- "2025-01-30"
  last_weekly TEXT,                            -- "2025-05"
  last_monthly TEXT,                           -- "2025-01"

  updated_at INTEGER NOT NULL
);

-- Pack progression (tracks sequential unlock within each pack)
CREATE TABLE pack_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,                       -- "1star-5x5", "intro"
  unlocked_index INTEGER NOT NULL DEFAULT 0,   -- highest unlocked puzzle index
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, pack_id)
);

CREATE INDEX idx_pack_progress_user ON pack_progress(user_id);

-- Purchases (synced from RevenueCat webhooks)
CREATE TABLE purchases (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  remove_ads INTEGER NOT NULL DEFAULT 0,       -- 0 or 1
  unlock_all INTEGER NOT NULL DEFAULT 0,       -- 0 or 1
  unlimited_hints INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  pro_bundle INTEGER NOT NULL DEFAULT 0,       -- 0 or 1
  updated_at INTEGER NOT NULL
);
```

---

## Cell State Encoding

Store cells as compact JSON string. For a 10×10 grid:

```typescript
// CellState: 0 = unknown, 1 = star, 2 = marked
type EncodedCells = string; // JSON array: "[0,0,1,2,0,0,2,1,...]"

function encodeCells(cells: CellState[][]): string {
  const map = { unknown: 0, star: 1, marked: 2 };
  return JSON.stringify(cells.flat().map((c) => map[c]));
}

function decodeCells(encoded: string, size: number): CellState[][] {
  const map = ["unknown", "star", "marked"] as const;
  const flat = JSON.parse(encoded) as number[];
  const cells: CellState[][] = [];
  for (let r = 0; r < size; r++) {
    cells.push(flat.slice(r * size, (r + 1) * size).map((n) => map[n]));
  }
  return cells;
}
```

**Size:** 10×10 grid = 100 cells × ~2 chars = ~200 bytes per puzzle progress row.
