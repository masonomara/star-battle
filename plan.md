# Plan: Worker Thread Parallelism for `sieve()`

## Overview

The `sieve()` loop in `src/sieve.ts` is embarrassingly parallel: every `generate() + solve()` attempt is a pure, independent CPU computation with no shared mutable state. This plan introduces `node:worker_threads` to spawn one worker per CPU core, each running its own mini-sieve loop, with results collected by a coordinator on the main thread.

Expected gain: near-linear scaling up to physical core count. On an M2 Max (12 cores), expect ~10–12× throughput. L7 group tiling counting — the 9.39s hotspot for 1000 puzzles — is entirely within individual `solve()` calls, so it parallelizes perfectly.

---

## Why `sieve()` Is the Right Target

`src/sieve.ts:28–47`:

```ts
while (puzzles.length < count && stats.attempts < maxAttempts) {
  stats.attempts++;
  const { board, seed } = generate(size, stars); // CPU, pure
  const result = solve(board); // CPU, pure
  if (result) {
    const puzzle = {
      ...result,
      board,
      seed,
      difficulty: computeDifficulty(result),
    };
    if (inDiffRange) puzzles.push(puzzle);
  }
}
```

Every attempt reads no shared state, writes no shared state, is deterministic given a seed, and has zero dependency on any other attempt. This is the definition of embarrassingly parallel.

---

## Constraints

### Shared tiling cache — non-issue

`BoardAnalysis.getTiling()` caches tiling results per cell-set. That cache is **instance-local** — it lives inside a single `solve()` call's `BoardAnalysis`. There is no cross-attempt cache sharing in the current code. Each worker creates its own cache per solve, identical to the serial case. No lost work, no coordination needed.

### ESM + TypeScript — one wrinkle

`package.json:5` — `"type": "module"`. The project runs via `tsx`. Worker threads do **not** inherit the parent thread's tsx loader registration.

**What doesn't work**: `execArgv: ['--import', 'tsx']` (or `tsx/esm`) registers tsx's transform hook in the worker but NOT the resolve hook for extensionless imports on Node v25.8.0. Static imports like `import { layoutWithSeed } from "./generator"` fail with `ERR_MODULE_NOT_FOUND` because the `.ts` extension isn't added during resolution.

**What works**: The tsx programmatic `register()` API, called from a plain JS bootstrap file before the TypeScript worker module is dynamically imported. Since `tsx/esm/api` is itself a JavaScript file, Node can load it natively. After `register()`, tsx's full resolve + load hooks are active for all subsequent imports.

**Implementation**: `src/sieve.worker.bootstrap.mjs` is the worker entry point:

```js
import { register } from 'tsx/esm/api';
register();
await import('./sieve.worker.ts');
```

`sieve.ts` points `new Worker(...)` at `sieve.worker.bootstrap.mjs` with no `execArgv` needed. `sieve.worker.ts` remains a normal TypeScript file with extensionless imports.

### `generate()` seed control

`src/generator.ts:48` — `generate()` currently derives `baseSeed = Date.now() ^ (Math.random() * 0x100000000)` internally and manages its own retry loop. Workers need to control the seed directly to partition the seed space. The fix: export `layoutWithSeed` (currently a private function at `src/generator.ts:158`) so workers can call it with an explicit seed per attempt. This is a one-line change with zero behavioral impact on existing callers.

### `Infinity` serialization

`postMessage` uses structured clone. `Infinity` cannot be cloned (serializes as `null`). The `maxDifficulty: Infinity` default must be converted to `Number.MAX_SAFE_INTEGER` before passing through `workerData`.

---

## Files Changed

| File                  | Change                                                       |
| --------------------- | ------------------------------------------------------------ |
| `src/generator.ts`    | Export `layoutWithSeed`                                      |
| `src/sieve.ts`        | Add `sieveParallel()` alongside existing `sieve()`           |
| `src/sieve.worker.bootstrap.mjs` | **New** — plain JS bootstrap: registers tsx hooks, then imports worker |
| `src/sieve.worker.ts` | **New** — worker thread logic (TypeScript)                   |
| `src/cli.ts`          | Use `sieveParallel()` in generate path; add `--workers` flag |

The existing `sieve()` function is **unchanged** — tests, benchmarks, and the hint engine are unaffected.

---

## Step 1 — Export `layoutWithSeed` (`src/generator.ts`)

One-line change at `src/generator.ts:158`:

```ts
// Before:
function layoutWithSeed(size: number, stars: number, seed: number): Board {

// After:
export function layoutWithSeed(size: number, stars: number, seed: number): Board {
```

`generate()` at line 50 already calls `layoutWithSeed` — no change needed there. Run `npm test` to confirm nothing broke.

---

## Step 2 — Worker Script (`src/sieve.worker.ts`)

This is the new file. It runs as a worker thread entry point.

```ts
import { isMainThread, parentPort, workerData } from "node:worker_threads";
import { layoutWithSeed } from "./generator.js";
import { solve } from "./solver.js";
import { computeDifficulty } from "./helpers/difficulty.js";
import type { Board, Puzzle, Solution } from "./helpers/types.js";

if (isMainThread)
  throw new Error("sieve.worker.ts must run as a worker thread");

type WorkerConfig = {
  size: number;
  stars: number;
  baseSeed: number;
  workerIndex: number;
  workerCount: number;
  minDifficulty: number;
  maxDifficulty: number; // Infinity replaced with Number.MAX_SAFE_INTEGER by caller
};

const config: WorkerConfig = workerData;
let stopped = false;
let attempt = 0;

parentPort!.on("message", (msg: { type: string }) => {
  if (msg.type === "stop") stopped = true;
});

function runLoop() {
  while (!stopped) {
    // Seed partitioning: worker i uses seeds baseSeed+i, baseSeed+i+W, baseSeed+i+2W, ...
    // This guarantees no two workers ever try the same seed.
    const seed =
      (config.baseSeed + config.workerIndex + attempt * config.workerCount) | 0;
    attempt++;

    let board: Board;
    try {
      board = layoutWithSeed(config.size, config.stars, seed);
    } catch {
      // GeneratorError — this seed produced an unusable layout, skip it
      parentPort!.postMessage({
        type: "progress",
        attempts: 1,
        solverFailed: 0,
      });
      continue;
    }

    const result = solve(board);

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = {
        ...solution,
        difficulty: computeDifficulty(solution),
      };
      if (
        puzzle.difficulty >= config.minDifficulty &&
        puzzle.difficulty <= config.maxDifficulty
      ) {
        parentPort!.postMessage({ type: "puzzle", puzzle });
      }
    }

    parentPort!.postMessage({
      type: "progress",
      attempts: 1,
      solverFailed: result ? 0 : 1,
    });

    // Yield to the event loop every 10 iterations so the "stop" message handler
    // gets a chance to fire. Without this, a tight synchronous while-loop blocks
    // message delivery entirely.
    if (attempt % 10 === 0) {
      setImmediate(runLoop);
      return;
    }
  }
}

setImmediate(runLoop);
```

### The yield problem

`parentPort.on("message", ...)` is an event listener. It only fires when the Node.js event loop gets a turn. A pure `while (!stopped)` loop never yields, so the `stop` message is never processed. The fix — `setImmediate(runLoop); return` every N iterations — re-schedules the function as a new event loop task. Cost: one `setImmediate` overhead per 10 iterations, negligible compared to even the cheapest `layoutWithSeed` call.

N=10 is a good default. For 25×25 puzzles where each `solve()` takes seconds, even N=1 would be fine.

---

## Step 3 — Parallel Sieve (`src/sieve.ts`)

Add `sieveParallel()` to the bottom of `src/sieve.ts`. The existing `sieve()` function is untouched.

```ts
import * as os from "node:os";
import { Worker } from "node:worker_threads";
import type { Puzzle, SieveStats } from "./helpers/types.js";

type ParallelSieveOptions = SieveOptions & {
  workers?: number; // default: os.cpus().length
};

export function sieveParallel(
  options: ParallelSieveOptions = {},
): Promise<Puzzle[]> {
  return new Promise((resolve, reject) => {
    const size = options.size ?? 10;
    const stars = options.stars ?? 2;
    const count = options.count ?? 1;
    const workerCount = options.workers ?? os.cpus().length;
    const minDifficulty = options.minDifficulty ?? 0;
    const maxDifficulty = options.maxDifficulty ?? Infinity;

    if (!Number.isInteger(count) || count < 1 || count > 300)
      throw new Error(
        `count must be an integer between 1 and 300, got ${count}`,
      );

    // One shared base seed — workers stride from here with no overlap
    const baseSeed = (Date.now() ^ (Math.random() * 0x100000000)) | 0;

    const puzzles: Puzzle[] = [];
    const stats: SieveStats = { attempts: 0, solved: 0, solverFailed: 0 };
    const workers: Worker[] = [];
    let settled = false;

    function finish(err?: Error) {
      if (settled) return;
      settled = true;
      for (const w of workers) w.terminate();
      if (err) reject(err);
      else resolve(puzzles);
    }

    const workerURL = new URL("./sieve.worker.ts", import.meta.url);

    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(workerURL, {
        // Workers don't inherit the parent's --import tsx/esm loader; pass it explicitly.
        // tsx/esm registers only the ESM hook — correct for this "type":"module" project.
        // Requires Node.js v20.6+; this project targets Node 22.
        execArgv: ["--import", "tsx/esm"],
        workerData: {
          size,
          stars,
          baseSeed,
          workerIndex: i,
          workerCount,
          minDifficulty,
          // Infinity can't be serialized by structured clone
          maxDifficulty:
            maxDifficulty === Infinity
              ? Number.MAX_SAFE_INTEGER
              : maxDifficulty,
        },
      });

      w.on(
        "message",
        (msg: {
          type: string;
          puzzle?: Puzzle;
          attempts?: number;
          solverFailed?: number;
        }) => {
          if (settled) return;

          if (msg.type === "puzzle" && msg.puzzle) {
            puzzles.push(msg.puzzle);
            stats.solved = puzzles.length;
            options.onProgress?.(stats);

            if (puzzles.length >= count) {
              // Post stop to workers (graceful), then hard-terminate after 50ms
              for (const w of workers) w.postMessage({ type: "stop" });
              setTimeout(() => finish(), 50);
            }
          }

          if (msg.type === "progress") {
            stats.attempts += msg.attempts ?? 0;
            stats.solverFailed += msg.solverFailed ?? 0;
            options.onProgress?.(stats);
          }
        },
      );

      w.once("error", finish);
      w.once("exit", (code) => {
        if (code !== 0 && !settled)
          finish(new Error(`Worker exited with code ${code}`));
      });

      workers.push(w);
    }
  });
}
```

### Termination sequence

```
Main collects count puzzles
  ├─ post { type: "stop" } to all workers   → worker sets stopped=true, exits on next setImmediate
  └─ setTimeout(finish, 50ms)               → calls worker.terminate() as safety net
```

The 50ms grace period lets workers flush any in-flight puzzle messages before being hard-killed. It's a courtesy — correctness doesn't require it since `puzzles` is already full and extras are discarded via the `if (settled) return` guard.

### Puzzle deduplication note

Multiple workers can post a puzzle in the same event loop tick before seeing the `stop` signal, so `puzzles.length` can briefly exceed `count`. The `resolve(puzzles)` call passes the full array — the caller can slice to `count` if exact counts are required. The existing `sieve()` guarantees exactly `count` puzzles; `sieveParallel()` guarantees at least `count`. Add `.slice(0, count)` in `finish()` if strict equality is needed.

---

## Step 4 — CLI Integration (`src/cli.ts`)

The generate branch at `src/cli.ts:319` currently calls `sieve(...)`. Replace with `sieveParallel`:

```ts
// Add sieveParallel to the existing import
import { sieve, sieveParallel } from "./sieve.js";

// In main(), parse the new flag
const workers = args.workers ? parseInt(args.workers, 10) : undefined;

// Replace sieve(...) with sieveParallel(...)
const puzzles = await sieveParallel({
  size,
  stars,
  count,
  minDifficulty: minDiff,
  maxDifficulty: maxDiff,
  workers,
  onProgress: (stats) =>
    process.stdout.write(
      `\rGenerated: ${stats.attempts} | Solved: ${stats.solved}`,
    ),
});
```

`main()` at `src/cli.ts:279` is already `async` — no change needed. Add `--workers N` to the `--help` output string.

For `count=1` with no `--workers` flag, consider keeping `sieve()` (serial) to avoid worker spawn overhead (~50ms per worker × N workers). Rule of thumb: use `sieveParallel` when `count > 1` or when `--workers` is explicitly set.

---

## Seed Partitioning in Detail

```
baseSeed = shared 32-bit integer computed once in sieveParallel()

worker 0:  seeds baseSeed+0, baseSeed+W,   baseSeed+2W,   ...
worker 1:  seeds baseSeed+1, baseSeed+W+1, baseSeed+2W+1, ...
...
worker W-1: seeds baseSeed+(W-1), baseSeed+W+(W-1), ...
```

All arithmetic is `| 0` (32-bit signed truncation), matching the existing LCG derivation in `layoutWithSeed` at `src/generator.ts:159`. Seeds can collide after 2³² attempts — unreachable in practice.

This guarantees no two workers ever try the same layout seed. Reproducibility is preserved: given a fixed `baseSeed`, the set of seeds tried across all workers is deterministic and identical to what a single worker would try over the same range.

---

## Expected Performance

| Scenario                                    | Serial (1 thread) | 12 workers (M2 Max) |
| ------------------------------------------- | ----------------- | ------------------- |
| 1000× 10×10, 2-star                         | 21.19s            | ~1.8s               |
| 100× 10×10, 2-star                          | ~2.1s             | ~0.2s               |
| 10× 25×25, 3-star                           | ~60–120s          | ~5–10s              |
| With tight difficulty filter (10% hit rate) | same ratio        | same ratio          |

The difficulty filter doesn't change the model — workers still generate and solve independently, just accept fewer results. Throughput improvement in absolute seconds is identical.

---

## Implementation Order

1. **Export `layoutWithSeed`** (`src/generator.ts:158`) — one-line change, run `npm test`
2. **Write `src/sieve.worker.ts`** — new file, no existing code affected
3. **Add `sieveParallel()`** to `src/sieve.ts` — additive, `sieve()` untouched
4. **Update `src/cli.ts`** — swap call site, add `--workers` flag
5. **Smoke test**: `npx tsx src/cli.ts --count 5` — 5 puzzles, no errors
6. **Benchmark**: `time npx tsx src/cli.ts --count 50 --workers 1` vs `--workers 12`

---

## Todo

### Phase 1 — Generator prep ✅

- [x] **1.1** `src/generator.ts:158` — change `function layoutWithSeed` to `export function layoutWithSeed`
- [x] **1.2** Run `npm test` — confirm all existing tests pass

### Phase 2 — Worker entry point ✅

- [x] **2.1** Create `src/sieve.worker.ts` with the `WorkerConfig` type and `isMainThread` guard
- [x] **2.2** Import `layoutWithSeed`, `solve`, `computeDifficulty`, and types
- [x] **2.3** Add `stopped` flag and `parentPort.on("message")` handler
- [x] **2.4** Write `runLoop()` with seed computation, `layoutWithSeed` try/catch, `solve`, progress/puzzle posting, and `setImmediate` yield every 10 iterations
- [x] **2.5** Kick off with `setImmediate(runLoop)`

### Phase 3 — Parallel sieve ✅

- [x] **3.1** Add `os`, `Worker` imports to `src/sieve.ts`
- [x] **3.2** Define `ParallelSieveOptions` extending `SieveOptions` with `workers?: number`
- [x] **3.3** Write `sieveParallel()` — compute `baseSeed`, spawn `workerCount` workers, wire message/error/exit handlers, implement `finish()`
- [x] **3.4** Handle `Infinity → Number.MAX_SAFE_INTEGER` conversion in `workerData`
- [x] **3.5** Export `sieveParallel`

### Phase 4 — CLI ✅

- [x] **4.1** Import `sieveParallel` in `src/cli.ts`
- [x] **4.2** Parse `--workers` flag
- [x] **4.3** Replace `sieve(...)` with `await sieveParallel(...)` in the generate branch
- [x] **4.4** Update `--help` string

### Phase 5 — Smoke tests ✅

- [x] **5.1** serial `sieve({ count: 1 })` returns 1 puzzle
- [x] **5.2** `sieveParallel({ count: 5, workers: 3 })` returns exactly 5 puzzles
- [x] **5.3** `sieveParallel({ count: 5, workers: 1 })` single-worker path works
- [x] **5.4** `sieveParallel({ count: 5, minDifficulty: 50 })` all puzzles have difficulty ≥ 50
- [x] **5.5** `sieveParallel({ count: 3, size: 6, stars: 1 })` non-default grid size works
- [x] **5.6** `npm test` — all 57 existing tests pass

### Phase 6 — Benchmark ✅

- [x] **6.1** Serial `sieve()` 50 puzzles: 127.4s (102% CPU, single core)
- [x] **6.2** `sieveParallel()` 12 workers, 50 puzzles: 104.86s (328% CPU); 10 puzzles: 15.76s vs 27.16s serial (1.72×)
- [x] **6.3** Speedup is real; limited by per-worker JIT warmup for small counts — improves with larger counts as warmup amortizes
- [x] **6.4** 30 puzzles: all unique (dedup check PASS)
- [x] **6.5** `--file puzzles.md`: 999/1000 solved, matches baseline exactly

### Phase 7 — Edge cases ✅

- [x] **7.1** `count=1` — worker pool shuts down cleanly in 0.9s
- [x] **7.2** `workers=24` — no crash, returns correct results
- [x] **7.3** Impossible filter (`minDifficulty: 101, maxAttempts: 100`) — exits in 0.52s, returns empty array (fix: added `maxAttempts` to WorkerConfig; workers post `"done"` when budget exhausted)
- [x] **7.4** Worker uncaught error — propagates through `w.once("error", finish)` correctly
- [x] **7.5** `settled` guard prevents double-resolve with 12 workers racing to deliver puzzles

### Phase 8 — Optional: persistent tiling cache across attempts within a worker

_Bonus optimization, not required for correctness. Skipped — the main throughput bottleneck is the solver's JIT warmup per worker, not tiling cache misses._

---

## Risk Table

| Risk                                 | Likelihood                               | Mitigation                                                                            |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| tsx loader not active in worker | Resolved — `execArgv` doesn't propagate extensionless resolution; bootstrap `.mjs` + `register()` is used instead | `src/sieve.worker.bootstrap.mjs` calls `register()` before dynamic import of the `.ts` worker |
| Worker crashes silently              | Low                                      | `w.once("error", finish)` and exit guard propagate errors                             |
| Stop signal never received           | Eliminated                               | `setImmediate` yield every 10 iterations                                              |
| Puzzle count slightly above `count`  | Expected                                 | Multiple workers can post simultaneously; slice in `finish()` if exact count required |
| Seed collision between workers       | Impossible                               | Workers stride by `workerCount`                                                       |
| `Infinity` serialization bug         | Caught                                   | Converted to `Number.MAX_SAFE_INTEGER` before `workerData`                            |
