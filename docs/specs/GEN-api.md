# API Endpoints

Cloudflare Worker routes for auth, sync, puzzles, and webhooks.

Auth is handled by BetterAuth — all `/api/auth/*` routes are managed automatically. App routes use cookie-based sessions via `withAuth()` wrappers.

---

## Authentication (BetterAuth — Automatic)

All `/api/auth/*` routes are handled by BetterAuth's built-in handler:

```typescript
if (path.startsWith("/api/auth")) {
  return getAuth(env).handler(request);
}
```

### Built-in Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/sign-up/email` | POST | Email/password registration |
| `/api/auth/sign-in/email` | POST | Email/password login |
| `/api/auth/sign-in/social` | POST | Social login (Google/Apple) |
| `/api/auth/callback/:provider` | GET | OAuth callback |
| `/api/auth/get-session` | GET | Get current session from cookie |
| `/api/auth/sign-out` | POST | Sign out (clear session) |
| `/api/auth/verify-email` | POST | Email verification |
| `/api/auth/forget-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Set new password |

### Custom Auth Route

```text
POST /api/check-email
  Request:  { email: string }
  Response: { exists: boolean, hasPassword: boolean }

  Used by multi-step auth UI to determine which form to show:
  - Not found → sign-up form
  - Found with password → sign-in form
  - Found without password (OAuth-only) → social prompt
```

---

## Sync

Requires authentication (cookie-based session). Anonymous users have no server interaction.

```text
GET /sync
  Auth: Cookie session (withAuth)
  Response: {
    settings: UserSettings,
    purchases: Purchases,
    progress: Record<string, PuzzleProgress>,
    packProgress: Record<string, number>  // packId -> unlocked_index
  }

  Pull full user state from D1.

POST /sync
  Auth: Cookie session (withAuth)
  Request: {
    settings?: Partial<UserSettings>,
    progress?: Record<string, PuzzleProgress>,
    packProgress?: Record<string, number>  // packId -> unlocked_index
  }
  Response: { success: true, conflicts?: string[] }

  Push user state to D1. Last-write-wins per puzzle_id and pack_id.
```

---

## Puzzles

**v1:** All puzzle packs are bundled in the app binary (~54KB). No R2 dependency. The endpoints below are for future OTA pack updates.

```text
GET /puzzles/versions                                        [post-v1]
  Auth: Cookie session (optional)
  Response: Record<string, number>  // { "intro": 1, "1star-5x5": 2, ... }

  Returns current version number for each pack.
  Client compares against cached versions on app open.
  Re-downloads any pack where server version > local version.

GET /puzzles/pack/:packId                                    [post-v1]
  Auth: Cookie session (optional for free packs)
  Response: PackFile

  - Free packs: serve directly from R2
  - Paid packs: check D1 purchases table for user entitlement, then serve from R2
  - Returns 403 if user has not purchased the paid pack
  - CDN caching: Cache-Control: public, max-age=86400

GET /puzzles/daily/:date
GET /puzzles/weekly/:week
GET /puzzles/monthly/:month
  Response: { puzzle: string }

  Serve single SBN string from R2.
  CDN caching: Cache-Control: public, max-age=86400
```

---

## Webhooks

```text
POST /webhook/revenuecat
  Auth: Webhook signature (X-RevenueCat-Signature header)
  Request: RevenueCat webhook payload

  1. Verify signature using shared secret from env
  2. Extract user_id and entitlements
  3. Update purchases table in D1
```

### Webhook Signature Verification

```typescript
async function verifyRevenueCatSignature(
  request: Request,
  secret: string,
): Promise<boolean> {
  const signature = request.headers.get("X-RevenueCat-Signature");
  if (!signature) return false;
  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const expected = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  const data = new TextEncoder().encode(body);
  return crypto.subtle.verify("HMAC", key, expected, data);
}
```

### Entitlement Mapping

| RevenueCat Entitlement | D1 Column                   |
| ---------------------- | --------------------------- |
| `remove_ads`           | `purchases.remove_ads`      |
| `unlock_all`           | `purchases.unlock_all`      |
| `unlimited_hints`      | `purchases.unlimited_hints` |
| `pro_bundle`           | `purchases.pro_bundle`      |
