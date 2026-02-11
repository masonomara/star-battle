# Auth, Sync & Client Features

Auth flows, sync behavior, hints, purchases, and streaks.

BetterAuth handles all account management. Anonymous users are purely local — no server-side records until the user creates an account.

---

## Auth Architecture

### BetterAuth on Cloudflare Workers

Auth follows the same pattern as [Docket](https://github.com/masonomara/docket). See `GEN-docket-auth-reference.md` for granular implementation details.

- **Library:** BetterAuth with Drizzle adapter
- **Database:** D1 (SQLite) via Drizzle ORM
- **Sessions:** Cookie-based (not JWT), cross-subdomain in production
- **Password hashing:** PBKDF2-SHA256 (100k iterations) — Workers lack bcrypt
- **Social providers:** Google + Apple
- **Email:** Resend for verification and password reset

### Factory Pattern (Required for Workers)

BetterAuth is initialized per-request because Workers only expose bindings at request time:

```typescript
export function getAuth(env: AuthEnv) {
  const db = drizzle(env.DB, { schema });
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: { hash: hashPassword, verify: verifyPassword },
      sendResetPassword: async ({ user, url }) => { /* Resend */ },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => { /* Resend */ },
    },
    socialProviders: {
      apple: { clientId, clientSecret, appBundleIdentifier },
      google: { clientId, clientSecret },
    },
  });
}
```

### Auth Tables (Managed by BetterAuth)

| Table | Purpose |
|-------|---------|
| `user` | id, name, email, emailVerified, image, timestamps |
| `session` | id, token, expiresAt, userId, ipAddress, userAgent |
| `account` | id, providerId, userId, password (PBKDF2 hash), OAuth tokens |
| `verification` | id, identifier, value, expiresAt (email verify + password reset) |

These are separate from the app-specific tables (`puzzle_progress`, `user_settings`, `purchases`, `pack_progress`). BetterAuth owns the auth tables; app code owns the rest.

---

## Auth Flows

### Anonymous (Default — Purely Local)

```text
1. App launches first time
2. Client generates UUID, stores in MMKV
3. No server call — user plays immediately
4. All progress, settings, hints stored locally in MMKV
5. User is never aware of "auth" — the app just works
```

No server-side record exists for anonymous users. This eliminates:
- Unbounded anonymous user row creation
- Rate limiting concerns on account creation
- Orphaned server records
- Anonymous cleanup jobs

### Account Creation (Optional)

```text
1. User taps "Create Account" in settings (wants cloud sync / cross-device)
2. App shows multi-step auth:
   a. Enter email
   b. Check if email exists (POST /api/check-email)
   c. New user → sign-up form (name + password)
   d. Existing user → sign-in form (password) or social prompt
3. BetterAuth handles registration/login via /api/auth/* routes
4. On success, client performs initial sync:
   a. Push all local MMKV progress to server (POST /sync)
   b. Pull any existing server state (GET /sync)
   c. Merge using last-write-wins per puzzle_id
5. Client stores session cookie; future syncs happen automatically
```

### Sign In on New Device

```text
1. User installs app on new device
2. App starts in anonymous mode (local UUID, no server)
3. User taps "Sign In" in settings
4. BetterAuth handles login (email/password or Google/Apple)
5. Client pulls server state (GET /sync)
6. Client merges server state with any local anonymous progress
7. Local anonymous UUID is retired; session cookie used going forward
```

### Social Auth (Google / Apple)

```text
1. User taps "Continue with Google" or "Continue with Apple"
2. BetterAuth redirects to OAuth provider
3. On callback, BetterAuth creates/links account + session
4. Same initial sync flow as email registration
```

---

## Authorization Pattern

No middleware. Composable wrappers (same pattern as Docket):

```typescript
// Requires authenticated session
export function withAuth<T>(handler: (ctx: AuthContext) => T) {
  return async (request: Request, env: Env) => {
    const session = await getAuth(env).api.getSession({
      headers: request.headers,
    });
    if (!session) return new Response("Unauthorized", { status: 401 });
    return handler({ request, env, user: session.user, session: session.session });
  };
}
```

Usage:
```typescript
"/api/sync": {
  GET: withAuth(handleGetSync),
  POST: withAuth(handlePostSync),
},
"/api/webhook/revenuecat": {
  POST: handleRevenueCatWebhook, // No auth — uses webhook signature
},
```

---

## Conflict Resolution

Per-puzzle last-write-wins. Only relevant when a user has both local progress and server progress (initial sync after account creation, or sign-in on a device with local play).

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

**Known limitation:** Client timestamps mean clock skew can cause silent overwrites. Acceptable for v1 — puzzle progress isn't critical data. Revisit with server-side timestamps if sync issues arise.

---

## Sync Behavior

Sync only exists for authenticated users. Anonymous users have no server interaction.

### Triggers

| Event              | Action                |
| ------------------ | --------------------- |
| App opens          | Pull sync (if online + authenticated) |
| Puzzle completed   | Push sync (debounced) |
| Settings changed   | Push sync (debounced) |
| App backgrounds    | Flush pending sync    |
| Network reconnects | Flush offline queue   |

### Debounce

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
      credentials: "include", // Cookie-based auth
      body: JSON.stringify(payload),
    });
  } catch (e) {
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

async function processOfflineQueue() {
  const queue = await storage.get<OfflineQueue>("offlineQueue");
  if (!queue) return;
  await fetch("/sync", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(queue),
  });
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
7. If authenticated, sync hints_remaining on next sync cycle
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
  // ... one entry per solver rule (38 total)
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
function hasEntitlement(ent: string): boolean {
  return localPurchases[ent] === true;
}

async function refreshPurchases() {
  const { purchases } = await fetch("/sync", {
    credentials: "include",
  }).then((r) => r.json());
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
