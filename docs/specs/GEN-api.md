# API Endpoints

Cloudflare Worker routes for auth, sync, puzzles, and webhooks.

---

## Authentication

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

---

## Sync

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

---

## Puzzles

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

---

## Webhooks

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
