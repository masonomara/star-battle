# Cloudflare Durable Objects + Local-First Storage Architecture
## Star Battle Puzzle Game - Storage Research & Recommendations

**Date:** December 11, 2025
**Status:** Comprehensive Analysis for Cloudflare-First Architecture
**Previous Context:** Local storage comparison (MMKV recommended), React Native architecture (New Architecture)

---

## Executive Summary

**RECOMMENDATION: Start with MMKV → Migrate to op-sqlite + Cloudflare Durable Objects**

For Star Battle's evolution from offline-first to Cloudflare-powered multiplayer:

1. **Phase 1 (MVP)**: MMKV for simple key-value storage (already recommended)
2. **Phase 2 (Cloud Sync)**: Migrate to op-sqlite + custom sync layer with Cloudflare Durable Objects
3. **Phase 3 (Multiplayer)**: Add Durable Objects for real-time features (daily puzzle racing, leaderboards, multiplayer sessions)

This path balances:
- Simple start (MMKV is fastest to implement)
- Cloudflare-native future (Durable Objects + D1 integration)
- Exciting features (real-time puzzle racing, global leaderboards, daily puzzle distribution)
- Performance and cost optimization

---

## 1. Cloudflare Durable Objects in Puzzle Game Context

### What Are Durable Objects?

Durable Objects provide **stateful serverless computing** with:
- Globally unique instances with built-in SQLite storage
- WebSocket support for real-time bidirectional communication
- Strong consistency (single-threaded coordination per object)
- Fast wake-up times (~50ms)
- Free tier available (as of 2025)

### Perfect Use Cases for Star Battle

#### A. Daily Puzzle Distribution & Coordination
```
┌─────────────────────────────────────────┐
│     Durable Object: "daily-puzzle"     │
│  - Stores today's puzzle configuration  │
│  - Tracks all active solvers           │
│  - Coordinates leaderboard updates     │
│  - Broadcasts completion events        │
└─────────────────────────────────────────┘
         ↓ WebSocket Connections ↓
    ┌──────┐  ┌──────┐  ┌──────┐
    │ User │  │ User │  │ User │
    │  A   │  │  B   │  │  C   │
    └──────┘  └──────┘  └──────┘
```

**Benefits:**
- Single source of truth for daily puzzle
- Real-time leaderboard updates (see others completing)
- "X people solving now" live counter
- Instant verification of completion times

#### B. Real-Time Puzzle Racing (Multiplayer Mode)
```
┌─────────────────────────────────────────┐
│   Durable Object: "race-session-abc"   │
│  - Same puzzle for all participants    │
│  - Live progress updates per player    │
│  - First-to-complete tracking          │
│  - Ghost cursor/grid state sharing     │
└─────────────────────────────────────────┘
         ↓ WebSocket Broadcasts ↓
    ┌──────┐  ┌──────┐  ┌──────┐
    │Player│  │Player│  │Player│
    │  1   │  │  2   │  │  3   │
    └──────┘  └──────┘  └──────┘
```

**Features Enabled:**
- 2-4 player competitive races
- See opponent's progress in real-time
- "Player X placed a star at (5,7)"
- First-to-complete wins
- Spectator mode for completed players

#### C. Global Leaderboards by Puzzle
```
┌─────────────────────────────────────────┐
│  Durable Object: "leaderboard-daily"   │
│  - SQLite table: rankings              │
│  - Sorted by completion time           │
│  - Top 100 globally                    │
│  - Your rank + surrounding players     │
└─────────────────────────────────────────┘
```

**Why Durable Objects?**
- Strong consistency (no duplicate ranks)
- Fast reads/writes with embedded SQLite
- Broadcast rank changes to live viewers
- Cost-effective (one object per daily puzzle)

#### D. User Session Sync (Cross-Device Progress)
```
┌─────────────────────────────────────────┐
│  Durable Object: "user-123-session"    │
│  - Active puzzle state                 │
│  - Settings preferences                │
│  - Completion history metadata         │
│  - Sync queue for offline changes      │
└─────────────────────────────────────────┘
         ↓ Sync ↓
    ┌──────┐  ┌──────┐
    │ iPhone│  │ iPad │
    │       │  │      │
    └──────┘  └──────┘
```

**Use Cases:**
- Start puzzle on iPhone, finish on iPad
- Settings sync across devices
- Completion badges/streaks sync
- Offline changes queued and merged

#### E. Puzzle Library Distribution
```
┌─────────────────────────────────────────┐
│ Durable Object: "puzzle-library-v1"    │
│  - 300 library puzzles metadata        │
│  - Daily/weekly/monthly rotation logic │
│  - CDN cache keys                      │
└─────────────────────────────────────────┘
         ↓ REST API ↓
    ┌──────────────────┐
    │ Cloudflare R2    │
    │ (Puzzle Storage) │
    └──────────────────┘
```

**Benefits:**
- Centralized puzzle distribution
- Rotate daily/weekly/monthly puzzles server-side
- A/B test puzzle difficulty
- Push new puzzle packs without app update

---

## 2. Client-Side Storage Options for Cloudflare Integration

### Comparison Matrix

| Storage Option | Cloudflare Sync | Offline Support | Complexity | React Native Support | Best For |
|---|---|---|---|---|---|
| **MMKV** | Custom REST API | Excellent | Low | Excellent | MVP, simple key-value |
| **op-sqlite** | Custom sync layer | Excellent | Medium | Excellent | Structured data, migrations |
| **PowerSync** | Via backend adapter | Excellent | Medium | Excellent | Postgres/MongoDB backends |
| **WatermelonDB** | Custom sync | Excellent | Medium-High | Excellent | Complex relational data |
| **TinyBase** | Built-in sync | Good | Low-Medium | Good | Reactive local-first |
| **Automerge/Yjs (CRDT)** | P2P + server | Excellent | High | Medium | Real-time collaboration |

---

### Option 1: MMKV + Cloudflare REST API (Recommended for MVP)

**Architecture:**
```typescript
// Local storage (MMKV)
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// Save puzzle progress locally
const savePuzzleProgress = (puzzleId: string, state: PuzzleState) => {
  storage.set(`puzzle-${puzzleId}`, JSON.stringify(state));
  storage.set(`puzzle-${puzzleId}-dirty`, true);
  storage.set(`puzzle-${puzzleId}-timestamp`, Date.now());
};

// Sync to Cloudflare when online
const syncToCloudflare = async (userId: string) => {
  const dirtyKeys = storage.getAllKeys()
    .filter(k => k.endsWith('-dirty') && storage.getBoolean(k));

  for (const dirtyKey of dirtyKeys) {
    const dataKey = dirtyKey.replace('-dirty', '');
    const data = storage.getString(dataKey);
    const timestamp = storage.getNumber(`${dataKey}-timestamp`) || 0;

    try {
      // POST to Cloudflare Workers endpoint
      await fetch(`https://api.yourapp.com/sync/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: dataKey,
          value: data,
          timestamp
        })
      });

      storage.delete(dirtyKey);
    } catch (error) {
      // Keep dirty flag, retry later
      console.error('Sync failed, will retry:', error);
    }
  }
};
```

**Cloudflare Workers Endpoint:**
```typescript
// Cloudflare Worker handling sync
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { userId } = await request.json();

    // Get or create user's Durable Object
    const id = env.USER_SESSIONS.idFromName(userId);
    const stub = env.USER_SESSIONS.get(id);

    // Forward to Durable Object
    return stub.fetch(request);
  }
}

// Durable Object for user session
export class UserSession {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request: Request) {
    const { key, value, timestamp } = await request.json();

    // Check for conflicts (last-write-wins)
    const existing = await this.storage.get(`${key}-timestamp`);
    if (existing && existing > timestamp) {
      return new Response('Conflict: server newer', { status: 409 });
    }

    // Store in Durable Object's SQLite
    await this.storage.put(key, value);
    await this.storage.put(`${key}-timestamp`, timestamp);

    return new Response('Synced', { status: 200 });
  }
}
```

**Pros:**
- Simple to implement (build on existing MMKV recommendation)
- Fast local access (MMKV's synchronous API)
- Easy migration path to more complex solutions
- Full control over sync logic
- Works with Cloudflare Workers REST API

**Cons:**
- Manual sync implementation
- No automatic schema migrations
- Conflict resolution is manual
- Need to implement dirty tracking

**Best for:**
- MVP with basic cloud sync
- Settings and completion history sync
- Simple key-value data structures

---

### Option 2: op-sqlite + Custom Cloudflare Sync (Recommended for Phase 2)

**Why op-sqlite?**
- **5-8x faster** than expo-sqlite or quick-sqlite
- **5x less memory** usage
- JSI-based (React Native New Architecture optimized)
- Best SQLite performance on React Native
- Supports migrations and schema evolution

**Architecture:**
```typescript
// Define schema
import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'starBattle.db' });

// Create tables
db.execute(`
  CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    grid_size INTEGER,
    difficulty TEXT,
    cells TEXT,
    completed BOOLEAN,
    time_spent INTEGER,
    last_modified INTEGER,
    synced BOOLEAN DEFAULT 0
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    last_modified INTEGER,
    synced BOOLEAN DEFAULT 0
  )
`);

// Save puzzle with dirty tracking
const savePuzzle = (puzzle: Puzzle) => {
  db.execute(
    `INSERT OR REPLACE INTO puzzles
     (id, grid_size, difficulty, cells, completed, time_spent, last_modified, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      puzzle.id,
      puzzle.gridSize,
      puzzle.difficulty,
      JSON.stringify(puzzle.cells),
      puzzle.completed ? 1 : 0,
      puzzle.timeSpent,
      Date.now()
    ]
  );
};

// Sync to Cloudflare
const syncPuzzles = async (userId: string) => {
  // Get all unsynced records
  const unsynced = db.execute(
    'SELECT * FROM puzzles WHERE synced = 0'
  ).rows;

  if (unsynced.length === 0) return;

  try {
    // Batch sync to Cloudflare Durable Object
    const response = await fetch(`https://api.yourapp.com/sync/${userId}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puzzles: unsynced })
    });

    if (response.ok) {
      // Mark as synced
      const ids = unsynced.map(p => `'${p.id}'`).join(',');
      db.execute(`UPDATE puzzles SET synced = 1 WHERE id IN (${ids})`);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

**Cloudflare Durable Object with SQLite:**
```typescript
export class UserSession {
  state: DurableObjectState;
  sql: SqlStorage; // Durable Object's built-in SQLite

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sql = state.storage.sql;

    // Initialize schema
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS puzzles (
        id TEXT PRIMARY KEY,
        grid_size INTEGER,
        difficulty TEXT,
        cells TEXT,
        completed INTEGER,
        time_spent INTEGER,
        last_modified INTEGER
      )
    `);
  }

  async fetch(request: Request) {
    const { puzzles } = await request.json();

    // Batch insert with conflict resolution
    for (const puzzle of puzzles) {
      const existing = this.sql.exec(
        'SELECT last_modified FROM puzzles WHERE id = ?',
        puzzle.id
      ).one();

      // Last-write-wins conflict resolution
      if (!existing || existing.last_modified < puzzle.last_modified) {
        this.sql.exec(
          `INSERT OR REPLACE INTO puzzles
           (id, grid_size, difficulty, cells, completed, time_spent, last_modified)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          puzzle.id, puzzle.grid_size, puzzle.difficulty,
          puzzle.cells, puzzle.completed ? 1 : 0,
          puzzle.time_spent, puzzle.last_modified
        );
      }
    }

    return new Response('Synced', { status: 200 });
  }
}
```

**Pros:**
- Best SQLite performance on React Native
- Structured data with migrations
- Efficient batch syncing
- Query capabilities (find completed puzzles, filter by difficulty)
- Memory efficient (critical for 14x14+ grids)

**Cons:**
- Manual sync implementation
- Schema migrations need planning
- More complex than MMKV

**Best for:**
- Structured puzzle data (300+ puzzles in library)
- Completion history queries
- Scalable beyond MVP
- Performance-critical operations

---

### Option 3: PowerSync + Cloudflare Workers

**What is PowerSync?**
- Postgres/MongoDB ↔ SQLite bidirectional sync
- Built-in conflict resolution
- React Native SDK with hooks
- Designed for local-first apps

**Architecture Challenge:**
PowerSync is designed for Postgres/MongoDB backends, not Cloudflare Durable Objects. However, you can use **Cloudflare Workers as a sync middleware**:

```typescript
// PowerSync expects Postgres/MongoDB, but we can adapt

// 1. Use Cloudflare D1 (SQLite) as "backend database"
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // PowerSync sync endpoint
    const { last_synced_at } = await request.json();

    // Query D1 for changes since last_synced_at
    const changes = await env.D1.prepare(
      'SELECT * FROM puzzles WHERE updated_at > ?'
    ).bind(last_synced_at).all();

    return new Response(JSON.stringify({
      data: changes.results,
      checkpoint: Date.now()
    }));
  }
}
```

**Pros:**
- Automatic sync (less code to write)
- Built-in conflict resolution strategies
- React Native hooks for live queries
- Handles offline queue automatically

**Cons:**
- Requires Cloudflare D1 (not Durable Objects directly)
- Additional complexity layer
- Backend adapter needed for Cloudflare
- Heavier than custom solution

**Best for:**
- If you want automatic sync without custom code
- If you're comfortable with D1 + Durable Objects hybrid
- Complex conflict resolution needs

**Verdict:** Overcomplicated for Star Battle's needs. Custom op-sqlite sync is simpler and more Cloudflare-native.

---

### Option 4: WatermelonDB + Custom Cloudflare Sync

**What is WatermelonDB?**
- Reactive SQLite database for React Native
- Observable queries (auto-update UI)
- Built-in sync primitives
- Lazy loading for performance

**Architecture:**
```typescript
// WatermelonDB schema
import { appSchema, tableSchema } from '@nozbe/watermelondb';

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'puzzles',
      columns: [
        { name: 'grid_size', type: 'number' },
        { name: 'difficulty', type: 'string' },
        { name: 'cells', type: 'string' },
        { name: 'completed', type: 'boolean' },
        { name: 'time_spent', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true }
      ]
    })
  ]
});

// Sync implementation
import { synchronize } from '@nozbe/watermelondb/sync';

const sync = async () => {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      // Pull from Cloudflare
      const response = await fetch(
        `https://api.yourapp.com/sync/pull?since=${lastPulledAt}`
      );
      const { changes, timestamp } = await response.json();
      return { changes, timestamp };
    },
    pushChanges: async ({ changes }) => {
      // Push to Cloudflare Durable Object
      await fetch('https://api.yourapp.com/sync/push', {
        method: 'POST',
        body: JSON.stringify(changes)
      });
    }
  });
};
```

**Pros:**
- Reactive queries (UI auto-updates)
- Built-in sync primitives (less code)
- Good for complex relational data
- Observable collections

**Cons:**
- Larger bundle size than op-sqlite
- More boilerplate than MMKV
- Sync still requires custom Cloudflare integration
- Learning curve for WatermelonDB patterns

**Best for:**
- Apps with complex data relationships
- Real-time UI updates critical
- Large teams familiar with WatermelonDB

**Verdict:** Good option, but op-sqlite + custom sync is more performant and Cloudflare-native.

---

### Option 5: TinyBase + PowerSync

**What is TinyBase?**
- Reactive data store with CRDT support
- Built-in sync with PowerSync integration
- Lightweight and fast
- React hooks for reactive UI

**Architecture:**
```typescript
import { createStore } from 'tinybase';
import { createPowerSyncPersister } from 'tinybase/persisters/persister-powersync';

const store = createStore();

// PowerSync integration
const persister = createPowerSyncPersister(
  store,
  powerSyncDb, // PowerSync database instance
  'puzzles' // Table name
);

await persister.startAutoLoad();
await persister.startAutoSave();

// Reactive queries
store.setTable('puzzles', {
  'puzzle-1': { gridSize: 10, difficulty: 'normal', completed: false },
  'puzzle-2': { gridSize: 14, difficulty: 'hard', completed: true }
});

// React component auto-updates when data changes
const PuzzleList = () => {
  const puzzles = useTable('puzzles');
  // ...
};
```

**Pros:**
- CRDT support (conflict-free merging)
- Lightweight bundle size
- Reactive by design
- PowerSync integration available

**Cons:**
- Still requires PowerSync (which needs backend adapter)
- Less mature than WatermelonDB/op-sqlite
- Smaller community

**Best for:**
- CRDT-based conflict resolution
- Reactive UI requirements
- Lightweight bundle size priority

**Verdict:** Interesting for CRDT features, but adds complexity. op-sqlite is more straightforward.

---

### Option 6: Automerge/Yjs (CRDT) + Cloudflare Durable Objects

**What are CRDTs?**
- Conflict-Free Replicated Data Types
- Automatic conflict resolution
- P2P sync or server-coordinated
- Perfect for real-time collaboration

**Use Case for Star Battle:**
Real-time multiplayer puzzle racing where multiple players see each other's moves.

**Architecture with Yjs:**
```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Create shared document
const ydoc = new Y.Doc();
const puzzleGrid = ydoc.getArray('grid');

// Connect to Cloudflare Durable Object WebSocket
const wsProvider = new WebsocketProvider(
  'wss://api.yourapp.com/ws/race-session-abc',
  'puzzle',
  ydoc
);

// Update local state
puzzleGrid.insert(0, [{ row: 5, col: 7, value: 'star' }]);

// Automatically syncs to all connected clients via Durable Object

// Listen for remote changes
ydoc.on('update', (update: Uint8Array) => {
  // Update UI with remote player's moves
});
```

**Cloudflare Durable Object with Yjs:**
```typescript
import * as Y from 'yjs';

export class PuzzleRaceSession {
  state: DurableObjectState;
  ydoc: Y.Doc;
  connections: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.ydoc = new Y.Doc();
    this.connections = new Set();

    // Load persisted state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('ydoc-state');
      if (stored) {
        Y.applyUpdate(this.ydoc, stored);
      }
    });

    // Save updates
    this.ydoc.on('update', async (update: Uint8Array) => {
      await this.state.storage.put('ydoc-state', Y.encodeStateAsUpdate(this.ydoc));
    });
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  handleWebSocket(ws: WebSocket) {
    this.connections.add(ws);

    ws.addEventListener('message', (event) => {
      // Yjs update from client
      const update = new Uint8Array(event.data);
      Y.applyUpdate(this.ydoc, update);

      // Broadcast to all other clients
      this.connections.forEach(conn => {
        if (conn !== ws && conn.readyState === WebSocket.OPEN) {
          conn.send(event.data);
        }
      });
    });

    ws.addEventListener('close', () => {
      this.connections.delete(ws);
    });
  }
}
```

**Pros:**
- Perfect for real-time multiplayer features
- Automatic conflict resolution (CRDT magic)
- No manual merge logic needed
- Offline-first by design
- WebSocket integration with Durable Objects

**Cons:**
- High complexity for basic sync
- Larger bundle size (Yjs/Automerge libraries)
- Learning curve for CRDT concepts
- Overkill for single-player puzzle progress

**Best for:**
- Real-time multiplayer puzzle racing
- Collaborative puzzle solving (2+ players on same puzzle)
- Live spectator mode
- When conflict-free merging is critical

**Verdict:** Excellent for Phase 3 multiplayer features, but not needed for basic sync. Use op-sqlite for data persistence, add Yjs/Automerge for real-time race sessions.

---

## 3. Cloudflare Storage Ecosystem

### Storage Options Comparison

| Service | Type | Best For | Sync with Mobile |
|---|---|---|---|
| **Durable Objects** | Stateful objects with SQLite | Coordination, real-time, leaderboards | WebSocket + REST API |
| **D1** | Serverless SQLite | Read-heavy global data | REST API (no real-time) |
| **KV** | Key-value store | CDN-cached metadata | REST API (fast reads) |
| **R2** | Object storage | Puzzle files, images | Pre-signed URLs |

### Recommended Architecture for Star Battle

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   op-sqlite  │  │     MMKV     │  │ Yjs (CRDT)   │     │
│  │  (Puzzles)   │  │  (Settings)  │  │ (Multiplayer)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                    │            │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ↓ Sync            ↓ Sync               ↓ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Workers                         │
│  - Routing layer                                            │
│  - Authentication (Cloudflare Access or custom)             │
│  - Rate limiting                                            │
└─────────────────────────────────────────────────────────────┘
          │                 │                    │
          ↓                 ↓                    ↓
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Durable Object:  │ │ Durable Object│ │ Durable Object:  │
│  User Session    │ │ Daily Puzzle  │ │  Race Session    │
│                  │ │               │ │                  │
│ - Puzzle progress│ │ - Leaderboard │ │ - Live players   │
│ - Settings       │ │ - Stats       │ │ - Grid state     │
│ - Sync queue     │ │ - Broadcast   │ │ - CRDT doc       │
└──────────────────┘ └──────────────┘ └──────────────────┘
          │                 │
          ↓                 ↓
┌──────────────────┐ ┌──────────────┐
│  Cloudflare D1   │ │ Cloudflare R2│
│  (Archive)       │ │ (Puzzles)    │
│                  │ │              │
│ - Historical data│ │ - Puzzle JSON│
│ - Analytics      │ │ - Images     │
└──────────────────┘ └──────────────┘
```

### Data Flow Examples

#### Daily Puzzle Distribution
```
1. User opens app
   ↓
2. React Native → Cloudflare Workers → Durable Object "daily-puzzle"
   ↓
3. Durable Object checks KV for today's puzzle ID
   ↓
4. Returns puzzle metadata + R2 URL for full puzzle JSON
   ↓
5. React Native downloads from R2, caches in op-sqlite
   ↓
6. User solves offline
   ↓
7. On completion: Sync to Durable Object → Update leaderboard
```

#### Real-Time Leaderboard
```
1. User completes daily puzzle in 3m 42s
   ↓
2. React Native → POST to Cloudflare Workers
   ↓
3. Worker → Durable Object "daily-puzzle-leaderboard"
   ↓
4. Durable Object:
   - Validates completion (anti-cheat)
   - Inserts into SQLite leaderboard table
   - Broadcasts update via WebSocket to all connected clients
   ↓
5. All users viewing leaderboard see update in real-time
```

#### Multiplayer Race Session
```
1. User creates race session
   ↓
2. React Native → Cloudflare Workers → New Durable Object "race-abc123"
   ↓
3. Durable Object:
   - Generates session code
   - Initializes Yjs CRDT document
   - Returns WebSocket URL
   ↓
4. Players join via session code
   ↓
5. All players connect WebSocket to same Durable Object
   ↓
6. Player places star at (5, 7):
   - Yjs update sent to Durable Object
   - Durable Object broadcasts to all players
   - UI updates in real-time
   ↓
7. First player to complete wins
   - Durable Object declares winner
   - All players see completion notification
```

---

## 4. Offline-First + Cloudflare Sync Patterns

### Pattern 1: Optimistic UI with Background Sync

**Client:**
```typescript
const placeStar = async (row: number, col: number) => {
  // 1. Update local state immediately (optimistic)
  const newGrid = updateGrid(grid, row, col, 'star');
  setGrid(newGrid);

  // 2. Save to local database
  db.execute(
    'UPDATE puzzles SET cells = ?, synced = 0 WHERE id = ?',
    [JSON.stringify(newGrid), currentPuzzleId]
  );

  // 3. Queue sync in background (non-blocking)
  queueSync(currentPuzzleId);
};

const queueSync = (puzzleId: string) => {
  // Use react-native-background-fetch or similar
  BackgroundFetch.scheduleTask({
    taskId: `sync-${puzzleId}`,
    delay: 1000, // 1 second delay
    periodic: false,
    callback: () => syncPuzzle(puzzleId)
  });
};
```

**Benefits:**
- Instant UI response
- User never waits for network
- Syncs in background when online

### Pattern 2: Last-Write-Wins Conflict Resolution

**Client:**
```typescript
const syncPuzzle = async (puzzleId: string) => {
  const local = db.execute(
    'SELECT cells, last_modified FROM puzzles WHERE id = ?',
    [puzzleId]
  ).rows[0];

  const response = await fetch(`https://api.yourapp.com/puzzles/${puzzleId}`, {
    method: 'PUT',
    body: JSON.stringify({
      cells: local.cells,
      timestamp: local.last_modified
    })
  });

  if (response.status === 409) {
    // Server has newer version
    const serverData = await response.json();
    if (serverData.timestamp > local.last_modified) {
      // Accept server version
      db.execute(
        'UPDATE puzzles SET cells = ?, last_modified = ?, synced = 1 WHERE id = ?',
        [serverData.cells, serverData.timestamp, puzzleId]
      );
    }
  } else if (response.ok) {
    // Mark as synced
    db.execute('UPDATE puzzles SET synced = 1 WHERE id = ?', [puzzleId]);
  }
};
```

**Server (Durable Object):**
```typescript
async handlePuzzleUpdate(puzzleId: string, cells: string, timestamp: number) {
  const existing = await this.sql.exec(
    'SELECT last_modified FROM puzzles WHERE id = ?',
    puzzleId
  ).one();

  if (existing && existing.last_modified > timestamp) {
    // Server is newer
    return new Response(JSON.stringify({
      cells: existing.cells,
      timestamp: existing.last_modified
    }), { status: 409 });
  }

  // Client is newer or same
  await this.sql.exec(
    'INSERT OR REPLACE INTO puzzles (id, cells, last_modified) VALUES (?, ?, ?)',
    puzzleId, cells, timestamp
  );

  return new Response('OK', { status: 200 });
}
```

### Pattern 3: CRDT-Based Conflict-Free Sync

**For multiplayer race sessions (no conflicts ever):**
```typescript
// Client uses Yjs
const placeStar = (row: number, col: number) => {
  const gridArray = ydoc.getArray('grid');

  // CRDT operation (conflict-free)
  gridArray.push([{ row, col, value: 'star', userId: currentUserId }]);

  // Yjs automatically syncs via WebSocket to Durable Object
  // All clients receive update and merge automatically
};
```

**Benefits:**
- Zero conflicts (CRDT guarantees)
- Works offline + online seamlessly
- Perfect for collaborative features

### Pattern 4: Batch Sync with Delta Updates

**Reduce network requests:**
```typescript
const syncAll = async () => {
  const unsynced = db.execute(
    'SELECT * FROM puzzles WHERE synced = 0'
  ).rows;

  if (unsynced.length === 0) return;

  // Batch sync
  const response = await fetch('https://api.yourapp.com/sync/batch', {
    method: 'POST',
    body: JSON.stringify({ puzzles: unsynced })
  });

  if (response.ok) {
    const ids = unsynced.map(p => p.id);
    db.execute(
      `UPDATE puzzles SET synced = 1 WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
  }
};

// Sync on app state change
AppState.addEventListener('change', (nextState) => {
  if (nextState === 'background') {
    syncAll(); // Sync before backgrounding
  }
});
```

---

## 5. Migration Path: MMKV → op-sqlite → Cloudflare

### Phase 1: MVP (Weeks 1-4)

**Storage:** MMKV
**Features:**
- Offline puzzle solving
- Local settings
- Completion tracking

**Code:**
```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// Simple key-value storage
storage.set('current-puzzle', JSON.stringify(puzzleState));
storage.set('settings', JSON.stringify(userSettings));
storage.set('completions', JSON.stringify(completionHistory));
```

**No cloud sync yet.** Fully offline.

---

### Phase 2: Cloud Sync (Weeks 5-8)

**Migration:** MMKV → op-sqlite
**Added:** Cloudflare Workers + Durable Objects

**Migration Script:**
```typescript
import { open } from '@op-engineering/op-sqlite';
import { MMKV } from 'react-native-mmkv';

const migrateMmkvToSqlite = () => {
  const storage = new MMKV();
  const db = open({ name: 'starBattle.db' });

  // Create tables
  db.execute(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id TEXT PRIMARY KEY,
      cells TEXT,
      completed INTEGER,
      time_spent INTEGER,
      last_modified INTEGER,
      synced INTEGER DEFAULT 0
    )
  `);

  // Migrate current puzzle
  const currentPuzzle = storage.getString('current-puzzle');
  if (currentPuzzle) {
    const puzzle = JSON.parse(currentPuzzle);
    db.execute(
      'INSERT OR REPLACE INTO puzzles (id, cells, completed, time_spent, last_modified) VALUES (?, ?, ?, ?, ?)',
      ['current', currentPuzzle, 0, 0, Date.now()]
    );
  }

  // Migrate completions
  const completions = storage.getString('completions');
  if (completions) {
    const parsed = JSON.parse(completions);
    parsed.forEach((c: any) => {
      db.execute(
        'INSERT OR REPLACE INTO puzzles (id, cells, completed, time_spent, last_modified) VALUES (?, ?, ?, ?, ?)',
        [c.id, '{}', 1, c.timeSpent, c.completedAt]
      );
    });
  }

  // Mark migration complete
  storage.set('migrated-to-sqlite', true);
};

// Run once on app launch
if (!storage.getBoolean('migrated-to-sqlite')) {
  migrateMmkvToSqlite();
}
```

**New Features:**
- Cross-device sync (start on iPhone, finish on iPad)
- Cloud backup of progress
- Daily puzzle leaderboards

**Cloudflare Setup:**
```bash
# wrangler.toml
name = "star-battle-api"
compatibility_date = "2025-12-11"

[[durable_objects.bindings]]
name = "USER_SESSIONS"
class_name = "UserSession"
script_name = "star-battle-api"

[[durable_objects.bindings]]
name = "DAILY_PUZZLES"
class_name = "DailyPuzzle"
script_name = "star-battle-api"
```

---

### Phase 3: Real-Time Multiplayer (Weeks 9-12)

**Added:** Yjs (CRDT) for race sessions

**Installation:**
```bash
npm install yjs y-websocket
```

**Race Session Component:**
```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const MultiplayerRace = ({ sessionId }: { sessionId: string }) => {
  const [ydoc] = useState(() => new Y.Doc());
  const [gridArray, setGridArray] = useState<Y.Array<any>>();

  useEffect(() => {
    const grid = ydoc.getArray('grid');
    setGridArray(grid);

    // Connect to Cloudflare Durable Object WebSocket
    const wsProvider = new WebsocketProvider(
      `wss://api.yourapp.com/race/${sessionId}`,
      'puzzle',
      ydoc
    );

    // Listen for updates
    grid.observe(() => {
      // Re-render grid when remote players make moves
      forceUpdate();
    });

    return () => {
      wsProvider.destroy();
    };
  }, [sessionId]);

  const placeStar = (row: number, col: number) => {
    gridArray?.push([{
      row,
      col,
      value: 'star',
      userId: currentUserId,
      timestamp: Date.now()
    }]);
    // Automatically syncs to all players
  };

  return <PuzzleGrid grid={gridArray?.toArray() || []} onCellPress={placeStar} />;
};
```

**New Features:**
- Real-time multiplayer puzzle racing (2-4 players)
- Live leaderboard updates
- Spectator mode
- Global daily puzzle stats

---

## 6. Architecture Recommendations

### Recommended Stack

**Phase 1 (MVP):**
```
Client:
- MMKV (simple, fast)
- No cloud sync

Backend:
- None (fully offline)
```

**Phase 2 (Cloud Sync):**
```
Client:
- op-sqlite (structured data, best performance)
- Custom sync layer
- Background sync jobs

Backend:
- Cloudflare Workers (routing, auth)
- Durable Objects (user sessions, daily puzzles)
- R2 (puzzle storage)
- KV (metadata cache)
```

**Phase 3 (Multiplayer):**
```
Client:
- op-sqlite (persistence)
- Yjs (real-time collaboration)
- WebSocket connections

Backend:
- Cloudflare Workers
- Durable Objects (race sessions with Yjs)
- Durable Objects (leaderboards with SQLite)
- R2 (puzzle storage)
```

### Cost Estimates (Cloudflare)

**Free Tier (sufficient for MVP launch):**
- Durable Objects: 1M requests/month
- Workers: 100k requests/day
- R2: 10 GB storage
- KV: 100k reads/day

**Paid Tier (at scale - 10k DAU):**
- Durable Objects: ~$5-10/month
- Workers: ~$5/month
- R2: ~$1/month (puzzle storage)
- D1: Free tier sufficient
- **Total: ~$10-15/month**

Compare to:
- Firebase: ~$50-100/month for similar usage
- Supabase: ~$25/month
- AWS: ~$30-50/month

**Cloudflare is 3-5x cheaper** for this use case.

---

## 7. Code Examples: Complete Architecture

### Client: op-sqlite Setup

```typescript
// src/storage/database.ts
import { open } from '@op-engineering/op-sqlite';

export const db = open({ name: 'starBattle.db' });

// Initialize schema
db.execute(`
  CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    grid_size INTEGER,
    difficulty TEXT,
    cells TEXT,
    completed INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    last_modified INTEGER,
    synced INTEGER DEFAULT 0
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    last_modified INTEGER,
    synced INTEGER DEFAULT 0
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS completions (
    puzzle_id TEXT PRIMARY KEY,
    completed_at INTEGER,
    time_spent INTEGER,
    synced INTEGER DEFAULT 0
  )
`);

// Create indexes for performance
db.execute('CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty ON puzzles(difficulty)');
db.execute('CREATE INDEX IF NOT EXISTS idx_puzzles_completed ON puzzles(completed)');
db.execute('CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completed_at)');
```

### Client: Sync Service

```typescript
// src/storage/syncService.ts
import { db } from './database';

export const SyncService = {
  // Mark record as dirty (needs sync)
  markDirty: (table: string, id: string) => {
    db.execute(
      `UPDATE ${table} SET synced = 0, last_modified = ? WHERE id = ?`,
      [Date.now(), id]
    );
  },

  // Get all unsynced records
  getUnsynced: (table: string) => {
    return db.execute(
      `SELECT * FROM ${table} WHERE synced = 0`
    ).rows;
  },

  // Sync to Cloudflare
  syncAll: async (userId: string) => {
    const unsynced = {
      puzzles: SyncService.getUnsynced('puzzles'),
      settings: SyncService.getUnsynced('user_settings'),
      completions: SyncService.getUnsynced('completions')
    };

    try {
      const response = await fetch(`https://api.yourapp.com/sync/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(unsynced)
      });

      if (response.ok) {
        // Mark all as synced
        unsynced.puzzles.forEach(p => {
          db.execute('UPDATE puzzles SET synced = 1 WHERE id = ?', [p.id]);
        });
        unsynced.settings.forEach(s => {
          db.execute('UPDATE user_settings SET synced = 1 WHERE key = ?', [s.key]);
        });
        unsynced.completions.forEach(c => {
          db.execute('UPDATE completions SET synced = 1 WHERE puzzle_id = ?', [c.puzzle_id]);
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error };
    }
  },

  // Pull from Cloudflare
  pullFromServer: async (userId: string) => {
    try {
      const response = await fetch(`https://api.yourapp.com/sync/${userId}/pull`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      const data = await response.json();

      // Merge server data (last-write-wins)
      data.puzzles?.forEach((p: any) => {
        const local = db.execute(
          'SELECT last_modified FROM puzzles WHERE id = ?',
          [p.id]
        ).rows[0];

        if (!local || local.last_modified < p.last_modified) {
          db.execute(
            `INSERT OR REPLACE INTO puzzles
             (id, grid_size, difficulty, cells, completed, time_spent, last_modified, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [p.id, p.grid_size, p.difficulty, p.cells, p.completed, p.time_spent, p.last_modified]
          );
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Pull failed:', error);
      return { success: false, error };
    }
  }
};

// Background sync on app state change
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextState) => {
  if (nextState === 'background') {
    // Sync before app backgrounds
    SyncService.syncAll(currentUserId);
  } else if (nextState === 'active') {
    // Pull latest on app foreground
    SyncService.pullFromServer(currentUserId);
  }
});
```

### Cloudflare Workers: API Router

```typescript
// src/index.ts
export interface Env {
  USER_SESSIONS: DurableObjectNamespace;
  DAILY_PUZZLES: DurableObjectNamespace;
  RACE_SESSIONS: DurableObjectNamespace;
  PUZZLES_R2: R2Bucket;
  PUZZLES_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Auth middleware (simplified)
    const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken && !url.pathname.startsWith('/public')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Route to appropriate Durable Object
    if (url.pathname.startsWith('/sync/')) {
      const userId = url.pathname.split('/')[2];
      const id = env.USER_SESSIONS.idFromName(userId);
      const stub = env.USER_SESSIONS.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/daily/')) {
      const date = url.pathname.split('/')[2] || new Date().toISOString().split('T')[0];
      const id = env.DAILY_PUZZLES.idFromName(date);
      const stub = env.DAILY_PUZZLES.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/race/')) {
      const sessionId = url.pathname.split('/')[2];
      const id = env.RACE_SESSIONS.idFromName(sessionId);
      const stub = env.RACE_SESSIONS.get(id);
      return stub.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

### Cloudflare Durable Object: User Session

```typescript
// src/durableObjects/UserSession.ts
export class UserSession {
  state: DurableObjectState;
  sql: SqlStorage;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sql = state.storage.sql;

    // Initialize schema
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS puzzles (
        id TEXT PRIMARY KEY,
        grid_size INTEGER,
        difficulty TEXT,
        cells TEXT,
        completed INTEGER,
        time_spent INTEGER,
        last_modified INTEGER
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        last_modified INTEGER
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /sync/:userId - Push from client
    if (request.method === 'POST' && url.pathname.endsWith('/sync')) {
      return this.handlePush(request);
    }

    // GET /sync/:userId/pull - Pull to client
    if (request.method === 'GET' && url.pathname.endsWith('/pull')) {
      return this.handlePull();
    }

    return new Response('Not Found', { status: 404 });
  }

  async handlePush(request: Request): Promise<Response> {
    const { puzzles, settings, completions } = await request.json();

    // Merge puzzles (last-write-wins)
    for (const puzzle of puzzles || []) {
      const existing = this.sql.exec(
        'SELECT last_modified FROM puzzles WHERE id = ?',
        puzzle.id
      ).one();

      if (!existing || existing.last_modified < puzzle.last_modified) {
        this.sql.exec(
          `INSERT OR REPLACE INTO puzzles
           (id, grid_size, difficulty, cells, completed, time_spent, last_modified)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          puzzle.id,
          puzzle.grid_size,
          puzzle.difficulty,
          puzzle.cells,
          puzzle.completed,
          puzzle.time_spent,
          puzzle.last_modified
        );
      }
    }

    // Merge settings
    for (const setting of settings || []) {
      const existing = this.sql.exec(
        'SELECT last_modified FROM user_settings WHERE key = ?',
        setting.key
      ).one();

      if (!existing || existing.last_modified < setting.last_modified) {
        this.sql.exec(
          'INSERT OR REPLACE INTO user_settings (key, value, last_modified) VALUES (?, ?, ?)',
          setting.key,
          setting.value,
          setting.last_modified
        );
      }
    }

    return new Response('Synced', { status: 200 });
  }

  async handlePull(): Promise<Response> {
    const puzzles = this.sql.exec('SELECT * FROM puzzles').toArray();
    const settings = this.sql.exec('SELECT * FROM user_settings').toArray();

    return new Response(JSON.stringify({ puzzles, settings }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Cloudflare Durable Object: Daily Puzzle Leaderboard

```typescript
// src/durableObjects/DailyPuzzle.ts
export class DailyPuzzle {
  state: DurableObjectState;
  sql: SqlStorage;
  connections: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sql = state.storage.sql;
    this.connections = new Set();

    // Leaderboard schema
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        user_id TEXT PRIMARY KEY,
        time_spent INTEGER,
        completed_at INTEGER,
        username TEXT
      )
    `);

    this.sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_time
      ON leaderboard(time_spent)
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket for live leaderboard
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // POST completion
    if (request.method === 'POST' && url.pathname.endsWith('/complete')) {
      return this.handleCompletion(request);
    }

    // GET leaderboard
    if (request.method === 'GET' && url.pathname.endsWith('/leaderboard')) {
      return this.getLeaderboard();
    }

    return new Response('Not Found', { status: 404 });
  }

  async handleCompletion(request: Request): Promise<Response> {
    const { userId, timeSpent, username } = await request.json();

    // Insert into leaderboard
    this.sql.exec(
      `INSERT OR REPLACE INTO leaderboard
       (user_id, time_spent, completed_at, username)
       VALUES (?, ?, ?, ?)`,
      userId,
      timeSpent,
      Date.now(),
      username
    );

    // Get user's rank
    const rank = this.sql.exec(
      `SELECT COUNT(*) + 1 as rank
       FROM leaderboard
       WHERE time_spent < ?`,
      timeSpent
    ).one()?.rank || 1;

    // Broadcast update to all connected clients
    this.broadcast({
      type: 'completion',
      userId,
      username,
      timeSpent,
      rank
    });

    return new Response(JSON.stringify({ rank }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getLeaderboard(): Promise<Response> {
    const top100 = this.sql.exec(
      'SELECT user_id, username, time_spent FROM leaderboard ORDER BY time_spent LIMIT 100'
    ).toArray();

    return new Response(JSON.stringify(top100), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  handleWebSocket(ws: WebSocket) {
    this.connections.add(ws);

    // Send current leaderboard on connect
    const leaderboard = this.sql.exec(
      'SELECT user_id, username, time_spent FROM leaderboard ORDER BY time_spent LIMIT 100'
    ).toArray();

    ws.send(JSON.stringify({ type: 'leaderboard', data: leaderboard }));

    ws.addEventListener('close', () => {
      this.connections.delete(ws);
    });
  }

  broadcast(message: any) {
    const payload = JSON.stringify(message);
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}
```

---

## 8. Performance & Bundle Size Analysis

### Client-Side Bundle Sizes

| Package | Size | Impact |
|---|---|---|
| **MMKV** | ~200 KB | Minimal |
| **op-sqlite** | ~250 KB | Minimal |
| **PowerSync** | ~1-2 MB | Moderate |
| **WatermelonDB** | ~500 KB | Small |
| **TinyBase** | ~100 KB | Minimal |
| **Yjs** | ~50 KB | Minimal |
| **Automerge** | ~200 KB | Minimal |

**Recommended Stack Total:**
- MMKV: 200 KB
- op-sqlite: 250 KB
- Yjs: 50 KB
- **Total: ~500 KB** (negligible for mobile app)

### Performance Benchmarks

**op-sqlite (React Native):**
- Read 1000 records: ~20ms
- Write 1000 records: ~50ms
- Query with index: ~5ms
- Memory usage: ~10 MB for 10k records

**MMKV (React Native):**
- Read: 0.5ms
- Write: 0.6ms
- Memory: Minimal (mmap)

**Cloudflare Durable Objects:**
- Cold start: ~50ms
- WebSocket latency: <100ms (global edge)
- SQLite query: <10ms

**Total Round Trip (React Native → Durable Object):**
- REST API: 100-300ms (depending on location)
- WebSocket: 50-150ms (real-time)

---

## 9. Migration Checklist

### Phase 1 → Phase 2 Migration

**Pre-Migration:**
- [ ] Implement op-sqlite schema
- [ ] Create migration script from MMKV
- [ ] Test migration on test devices
- [ ] Deploy Cloudflare Workers + Durable Objects
- [ ] Create sync endpoints

**Migration:**
- [ ] App update with migration code
- [ ] Run migration on first launch
- [ ] Verify data integrity
- [ ] Enable cloud sync

**Post-Migration:**
- [ ] Monitor error rates
- [ ] Track sync success rates
- [ ] Optimize sync intervals

### Phase 2 → Phase 3 Migration

**Pre-Migration:**
- [ ] Install Yjs dependencies
- [ ] Deploy race session Durable Objects
- [ ] Create WebSocket endpoints
- [ ] Implement race UI

**Migration:**
- [ ] App update with multiplayer code
- [ ] A/B test multiplayer features
- [ ] Monitor WebSocket connection stability

---

## 10. Final Recommendation

### Start Simple, Scale to Cloudflare

**Phase 1 (Weeks 1-4): MVP with MMKV**
```
Focus: Ship fast
Storage: MMKV (offline-only)
Features: Single-player, offline puzzles
Time: 4 weeks
```

**Phase 2 (Weeks 5-8): Cloud Sync with op-sqlite**
```
Focus: Cross-device sync
Storage: op-sqlite + Cloudflare Durable Objects
Features: Settings sync, progress sync, daily puzzle leaderboards
Time: 4 weeks
```

**Phase 3 (Weeks 9-12): Multiplayer with Yjs**
```
Focus: Real-time features
Storage: op-sqlite + Yjs CRDT + Durable Objects
Features: Multiplayer racing, live leaderboards, spectator mode
Time: 4 weeks
```

### Why This Path?

1. **Start Simple**: MMKV is fastest to implement, zero backend needed
2. **Migrate Thoughtfully**: op-sqlite provides structure when cloud sync is needed
3. **Cloudflare-Native**: Durable Objects are perfect for coordination and real-time
4. **Future-Proof**: Can add CRDTs (Yjs) for advanced multiplayer without rewrite
5. **Cost-Effective**: Cloudflare is 3-5x cheaper than Firebase/Supabase
6. **Performance**: op-sqlite (5-8x faster) + Durable Objects (edge-native) = best UX

### Alternative Paths (NOT Recommended)

**Path A: PowerSync from Day 1**
- ❌ Overkill for MVP
- ❌ Requires backend setup immediately
- ❌ Adds complexity before validating product

**Path B: WatermelonDB + Custom Sync**
- ⚠️ Good option, but op-sqlite is faster
- ⚠️ More boilerplate than needed

**Path C: Automerge Everywhere**
- ❌ Too complex for single-player puzzles
- ❌ Larger bundle size
- ✅ Only use for multiplayer features

---

## 11. Resources & References

### Cloudflare Documentation
- [Durable Objects Overview](https://developers.cloudflare.com/durable-objects/)
- [WebSockets with Durable Objects](https://developers.cloudflare.com/durable-objects/examples/websocket-server/)
- [Durable Objects SQLite](https://blog.cloudflare.com/sqlite-in-durable-objects/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Storage](https://developers.cloudflare.com/r2/)

### React Native Libraries
- [op-sqlite](https://github.com/OP-Engineering/op-sqlite)
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)
- [PowerSync](https://www.powersync.com/)
- [WatermelonDB](https://github.com/Nozbe/WatermelonDB)
- [TinyBase](https://tinybase.org/)

### CRDT Libraries
- [Yjs](https://github.com/yjs/yjs)
- [Automerge](https://automerge.org/)
- [y-websocket](https://github.com/yjs/y-websocket)

### Local-First Architecture
- [Local-First Software](https://www.inkandswitch.com/local-first/)
- [Offline-First Design Patterns](https://hasura.io/blog/design-guide-to-offline-first-apps)
- [PowerSync Backend Integrations](https://docs.powersync.com/integration-guides/integrations-overview)

---

## Appendix: Data Model Examples

### Puzzle Data Structure

```typescript
interface Puzzle {
  id: string; // "daily-2025-12-11" or "library-1star-001"
  gridSize: number; // 5, 6, 8, 10, 14, 17, 21, 25
  difficulty: 'normal' | 'hard';
  stars: number; // 1-6
  regions: Region[]; // Grid regions (for shapeless variant)
  solution: Cell[]; // Pre-computed solution (for validation)
  metadata: {
    category: 'daily' | 'weekly' | 'monthly' | 'library';
    createdAt: number;
    difficulty_rating: number; // Algorithmic difficulty score
  };
}

interface Cell {
  row: number;
  col: number;
  value: 'empty' | 'star' | 'x' | null;
  region?: number; // For shapeless variant
}

interface Region {
  id: number;
  cells: { row: number; col: number }[];
}
```

### User Progress Structure

```typescript
interface UserProgress {
  userId: string;
  puzzles: {
    [puzzleId: string]: {
      cells: Cell[];
      completed: boolean;
      timeSpent: number; // seconds
      startedAt: number;
      completedAt?: number;
      lastModified: number;
    };
  };
  settings: {
    theme: 'light' | 'dark';
    autoPlaceX: boolean;
    highlightErrors: boolean;
    highlightCurrentRegion: boolean;
    coloredBlocks: boolean;
  };
  stats: {
    daily_streak: number;
    weekly_completed: number;
    monthly_completed: number;
    total_completed: number;
    total_time_spent: number;
    best_times: {
      [gridSize: string]: number;
    };
  };
}
```

### Leaderboard Structure

```typescript
interface LeaderboardEntry {
  userId: string;
  username: string;
  timeSpent: number; // seconds
  completedAt: number;
  rank?: number; // Computed
}

interface DailyPuzzleLeaderboard {
  date: string; // "2025-12-11"
  puzzleId: string;
  entries: LeaderboardEntry[];
  totalCompletions: number;
  averageTime: number;
}
```

---

**Document Version:** 1.0
**Last Updated:** December 11, 2025
**Research Conducted For:** Star Battle Mobile App (React Native, Cloudflare-First Architecture)
