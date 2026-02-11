# Information Architecture

Technical specification for puzzle delivery, user state management, and sync infrastructure

## Stack

| Concern           | Service                |
| ----------------- | ---------------------- |
| API / Auth / Sync | Cloudflare Workers     |
| Database          | Cloudflare D1 (SQLite) |
| Puzzle Storage    | Cloudflare R2          |
| Hints              | Client-side (solver + templates bundled in app) |
| Purchases         | RevenueCat             |

| Client Storage    | MMKV (React Native)    |

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT APP                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Local Storage (MMKV)                                 │  │
│  │  - Cached puzzles (fetched from R2)                   │  │
│  │  - User progress (source of truth when offline)       │  │
│  │  - Settings, streaks, hint count                      │  │
│  │  - Offline queue for pending syncs                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (when online)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  /auth/*      - Anonymous + email auth                │  │
│  │  /sync        - Push/pull user state                  │  │
│  │  /puzzles/*   - Fetch puzzles from R2                 │  │
│  │  (hints run client-side, no server endpoint)           │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│         ┌────────────────────┼────────────────────┐         │
│         ▼                    ▼                    ▼         │
│         ┌─────────────┐       ┌───────────────────┐        │
│         │     D1      │       │        R2         │        │
│         │ (user state)│       │ (puzzle storage)  │        │
│         └─────────────┘       └───────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Puzzle Delivery

### Decision: Server-Side with Local Caching

Puzzles are stored in R2 and fetched on demand. Client caches locally for offline play.

**Rationale:**

- Hotfix bugs without app update
- Gate paid packs server-side after purchase verification
- A/B test different puzzle sets
- Track puzzle download analytics
- Add new packs without app release

### R2 Storage Structure

```text
puzzles/
  packs/
    intro.json           # Free, fetched on first launch
    1star-5x5.json       # Free
    1star-6x6.json       # Free
    1star-8x8.json       # Free
    2star-10x10.json     # Free
    3star-14x14.json     # Free
    expert-25x25.json    # Paid pack (future)
  daily/
    2025-01-30.sbn
    2025-01-31.sbn
    ...
  weekly/
    2025-05.sbn
    ...
  monthly/
    2025-01.sbn
    ...
```

### SBN Format Reference

```text
Format: {size}x{stars}.{regions}.{metadata}

Example: 10x2.AABBCCDDEE...s42d7l4c12

Metadata keys:
  s{int} - seed
  d{int} - difficulty (1-10)
  l{int} - maxLevel (highest rule used)
  c{int} - cycles (solver iterations)
```

### Size Estimates

| Grid                   | Bytes |
| ---------------------- | ----- |
| 5×5 (1-star)           | ~40   |
| 10×10 (2-star)         | ~115  |
| 14×14 (3-star)         | ~210  |
| 17×17 (4-star daily)   | ~305  |
| 21×21 (5-star weekly)  | ~455  |
| 25×25 (6-star monthly) | ~640  |

**Per pack:** 60 puzzles × ~150 bytes avg = ~9KB per pack JSON

### Pack File Format

```typescript
// packs/{packId}.json
type PackFile = {
  id: string; // "1star-5x5"
  name: string; // "1-Star 5×5"
  version: number; // incremented when pack is updated
  free: boolean; // true for free packs
  puzzles: string[]; // Array of SBN strings
};
```

### Puzzle ID Strategy

Stable, human-readable IDs used in both API requests and progress storage:

| Type    | Format                | Example              |
| ------- | --------------------- | -------------------- |
| Library | `{pack}:{index}`      | `"1star-5x5:12"`     |
| Daily   | `daily:{YYYY-MM-DD}`  | `"daily:2025-01-30"` |
| Weekly  | `weekly:{YYYY}-{WW}`  | `"weekly:2025-05"`   |
| Monthly | `monthly:{YYYY}-{MM}` | `"monthly:2025-01"`  |

### Client Caching

```typescript
async function getPuzzle(id: string): Promise<string> {
  // Check local cache first
  const cached = await storage.get<string>(`puzzle:${id}`);
  if (cached) return cached;

  // Fetch from server
  const [type, key] = id.split(":");

  if (type === "daily" || type === "weekly" || type === "monthly") {
    const res = await fetch(`/puzzles/${type}/${key}`);
    const { puzzle } = await res.json();
    await storage.set(`puzzle:${id}`, puzzle);
    return puzzle;
  }

  // Pack puzzle: "1star-5x5:12" → fetch pack, return puzzle at index
  const pack = await getOrFetchPack(type);
  return pack.puzzles[parseInt(key)];
}

async function getOrFetchPack(packId: string): Promise<PackFile> {
  const cached = await storage.get<PackFile>(`pack:${packId}`);
  if (cached) return cached;

  const res = await fetch(`/puzzles/pack/${packId}`);
  const pack = await res.json();

  await storage.set(`pack:${packId}`, pack);
  return pack;
}
```

### Fetch Strategy

**Decision: Download all unlocked packs on first launch.**

When the app launches for the first time, all free packs download immediately and cache locally. This ensures full offline play for all free content from day one. Paid packs download when purchased.

| Trigger                  | Action                                      |
| ------------------------ | ------------------------------------------- |
| First app launch         | Fetch all free packs from R2, cache in MMKV |
| User purchases paid pack | Fetch that pack from R2, cache in MMKV      |
| User opens daily/weekly  | Fetch single SBN from R2, cache in MMKV     |
| Subsequent opens         | Serve from local cache (no network)         |
| Offline + not cached     | Show "Download required" state              |

### First Launch Flow

```typescript
async function onFirstLaunch() {
  const freePacks = [
    "intro",
    "1star-5x5",
    "1star-6x6",
    "1star-8x8",
    "2star-10x10",
    "3star-14x14",
  ];

  // Download all free packs in parallel
  await Promise.all(freePacks.map((packId) => fetchAndCachePack(packId)));
}

async function onPurchase(packId: string) {
  // Download purchased pack immediately after purchase confirmed
  await fetchAndCachePack(packId);
}
```

### Cache Behavior

| Scenario         | Behavior                                 |
| ---------------- | ---------------------------------------- |
| Pack cached      | Persists indefinitely                    |
| App update       | Cache preserved                          |
| Bug fix needed   | Manual cache clear via settings          |
| Storage pressure | User can clear individual packs (future) |

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

### Cell State Encoding

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

---

## Worker Endpoints

### Authentication

```text
POST /auth/anon
  Request:  { deviceId: string }
  Response: { userId: string, token: string }

  Creates anonymous user, returns JWT.

POST /auth/register
  Request:  { email: string, password: string }
  Headers:  Authorization: Bearer <token>
  Response: { userId: string, token: string }

  Upgrades anonymous user to registered account.
  Existing progress transfers to new account.

POST /auth/login
  Request:  { email: string, password: string }
  Response: { userId: string, token: string }

  Returns JWT. Client merges any local anonymous data.

POST /auth/logout
  Headers:  Authorization: Bearer <token>
  Response: { success: true }
```

### Sync

```text
GET /sync
  Headers:  Authorization: Bearer <token>
  Response: {
    settings: UserSettings,
    purchases: Purchases,
    progress: Record<string, PuzzleProgress>,
    packProgress: Record<string, number>  // packId -> unlocked_index
  }

  Pull full user state from D1.

POST /sync
  Headers:  Authorization: Bearer <token>
  Request:  {
    settings?: Partial<UserSettings>,
    progress?: Record<string, PuzzleProgress>,
    packProgress?: Record<string, number>  // packId -> unlocked_index
  }
  Response: { success: true, conflicts?: string[] }

  Push user state to D1. Last-write-wins per puzzle_id and pack_id.
```

### Puzzles

```text
GET /puzzles/versions
  Headers:  Authorization: Bearer <token>
  Response: Record<string, number>  // { "intro": 1, "1star-5x5": 2, ... }

  - Returns current version number for each pack
  - Client compares against cached versions on app open
  - Re-downloads any pack where server version > local version

GET /puzzles/pack/:packId
  Headers:  Authorization: Bearer <token> (optional for free packs)
  Response: PackFile

  - Free packs: serve directly from R2
  - Paid packs: check D1 purchases table for user entitlement, then serve from R2
  - Returns 403 if user has not purchased the paid pack
  - CDN caching: Cache-Control: public, max-age=86400

GET /puzzles/daily/:date
GET /puzzles/weekly/:week
GET /puzzles/monthly/:month
  Response: { puzzle: string }

  - Serve single SBN string from R2
  - CDN caching: Cache-Control: public, max-age=86400
```

### Hints

Hints run entirely client-side. No server endpoint needed.

---

## Auth Flow

### Anonymous (Default)

```text
1. App launches first time
2. Client generates UUID, stores locally
3. Client calls POST /auth/anon { deviceId }
4. Worker creates user row, returns JWT
5. Client stores JWT, uses for all API calls
6. User is "logged in" anonymously
```

### Account Upgrade

```text
1. User taps "Create Account" in settings
2. Client calls POST /auth/register { email, password }
3. Worker:
   - Creates email/password credential (hashed)
   - Links to existing anonymous user row
   - Returns new JWT
4. Client stores new JWT
5. All existing progress preserved
```

### Login on New Device

```text
1. User installs app on new device
2. User taps "Sign In"
3. Client calls POST /auth/login { email, password }
4. Worker returns JWT + userId
5. Client calls GET /sync to pull all progress
6. Client merges server state with any local anonymous data
7. If conflicts, last-write-wins by updated_at
```

### Conflict Resolution

Per-puzzle last-write-wins:

```typescript
function mergeProgress(
  local: Record<string, PuzzleProgress>,
  remote: Record<string, PuzzleProgress>,
): Record<string, PuzzleProgress> {
  const merged = { ...local };
  for (const [id, remoteProg] of Object.entries(remote)) {
    const localProg = local[id];
    if (!localProg || remoteProg.updated_at > localProg.updated_at) {
      merged[id] = remoteProg;
    }
  }
  return merged;
}
```

---

## Sync Behavior

### Triggers

| Event              | Action                |
| ------------------ | --------------------- |
| App opens          | Pull sync (if online) |
| Puzzle completed   | Push sync (debounced) |
| Settings changed   | Push sync (debounced) |
| App backgrounds    | Flush pending sync    |
| Network reconnects | Flush offline queue   |

### Debounce

Don't sync every cell tap. Batch changes:

```typescript
const SYNC_DEBOUNCE_MS = 5000;
let syncTimeout: NodeJS.Timeout | null = null;
let pendingChanges: Partial<SyncPayload> = {};

function queueSync(changes: Partial<SyncPayload>) {
  pendingChanges = deepMerge(pendingChanges, changes);

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(flushSync, SYNC_DEBOUNCE_MS);
}

async function flushSync() {
  if (Object.keys(pendingChanges).length === 0) return;

  const payload = pendingChanges;
  pendingChanges = {};

  try {
    await fetch("/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Network failed: re-queue for later
    pendingChanges = deepMerge(payload, pendingChanges);
    saveOfflineQueue(pendingChanges);
  }
}
```

### Offline Queue

When offline, changes accumulate in MMKV:

```typescript
type OfflineQueue = {
  settings?: Partial<UserSettings>;
  progress: Record<string, PuzzleProgress>;
};

// On network reconnect:
async function processOfflineQueue() {
  const queue = await storage.get<OfflineQueue>("offlineQueue");
  if (!queue) return;

  await fetch("/sync", { method: "POST", body: JSON.stringify(queue) });
  await storage.delete("offlineQueue");
}
```

---

## Hint System

### Decision: Fully Client-Side

Hints run entirely on the device. The solver and explanation templates are bundled in the app. No server calls needed.

**Rationale:**
- Works offline — no network dependency for hints
- Free — no per-hint server cost
- Instant — no round-trip latency
- Deterministic — same rule always produces a correct explanation

### Flow

```text
1. User taps hint button
2. Check hints_remaining in local storage (or unlimited purchase)
3. Run solver one cycle on current board state
4. Map rule name → explanation template
5. Decrement hints_remaining in local storage
6. Display hint (faded star/mark + explanation)
7. Sync hints_remaining to server on next sync cycle
```

### Explanation Templates

Each solver rule maps to a plain-language template. Templates interpolate cell coordinates and container names.

```typescript
const explanationTemplates: Record<string, (ctx: HintContext) => string> = {
  rowComplete: (ctx) =>
    `Row ${ctx.row} already has all its stars, so the remaining cells must be marked.`,
  colComplete: (ctx) =>
    `Column ${ctx.col} already has all its stars, so the remaining cells must be marked.`,
  regionComplete: (ctx) =>
    `Cage ${ctx.region} already has all its stars, so the remaining cells must be marked.`,
  forcedPlacement: (ctx) =>
    `Cage ${ctx.region} only has ${ctx.count} unknown cells left and needs ${ctx.count} stars — they must all be stars.`,
  // ... one entry per solver rule
};
```

### Error Handling

| Condition             | Client Action             |
| --------------------- | ------------------------- |
| No hints remaining    | Show purchase prompt      |
| Puzzle already solved | Hide hint button          |

---

## Purchases

### RevenueCat Integration

RevenueCat handles App Store / Play Store receipt validation. Webhook notifies Worker of purchase events.

```text
POST /webhook/revenuecat
  Request: RevenueCat webhook payload

  1. Verify webhook signature
  2. Extract user_id and entitlements
  3. Update purchases table in D1
```

### Entitlement Mapping

| RevenueCat Entitlement | D1 Column                   |
| ---------------------- | --------------------------- |
| `remove_ads`           | `purchases.remove_ads`      |
| `unlock_all`           | `purchases.unlock_all`      |
| `unlimited_hints`      | `purchases.unlimited_hints` |
| `pro_bundle`           | `purchases.pro_bundle`      |

### Client-Side Check

```typescript
// Fast path: check local cache
function hasEntitlement(ent: string): boolean {
  return localPurchases[ent] === true;
}

// On app open: sync with server
async function refreshPurchases() {
  const { purchases } = await fetch("/sync").then((r) => r.json());
  localPurchases = purchases;
  storage.set("purchases", purchases);
}
```

---

## Streaks

### Calculation (UTC)

```typescript
function updateStreak(
  settings: UserSettings,
  puzzleId: string,
  completedAt: number,
): Partial<UserSettings> {
  const date = new Date(completedAt);
  const updates: Partial<UserSettings> = {};

  if (puzzleId.startsWith("daily:")) {
    const today = formatDate(date); // "2025-01-30"
    const yesterday = formatDate(subDays(date, 1));

    if (settings.last_daily === yesterday) {
      updates.streak_daily = settings.streak_daily + 1;
    } else if (settings.last_daily !== today) {
      updates.streak_daily = 1; // Reset
    }
    updates.last_daily = today;
  }

  // Similar for weekly/monthly...

  return updates;
}
```

### Timezone

All streak calculation is **UTC**. Daily puzzle resets at 00:00 UTC.

Client displays "New puzzle in X hours" based on UTC.

---

## Open Decisions

All resolved.

- [x] **Fetch strategy** — All free packs download on first launch; paid packs download on purchase
- [x] **Cache invalidation** — Version-based: each pack has a version number, client checks on app open, re-downloads if server version is newer
- [x] **Paid pack gating** — RevenueCat webhook → Worker → D1. Worker checks D1 purchases table before serving paid packs from R2
- [x] **Puzzle versioning** — No versioning for dailies/weeklies/monthlies. If one's broken, leave it.
- [x] **Offline limits** — No limits. Packs are ~9KB, dailies ~300 bytes. Cache everything.
- [x] **Anonymous cleanup** — Not needed for v1. Revisit at scale.
- [x] **Rate limiting** — Not needed. Hints run client-side, no expensive server calls to protect.
- [x] **Password hashing** — Deferred. Cross that bridge when auth is built.
- [x] **Hint explanations** — Template-based, mapped from solver rule names. No AI dependency. Runs client-side.
- [x] **Streak grace period** — No grace period. Miss a day, streak resets.
- [x] **Leaderboards** — Not in scope.

---

## File Structure

```text
worker/
  src/
    index.ts          # Router
    auth.ts           # /auth/* handlers
    sync.ts           # /sync handlers
    puzzles.ts        # /puzzles/* handlers (R2 access)
    webhook.ts        # /webhook/revenuecat
    db.ts             # D1 queries
    types.ts          # Shared types
  wrangler.toml       # Cloudflare config (binds D1, R2)

r2/
  puzzles/
    packs/
      intro.json
      1star-5x5.json
      ...
    daily/
      2025-01-30.sbn
      ...
    weekly/
    monthly/

app/
  src/
    lib/
      api.ts          # API client
      storage.ts      # MMKV wrapper
      sync.ts         # Sync logic + offline queue
      puzzles.ts      # Puzzle fetching + caching
      hint.ts         # Solver + explanation templates (client-side)
```
