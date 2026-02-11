# Architecture Overview

Stack, system diagram, and file structure.

---

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

## System Diagram

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
