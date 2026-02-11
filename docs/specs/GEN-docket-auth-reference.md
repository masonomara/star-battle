# Docket Auth Reference

Granular implementation details from [masonomara/docket](https://github.com/masonomara/docket). This is the reference architecture for Star Battle's auth system.

---

## Stack

| Layer | Technology |
|-------|-----------|
| API Server | Cloudflare Worker (vanilla `export default { fetch() }`) |
| Web Frontend | React Router v7 (SSR on Workers) |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| Auth | BetterAuth |
| Email | Resend |
| Hosting | Cloudflare Workers (API + web are separate Workers) |
| Monorepo | npm workspaces (`apps/api`, `apps/web`) |

---

## Server-Side Auth Config

**File:** `apps/api/src/lib/auth.ts`

BetterAuth is initialized per-request via a factory function. This is required because Cloudflare Workers only expose bindings (`env.DB`) at request time, not at module scope.

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
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(env, {
          to: user.email,
          subject: "Reset your password",
          html: `<a href="${url}">Reset password</a>`,
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(env, {
          to: user.email,
          subject: "Verify your email",
          html: `<a href="${url}">Verify email</a>`,
        });
      },
    },

    socialProviders: {
      apple: {
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET,
        appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    trustedOrigins: [
      "https://appleid.apple.com",
      "http://localhost:8787",
      "http://localhost:5173",
      // production origins...
    ],

    advanced: isDevelopment
      ? { useSecureCookies: false }
      : {
          crossSubDomainCookies: { enabled: true, domain: "yourdomain.com" },
          useSecureCookies: true,
        },

    hooks: {
      before: [
        {
          // Normalize email to lowercase on sign-up/sign-in
          matcher: (ctx) => ctx.path.startsWith("/sign"),
          handler: async (ctx) => {
            if (ctx.body?.email) {
              ctx.body.email = ctx.body.email.toLowerCase().trim();
            }
          },
        },
      ],
    },
  });
}
```

---

## Custom Password Hashing (PBKDF2)

Workers lack bcrypt. Docket uses PBKDF2-SHA256 with 100,000 iterations via Web Crypto API.

```typescript
const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_LENGTH * 8,
  );
  return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...new Uint8Array(derived)))}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_LENGTH * 8,
  );
  const expected = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));
  // Constant-time comparison
  const actual = new Uint8Array(derived);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
```

**Format:** `base64(salt):base64(hash)` stored in the `account.password` column.

---

## Database Schema (Auth Tables)

**File:** `apps/api/src/db/schema.ts`

Four tables managed by BetterAuth via Drizzle:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(), // "credential", "google", "apple"
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"), // PBKDF2 hash, only for "credential" provider
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }),
});
```

All timestamps use `integer` with `mode: "timestamp_ms"` (milliseconds since epoch).

---

## Route Handling

**File:** `apps/api/src/index.ts`

BetterAuth handles all `/api/auth/*` automatically. Custom routes are dispatched manually:

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // BetterAuth handles all auth routes
    if (path.startsWith("/api/auth")) {
      return getAuth(env).handler(request);
    }

    // Custom routes with auth wrappers
    const routes: Record<string, Record<string, Function>> = {
      "/api/check-email": { POST: handleCheckEmail },
      "/api/sync": {
        GET: withAuth(handleGetSync),
        POST: withAuth(handlePostSync),
      },
      // ...
    };

    const route = routes[path];
    if (route?.[request.method]) {
      return route[request.method](request, env);
    }
    return new Response("Not Found", { status: 404 });
  },
};
```

---

## Authorization Wrappers

**File:** `apps/api/src/lib/session.ts`

No middleware. Composable wrappers that inject typed context:

```typescript
type AuthContext = {
  request: Request;
  env: Env;
  user: User;
  session: Session;
};

export async function getSession(request: Request, env: Env) {
  try {
    return await getAuth(env).api.getSession({ headers: request.headers });
  } catch {
    return null;
  }
}

export function withAuth<T>(
  handler: (ctx: AuthContext) => Promise<T>,
) {
  return async (request: Request, env: Env) => {
    const result = await getSession(request, env);
    if (!result) return new Response("Unauthorized", { status: 401 });
    return handler({
      request,
      env,
      user: result.user,
      session: result.session,
    });
  };
}
```

Docket adds role-based wrappers (`withMember`, `withAdmin`, `withOwner`) — Star Battle only needs `withAuth`.

---

## Client-Side Auth

**File:** `apps/web/app/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "https://api.yourdomain.com",
  fetchOptions: { credentials: "include" }, // Send cookies cross-origin
});

export const { useSession } = authClient;
export const { signIn, signUp, signOut } = authClient;
export const { sendVerificationEmail, verifyEmail } = authClient;
export const { requestPasswordReset, resetPassword } = authClient;
```

`credentials: "include"` is required for cross-origin cookie-based auth (web at `yourdomain.com` talks to API at `api.yourdomain.com`).

---

## Multi-Step Auth UI Flow

**File:** `apps/web/app/routes/auth.tsx`

1. **Email step** — User enters email
2. Call `POST /api/check-email { email }` to determine:
   - Not found → show sign-up form (name + password fields)
   - Found with password → show sign-in form (password field)
   - Found without password (OAuth-only) → show "Continue with Google" prompt
3. **Sign-up** — `signUp.email()` → email verification → auto sign-in
4. **Sign-in** — `signIn.email()` → redirect to app
5. **Social** — `signIn.social({ provider: "google" })` → OAuth redirect

---

## Session Handling Details

- Sessions are **cookie-based**, not JWT
- Cookie name: `better-auth.session_token`
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax`
- In development: `useSecureCookies: false` for `http://localhost`
- In production: `crossSubDomainCookies` scoped to root domain
- BetterAuth automatically refreshes sessions on activity
- Session lookup: `getAuth(env).api.getSession({ headers: request.headers })`

---

## CORS Configuration

```typescript
const ALLOWED_ORIGINS = [
  "http://localhost:5173", // dev
  "https://yourdomain.com",
  "https://www.yourdomain.com",
];

function withCors(response: Response, request: Request): Response {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return response;
}
```

---

## Environment Variables

```bash
# BetterAuth
BETTER_AUTH_SECRET=     # Session signing secret
BETTER_AUTH_URL=        # e.g. https://api.yourdomain.com

# Social providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
APPLE_APP_BUNDLE_IDENTIFIER=

# Email
RESEND_API_KEY=
```

---

## Key Patterns for Star Battle

| Docket Pattern | Star Battle Adaptation |
|---|---|
| `getAuth(env)` factory per-request | Same — required for Workers |
| Drizzle + D1 + `provider: "sqlite"` | Same |
| Cookie sessions + cross-subdomain | Same (if API and app on different subdomains) |
| PBKDF2-SHA256 (100k iterations) | Same — Workers lack bcrypt |
| `withAuth(handler)` wrappers | Same — only need `withAuth`, no role-based wrappers |
| Multi-step auth UI | Same — check email first, branch to login/signup/social |
| `credentials: "include"` on client | Same — required for cross-origin cookies |
| Google + Apple social providers | Same |
| Resend for emails | Same |
| No anonymous/guest flow | **Different** — Star Battle adds local-only anonymous mode |
| Org membership / roles | **Not needed** — Star Battle has no multi-user features |
| SSR route protection (loaders) | **Not needed** — Star Battle is a native app, not SSR web |
