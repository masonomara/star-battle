# Puzzle Delivery

R2 storage, SBN format, pack files, caching, and fetch strategy.

---

## Decision: Server-Side with Local Caching

Puzzles are stored in R2 and fetched on demand. Client caches locally for offline play.

**Rationale:**

- Hotfix bugs without app update
- Gate paid packs server-side after purchase verification
- A/B test different puzzle sets
- Track puzzle download analytics
- Add new packs without app release

---

## R2 Storage Structure

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

---

## SBN Format Reference

```text
Format: {size}x{stars}.{regions}.{metadata}

Example: 10x2.AABBCCDDEE...s42d7l4c12

Metadata keys:
  s{int} - seed
  d{int} - difficulty (1-10)
  l{int} - maxLevel (highest rule used)
  c{int} - cycles (solver iterations)
```

---

## Size Estimates

| Grid                   | Bytes |
| ---------------------- | ----- |
| 5×5 (1-star)           | ~40   |
| 10×10 (2-star)         | ~115  |
| 14×14 (3-star)         | ~210  |
| 17×17 (4-star daily)   | ~305  |
| 21×21 (5-star weekly)  | ~455  |
| 25×25 (6-star monthly) | ~640  |

**Per pack:** 60 puzzles × ~150 bytes avg = ~9KB per pack JSON

---

## Pack File Format

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

---

## Puzzle ID Strategy

Stable, human-readable IDs used in both API requests and progress storage:

| Type    | Format                | Example              |
| ------- | --------------------- | -------------------- |
| Library | `{pack}:{index}`      | `"1star-5x5:12"`     |
| Daily   | `daily:{YYYY-MM-DD}`  | `"daily:2025-01-30"` |
| Weekly  | `weekly:{YYYY}-{WW}`  | `"weekly:2025-05"`   |
| Monthly | `monthly:{YYYY}-{MM}` | `"monthly:2025-01"`  |

---

## Fetch Strategy

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

---

## Client Caching

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

### Cache Behavior

| Scenario         | Behavior                                 |
| ---------------- | ---------------------------------------- |
| Pack cached      | Persists indefinitely                    |
| App update       | Cache preserved                          |
| Bug fix needed   | Manual cache clear via settings          |
| Storage pressure | User can clear individual packs (future) |
