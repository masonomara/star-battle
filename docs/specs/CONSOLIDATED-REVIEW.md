# Consolidated Spec Review: Star Battle Mobile App

**State of the project:** The solver engine (`src/sieve/`) is mature -- 38 rules across 11 levels, Dinic's max-flow, DLX tiling, 999/1000 solve rate. Everything else (React Native app, Cloudflare Worker, D1, R2, auth, sync, IAP, ads) exists only in specs. The gap is ~5% built, ~95% specced.

---

## Resolved Items

Items addressed since the initial review:

| # | Item | Resolution |
|---|------|-----------|
| 2 | Krazydad content licensing | `KD_TNT_` removed from puzzle IDs (now `SB_`). Krazydad credited in README. Puzzles are self-generated. |
| 3 | JWT auth unspecced | BetterAuth handles sessions (cookie-based, not JWT). Fully specced in `GEN-auth-sync.md` + `GEN-docket-auth-reference.md`. |
| 4 | No password hashing plan | BetterAuth + PBKDF2-SHA256 (100k iterations). Specced in Docket reference. |
| 6 | No rate limiting on auth | Anonymous users are local-only (no `POST /auth/anon`). BetterAuth handles session management. Cloudflare rate limiting available for auth endpoints. |
| 16 | Auth solves a problem that doesn't exist | Anonymous is now purely local. No server record until user creates an account. |
| 22 | RevenueCat webhook unspecced | HMAC-SHA256 verification via `X-RevenueCat-Signature` header. Code in `GEN-api.md`. |
| 23 | No password reset or email verification | BetterAuth handles both natively. Resend for emails. Specced in Docket reference. |
| 26 | First launch offline = zero content | Decided: bundle puzzles in app binary (~54KB). No R2 dependency for v1. |
| 8 | Solver performance on mobile | Hints are pre-computed at build time and stored as puzzle metadata. Solver never runs on device. Hermes benchmark unnecessary. |
| 9 | Hint system requires solver refactor | Hints are pre-computed metadata bundled with puzzles. No runtime solver needed, no refactor needed. |

---

## Recommended Build Order

All remaining findings integrated into the phase where they must be addressed.

### Phase 0: Before Writing App Code

Housekeeping and gate decisions. No app code yet.

| Do | Addresses |
|----|-----------|
| **Make repo buildable from clean clone** -- Un-gitignore `package.json` and `tsconfig.json`. A fresh clone must `npm install && npm test`. | #12 Repo not buildable |
| **Fix stale level numbering comments** in `src/sieve/rules/index.ts`. Comments say L1-L10, actual values are 1-11. | #14 Stale comments |
| **Fix difficulty range mismatch** -- SBN metadata says `d{int}` is 1-10 but formula produces 1-50+. Normalize or update spec. Needed before curating packs. | #13 Difficulty range |
| **Delete `GEN-information-architecture.md`** -- It's a 744-line duplicate of the other five GEN docs. Keep the per-topic files as source of truth. | #10 Spec duplication |
| **Write pack generation script** -- Curate 1000-puzzle corpus into packs with difficulty curves. Output bundled JSON assets. Include pre-computed hints as puzzle metadata. | #28 No content pipeline (partial), #9 (resolved via metadata) |

### Phase 1: Playable Game (no backend)

Local-only. No server, no auth, no sync.

| Build | Addresses |
|-------|-----------|
| React Native scaffold | -- |
| Board renderer (grid + regions + stars + marks) | -- |
| Tap-to-cycle input with haptics | -- |
| **Bundled puzzle packs as JSON assets (with pre-computed hints)** | #15 Deferred infrastructure, #26 First launch offline (resolved), #9 Hints via metadata |
| Puzzle selection screen | -- |
| Win detection + feedback | -- |
| Undo button | -- |
| **Hint button (free, unlimited) -- reads pre-computed hints from puzzle metadata** | #18 Hint monetization complexity (deferred -- free for now) |
| Auto-x toggle | -- |
| Light/dark theme (system default) | -- |
| Timer | -- |
| **MMKV for local puzzle progress with write-error handling** | #30 No error recovery for corrupted local state |

**Not needed in Phase 1:** auth, sync, server, purchases, ads, streaks, sequential unlocking (#19)

### Phase 2: Retention Hooks

Still local-only. Adds habit formation. Ads require compliance docs.

| Build | Addresses |
|-------|-----------|
| **Daily puzzle generation pipeline** -- Pre-generate and validate all dailies. Every daily must be solver-verified solvable before bundling/serving. | #25 Broken daily + strict streaks, #28 Content pipeline |
| Daily streak (local, UTC) | -- |
| Pack progression tracking (local) | -- |
| **Hint templates for all 38 rules** -- Pre-computed at build time, bundled in puzzle metadata | #9 (completion) |
| Error highlighting toggle | -- |
| **Privacy policy** -- Must exist before ads or app store submission. Cover: local data stored, no server collection in Phase 1-2, COPPA stance, future plans for cloud sync. | #1 No privacy policy, #20 COPPA exposure |
| **COPPA decision** -- Either age-gate, configure ad SDKs for mixed audiences, or declare 13+ in app store listing. Must decide before ad integration. | #20 COPPA exposure |
| Banner ads (AdMob) -- only after privacy policy + COPPA decision | -- |

### Phase 3: Monetization

IAP requires terms of service. Hint monetization decisions.

| Build | Addresses |
|-------|-----------|
| **Terms of service** -- Required before IAP goes live. Cover: limitation of liability, dispute resolution, content ownership, refund policy (defer to app stores). | #21 No terms of service |
| Remove ads IAP | -- |
| RevenueCat integration (client-side receipt validation) | -- |
| **Hint monetization decision** -- If monetizing hints: server-authoritative hint count when cloud is added (Phase 4). For now, local-only hints are trivially bypassable. Accept this for Phase 3 or keep hints free. | #7 Client-authoritative hint count, #18 Four hint states |
| Unlock all puzzles IAP (only if sequential locking added) | #19 Sequential unlocking (optional) |

### Phase 4: Cloud (only if retention proves value)

BetterAuth + Cloudflare Workers + D1 + R2. This is where most remaining items land.

| Build | Addresses |
|-------|-----------|
| **Cloudflare Worker + D1 schema** -- Auth tables (BetterAuth) + app tables (progress, settings, purchases). Include `DELETE /account` endpoint from day one. | #5 No account deletion endpoint |
| **BetterAuth integration** (per `GEN-docket-auth-reference.md`) -- Factory pattern, PBKDF2, cookie sessions, Google + Apple social, Resend emails | Resolved items 3, 4, 6, 22, 23 |
| **Shared types package** -- Single `.ts` source of truth for UserSettings, PuzzleProgress, SyncPayload, etc. Used by both Worker and app. | #11 No shared type definitions |
| **Cloud sync with known limitations** -- Last-write-wins with client timestamps. Document that clock skew can cause overwrites. Acceptable for puzzle progress. Revisit with server timestamps if issues arise. | #24 Sync conflicts / silent data loss |
| **Offline queue with size cap** -- Max N pending changes in MMKV. Oldest entries pruned when cap exceeded. | #29 Offline queue unbounded |
| **Server-authoritative hint count** -- Reject sync payloads where `hints_remaining` increased without a purchase event. | #7 Client-authoritative hint count |
| R2 puzzle storage + server-side delivery | -- |
| Paid puzzle packs | -- |
| **RevenueCat webhook with HMAC verification** (specced in `GEN-api.md`) | Resolved item 22 |
| **Purchase recovery path** -- Prompt anonymous users to create an account before purchasing. If they don't, RevenueCat receipt restoration recovers entitlements but not progress. Document this tradeoff. | #27 Anonymous purchase recovery |

### Cut or Defer Indefinitely

| Item | Reason |
| --------------------------------------------- | --------------------------------------- |
| `GEN-information-architecture.md` | Duplicate of other specs; creates drift |
| Weekly/monthly challenges | Daily is enough until proven otherwise (#17) |
| Midnight theme | Light/dark covers it |
| A/B testing infrastructure | No traffic to test |
| Color highlighter tool | Advanced feature for later |
| Puzzle download analytics | No users to analyze |
| Colored regions / thick borders / coordinates | Polish, not launch-critical |

---

## Composite Build Order

Everything in sequence. Each item notes which finding it addresses (if any).

### Phase 0: Before Writing App Code

1. Un-gitignore `package.json` and `tsconfig.json` (#12)
2. Fix stale level numbering comments in `rules/index.ts` (#14)
3. Fix difficulty range mismatch -- normalize formula or update SBN spec (#13)
4. Delete `GEN-information-architecture.md` (#10)
5. Write pack generation script -- curate corpus into bundled JSON packs with pre-computed hints (#28, #9)

### Phase 1: Playable Game

6. React Native scaffold
7. Board renderer (grid, regions, stars, marks)
8. Tap-to-cycle input with haptics
9. Bundle puzzle packs as JSON assets with pre-computed hints (#15, #26, #9)
10. Hint button -- free, unlimited, reads pre-computed metadata (#18 deferred)
11. Puzzle selection screen
12. Win detection + feedback
13. Undo button
14. Auto-x toggle
15. Light/dark theme (system default)
16. Timer
17. MMKV for local progress with write-error handling (#30)

### Phase 2: Retention Hooks

18. Daily puzzle generation pipeline -- pre-generate, solver-validate every daily (#25, #28)
19. Daily streak (local, UTC)
20. Pack progression tracking (local)
21. Hint templates for all 38 rules -- pre-computed at build time (#9 completion)
22. Error highlighting toggle
23. Privacy policy (#1, #20)
24. COPPA decision -- age-gate, mixed-audience ads, or 13+ listing (#20)
25. Banner ads (AdMob) -- only after 23 + 24

### Phase 3: Monetization

26. Terms of service (#21)
27. Remove ads IAP
28. RevenueCat integration (client-side receipt validation)
29. Hint monetization decision -- free vs. paid; if paid, accept local-only bypass until Phase 4 (#7, #18)
30. Unlock all puzzles IAP (only if sequential locking added) (#19)

### Phase 4: Cloud

31. Shared types package -- single `.ts` source of truth for client + server (#11)
32. Cloudflare Worker + D1 schema with `DELETE /account` from day one (#5)
33. BetterAuth integration per Docket pattern (factory, PBKDF2, cookies, social, Resend)
34. Cloud sync -- last-write-wins with client timestamps, document limitation (#24)
35. Offline queue with size cap (#29)
36. Server-authoritative hint count -- reject invalid sync payloads (#7)
37. R2 puzzle storage + server-side delivery
38. Paid puzzle packs
39. RevenueCat webhook with HMAC verification
40. Purchase recovery -- prompt account creation before purchase (#27)

### Post-Build

41. Polish, testing, edge cases
42. App Store submission + review

---

## What Works Well

These are good decisions -- keep them:

1. **Solver-first architecture.** Building the hard thing first and getting to 999/1000 before touching UI was the right priority.
2. **Pre-computed hints as puzzle metadata.** No solver on device, no server cost, works offline, instant, deterministic. Avoids an entire class of scaling and performance problems.
3. **Cloudflare stack (Workers + D1 + R2).** Lightweight, cheap, scales automatically. Right choice for a puzzle app.
4. **SBN notation.** Human-readable, compact (~115 bytes for 10x10), supports metadata. Good for storage and debugging.
5. **Local-first with optional cloud sync.** Correct model for a puzzle app where offline play is non-negotiable.
6. **Difficulty tied to solver internals.** `maxLevel * 4 + cycles / 4` is simple and directly measures human-style reasoning difficulty.
7. **Clear "not in scope" boundaries.** "Leaderboards -- Not in scope." "Anonymous cleanup -- Not needed for v1." These save months.
8. **BetterAuth via Docket pattern.** Proven architecture, cookie-based sessions, PBKDF2 on Workers, no hand-rolled auth.

---

## Effort Estimate (Solo Developer)

| Component                                    | Phase | Effort          |
| -------------------------------------------- | ----- | --------------- |
| Repo cleanup + spec fixes                    | 0     | 1 day           |
| Pack generation pipeline                     | 0     | 1-2 days        |
| React Native board renderer                  | 1     | 1-2 weeks       |
| Navigation + screens                         | 1     | 1 week          |
| Hint system (templates + metadata reader)    | 1-2   | 3-5 days        |
| Local storage (MMKV) + progress              | 1     | 1 week          |
| Timer, undo/redo, auto-x                     | 1     | 1 week          |
| Theming (light/dark)                         | 1     | 2-3 days        |
| Daily puzzles + streaks                      | 2     | 1 week          |
| Privacy policy + COPPA + ToS                 | 2-3   | 2-3 days        |
| Ad integration (AdMob)                       | 2     | 3-5 days        |
| RevenueCat IAP                               | 3     | 1 week          |
| Cloudflare Worker + BetterAuth (if Phase 4)  | 4     | 1-2 weeks       |
| Cloud sync + shared types (if Phase 4)       | 4     | 1 week          |
| Polish, testing, edge cases                  | all   | 2-3 weeks       |
| App Store submission + review                | post  | 1-2 weeks       |
| **Total for v1 (Phase 0-3)**                 |       | **10-14 weeks** |
| **Total with cloud (Phase 4)**               |       | **14-18 weeks** |

---

## Open Decisions

1. **"Who generates daily puzzles and when?"** -- Pre-generate a year's worth? Cron job? Must be solver-validated to avoid broken dailies (#25).

2. **"What hint metadata format?"** -- Decide structure for pre-computed hints stored in puzzle JSON. What fields per hint step (rule name, affected cells, explanation template)?

3. **"Monetize hints or keep them free?"** -- If free: simpler architecture, better differentiator. If monetized: need server-authoritative count in Phase 4 (#7).
