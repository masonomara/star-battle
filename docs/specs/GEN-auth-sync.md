# Auth, Sync & Client Features

Auth flows, sync behavior, hints, purchases, and streaks.

---

## Auth Flows

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
