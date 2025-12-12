# Initial Architecture

_None of these decisons are currently set. Remain open to new architecture decisions right now._

## Client (React Native)

- React Native 0.76+ (New Architecture)
- op-sqlite (structured data, settings, puzzle progress)
- Zustand (ephemeral UI state only, performance layer between user interactions and persistent storage)
- React Navigation (routing)

## Server (Cloudflare)

**Cloudflare Workers**
API routing requests to durable objects, can handle auth, can handle rate limiting, can handle CORS. Perfect for stateless operations, request routing, API gateways, and edge caching. Use Workers with queues for bulk data processing.

**Durable Objects**
DOs are globally unique instances with built-in SQLite. they are single threaded for strong consistency, support websockets for real-time. They are not a database by themselves, they use D1 for that. They are not for bulk storage, they use R2 for that. They are not global read-heavy data (they use KV for that). DOs are for real-time coordination, per-user states, websockets, transations, and strong consistency

**D1 (Global Read-Heavy Data)**
For global read-heavy data and data quieries. D1 is a type of database for global read-heavy data. perfect for analytics, historical data like leaderboards, user statistics, aggregations, and eventual consistency.

**R2 (Puzzle Asset Storage)**
For file storage and object storage, like daily/weekly/monthly puzzle definitions. Note: LIBRARY puzzles (300 total) are bundled in the app, not stored in R2.

**KV (CDN Cache layer)**
For key-value caches. Good for puzzle metadata, metadata chaches, CDN caching, app configuration, user badges

**Alarms (background jobs)**
Great for regenerating daily, weekly, and monthly puzzles. Backgroudn jobs, simialr to Cron jobs

## Sync (Last-write-wins)

- Last-write-wins with timestamps (simple, battle-tested)

## State Management

- Zustand (ephemeral UI state, no persistance)
- op-sqlite (single source of truth for all client-side persistent data)
- TanStack Query (server state management, cloud sync)

## Authentication

**First App Launch**

- Auto-generate UUID v4
- store in op-sqlite `user_settings` table (key: "user_id")
- No server call yet (fully offline-first)
- User can play LIBRARY puzzles indefinitely without network
- no email/password required

**Email/password linking:**

1. User taps "Create Account" in settings
2. Client makes an API call to Cloudlfare Auth
3. Server:
   - Validates email
   - Hashes password
   - Updates user record: `auth_type = "email"`, sets email + password_hash
   - Migrates all anonymous data to email account

## Testing and Logging

**Testing**

- Unit tests (client)
- Integration tests (sync)

**Analytics**

- Client metrics (App launch time, puzzle laod time)
- Business metrics (DAUs, MAUs, Daily Puzzle Completion)
- Client monitoring (Sentry, RN Performance Moniter)
- Server monitoring (Cloudflare Analytics, Sentry)
