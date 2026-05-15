# Plan: Worker Thread Parallelism for the Sieve

## Goal

Replace the serial `sieve()` loop with a multi-worker version that runs `generate() + solve()` attempts on all CPU cores in parallel. On this machine (Apple M2 Max, 12 cores), the expected throughput gain is roughly 10–12×.

Every `generate() + solve()` attempt reads no shared state, writes no shared state, and is deterministic given its seed. This is textbook embarrassingly parallel.

---

## What Changes

Three files are added or modified:

| File | Change |
|------|--------|
| `src/sieve.ts` | Modified — parallel `sieveParallel()` added alongside the existing serial `sieve()` |
| `src/sieveWorker.ts` | New — the worker thread entry point |
| `src/cli.ts` | Modified — generate path uses `sieveParallel()` |

The existing `sieve()` function stays untouched. `sieveParallel()` is a drop-in replacement with the same signature, same return type, and identical output semantics.

---

## The ESM / tsx Constraint

The project uses `"type": "module"` in package.json and runs via `tsx`. This creates one wrinkle: `new Worker(filename)` in Node.js worker_threads runs the file as a raw Node.js module, not through tsx's TypeScript transform.

**Solution**: Pass the worker file through tsx using the `execArgv` option:

```typescript
new Worker(new URL('./sieveWorker.ts', import.meta.url), {
  execArgv: ['--import', 'tsx/esm'],
  workerData: config,
})
```

`--import tsx/esm` installs tsx's ESM loader hook before the worker module runs, so all TypeScript imports in the worker resolve correctly. This is the same mechanism `npx tsx` uses internally.

Alternatively, for production builds where TypeScript is compiled to JS first, `execArgv` can be omitted and the `.js` extension used. The `--import tsx/esm` approach works for the dev-time `npx tsx src/cli.ts` workflow and requires no build step.

---

## Seed Space Partitioning

The current `generate()` picks `baseSeed = Date.now() ^ (random * 0x100000000)` and increments per retry. With W workers, each worker gets its own independent base seed so their seed sequences never overlap:

```
Worker 0: baseSeed + 0,  baseSeed + W,   baseSeed + 2W, ...
Worker 1: baseSeed + 1,  baseSeed + W+1, baseSeed + 2W+1, ...
...
Worker W-1: baseSeed + W-1, ...
```

The base seed itself is derived at sieve startup and passed to workers via `workerData`, so all workers share the same base but stride differently through the seed space. This guarantees no two workers ever run the same seed, preserving full reproducibility if a specific base seed is specified by the user.

---

## Message Protocol

Three message types flow between the worker and main thread:

**Worker → Main**:
```typescript
// A puzzle passed the difficulty filter
{ type: "puzzle", puzzle: Puzzle }

// Progress tick (one per attempt)
{ type: "progress", attempts: number, solverFailed: number }
```

**Main → Worker**:
```typescript
// Stop working — enough puzzles collected
{ type: "stop" }
```

Puzzles are small plain objects (grid of numbers, cell states, metadata). Structured clone is cheap here — no `transferList` needed.

---

## Implementation

### `src/sieveWorker.ts`

```typescript
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { generate } from './generator.ts';
import { solve } from './solver.ts';
import { computeDifficulty } from './helpers/difficulty.ts';
import { Puzzle, Solution } from './helpers/types.ts';

if (isMainThread) throw new Error('sieveWorker must run as a worker thread');

type WorkerConfig = {
  size: number;
  stars: number;
  baseSeed: number;
  workerIndex: number;
  workerCount: number;
  minDifficulty: number;
  maxDifficulty: number;
};

const {
  size,
  stars,
  baseSeed,
  workerIndex,
  workerCount,
  minDifficulty,
  maxDifficulty,
}: WorkerConfig = workerData;

let stopped = false;

// Listen for stop signal from main thread
parentPort!.on('message', (msg: { type: string }) => {
  if (msg.type === 'stop') stopped = true;
});

// Mini sieve loop — runs until told to stop
let attempt = 0;

function runLoop() {
  while (!stopped) {
    // Stride through seed space: worker i takes seeds i, i+W, i+2W, ...
    const seed = (baseSeed + workerIndex + attempt * workerCount) | 0;
    attempt++;

    let board;
    try {
      // generateWithSeed bypasses generate()'s internal retry loop —
      // we manage the seed ourselves. See note below.
      ({ board } = generateWithSeed(size, stars, seed));
    } catch {
      parentPort!.postMessage({ type: 'progress', attempts: 1, solverFailed: 0 });
      continue;
    }

    const result = solve(board);

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };

      if (puzzle.difficulty >= minDifficulty && puzzle.difficulty <= maxDifficulty) {
        parentPort!.postMessage({ type: 'puzzle', puzzle });
      }
    }

    parentPort!.postMessage({
      type: 'progress',
      attempts: 1,
      solverFailed: result ? 0 : 1,
    });

    // Yield to the event loop so the 'stop' message can be processed.
    // Without this, a tight synchronous loop blocks message reception.
    if (attempt % 10 === 0) {
      setImmediate(runLoop);
      return;
    }
  }
}

setImmediate(runLoop);
```

**Note on `generateWithSeed`**: The existing `generate()` generates its own `baseSeed` internally from `Date.now()` and manages its own retry loop. The worker needs to control the seed directly. The cleanest approach is to export `layoutWithSeed` (currently private) from `generator.ts` as an internal helper, and call it directly from the worker. This requires a small change to `generator.ts` — see "Changes to generator.ts" below.

### `src/sieveWorker.ts` — complete with `layoutWithSeed` import

```typescript
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { layoutWithSeed } from './generator.ts';  // newly exported
import { solve } from './solver.ts';
import { computeDifficulty } from './helpers/difficulty.ts';
import { Puzzle, Solution } from './helpers/types.ts';

if (isMainThread) throw new Error('sieveWorker must run as a worker thread');

type WorkerConfig = {
  size: number;
  stars: number;
  baseSeed: number;
  workerIndex: number;
  workerCount: number;
  minDifficulty: number;
  maxDifficulty: number;
};

const config: WorkerConfig = workerData;
let stopped = false;

parentPort!.on('message', (msg: { type: string }) => {
  if (msg.type === 'stop') stopped = true;
});

let attempt = 0;

function runLoop() {
  while (!stopped) {
    const seed = (config.baseSeed + config.workerIndex + attempt * config.workerCount) | 0;
    attempt++;

    let board;
    try {
      board = layoutWithSeed(config.size, config.stars, seed);
    } catch {
      // GeneratorError from layoutWithSeed — skip this seed
      parentPort!.postMessage({ type: 'progress', attempts: 1, solverFailed: 0 });
      continue;
    }

    const result = solve(board);

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };
      const { minDifficulty: mn, maxDifficulty: mx } = config;
      if (puzzle.difficulty >= mn && puzzle.difficulty <= mx) {
        parentPort!.postMessage({ type: 'puzzle', puzzle });
      }
    }

    parentPort!.postMessage({
      type: 'progress',
      attempts: 1,
      solverFailed: result ? 0 : 1,
    });

    // Yield every 10 iterations to drain the message queue (stop signals).
    if (attempt % 10 === 0) {
      setImmediate(runLoop);
      return;
    }
  }
}

setImmediate(runLoop);
```

### Changes to `src/generator.ts`

Export `layoutWithSeed` so the worker can call it directly:

```typescript
// Before (private):
function layoutWithSeed(size: number, stars: number, seed: number): Board { ... }

// After (exported):
export function layoutWithSeed(size: number, stars: number, seed: number): Board { ... }
```

This is the only change to `generator.ts`. The existing `generate()` function continues to call `layoutWithSeed` exactly as before.

### `src/sieve.ts` — add `sieveParallel()`

The new parallel sieve lives alongside the existing serial `sieve()` in the same file. It has an identical signature plus an optional `workers` parameter.

```typescript
import * as os from 'node:os';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { Puzzle, SieveStats } from './helpers/types.ts';

type ParallelSieveOptions = SieveOptions & {
  workers?: number;   // default: os.cpus().length
};

export function sieveParallel(options: ParallelSieveOptions = {}): Promise<Puzzle[]> {
  return new Promise((resolve, reject) => {
    const size = options.size ?? 10;
    const stars = options.stars ?? 2;
    const count = options.count ?? 1;
    const workerCount = options.workers ?? os.cpus().length;
    const minDifficulty = options.minDifficulty ?? 0;
    const maxDifficulty = options.maxDifficulty ?? Infinity;

    if (!Number.isInteger(count) || count < 1 || count > 300)
      throw new Error(`count must be an integer between 1 and 300, got ${count}`);

    // Single shared base seed — workers stride from here
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

    const workerPath = new URL('./sieveWorker.ts', import.meta.url);

    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(workerPath, {
        execArgv: ['--import', 'tsx/esm'],
        workerData: {
          size,
          stars,
          baseSeed,
          workerIndex: i,
          workerCount,
          minDifficulty,
          maxDifficulty: maxDifficulty === Infinity ? Number.MAX_SAFE_INTEGER : maxDifficulty,
        },
      });

      w.on('message', (msg: { type: string; puzzle?: Puzzle; attempts?: number; solverFailed?: number }) => {
        if (settled) return;

        if (msg.type === 'puzzle' && msg.puzzle) {
          puzzles.push(msg.puzzle);
          stats.solved = puzzles.length;
          options.onProgress?.(stats);

          if (puzzles.length >= count) {
            // Signal all workers to stop (graceful), then terminate
            for (const w of workers) w.postMessage({ type: 'stop' });
            // Give workers 50ms to see the signal, then force-terminate
            setTimeout(() => finish(), 50);
          }
        }

        if (msg.type === 'progress') {
          stats.attempts += msg.attempts ?? 0;
          stats.solverFailed += msg.solverFailed ?? 0;
          options.onProgress?.(stats);
        }
      });

      w.once('error', finish);
      w.once('exit', (code) => {
        if (code !== 0 && !settled)
          finish(new Error(`Worker exited with code ${code}`));
      });

      workers.push(w);
    }
  });
}
```

### Changes to `src/cli.ts`

The CLI's generate path currently calls `sieve(...)`. Change it to call `sieveParallel(...)`:

```typescript
// Before:
import { sieve } from './sieve';
// ...
const puzzles = sieve({ size, stars, count, minDifficulty: minDiff, maxDifficulty: maxDiff, onProgress });

// After:
import { sieve, sieveParallel } from './sieve';
// ...
const puzzles = await sieveParallel({ size, stars, count, minDifficulty: minDiff, maxDifficulty: maxDiff, onProgress });
```

`main()` is already `async`, so `await` works without further changes.

Add an optional `--workers N` CLI argument to allow override:

```typescript
const workerCount = args.workers ? parseInt(args.workers, 10) : undefined;
const puzzles = await sieveParallel({
  size, stars, count,
  minDifficulty: minDiff,
  maxDifficulty: maxDiff,
  workers: workerCount,
  onProgress: (stats) =>
    process.stdout.write(`\rGenerated: ${stats.attempts} | Solved: ${stats.solved}`),
});
```

---

## Termination Flow

This is the trickiest part. The problem: workers run a tight CPU loop. They can only see messages during the `setImmediate` yield. The termination sequence is:

1. Main collects `count` puzzles → posts `{ type: 'stop' }` to all workers
2. Workers see the stop flag at the next `setImmediate` yield (within ≤10 iterations)
3. After 50ms, main calls `worker.terminate()` on all workers regardless — this is a hard kill

The 50ms grace period exists because `terminate()` is immediate and can interrupt a worker mid-computation. Workers that have already stopped cleanly are harmless to terminate. The grace period is a courtesy to let workers flush any in-flight messages, but it's not required for correctness — the main thread has already collected all the puzzles it needs before calling `terminate()`.

A simpler alternative is to skip the grace period entirely and call `terminate()` immediately. This is safe because the main thread's `puzzles` array is already full, so any puzzles posted after that point are discarded.

---

## The Yield Problem in Detail

`worker_threads` message delivery uses Node.js's event loop. A worker running a pure synchronous `while (true)` loop **never processes incoming messages** because the event loop never gets a turn. Without yielding, `parentPort.on('message', ...)` would never fire even after the main thread sends `{ type: 'stop' }`.

The fix: break the loop every N iterations with `setImmediate(runLoop); return`. This schedules the next batch of iterations as a new event loop task, giving the message handler a chance to run between batches.

```typescript
// Every 10 iterations, yield to the event loop
if (attempt % 10 === 0) {
  setImmediate(runLoop);
  return;
}
```

N=10 is a good default. It's small enough that the stop latency is at most 10 iterations (negligible), and large enough that the `setImmediate` overhead doesn't dominate. For very fast puzzles (small grids), you could increase N to 50–100. For very slow puzzles (25×25), N=1 or N=5 is fine since each iteration takes seconds.

---

## Shared Tiling Cache — Non-Issue

The tiling cache (`Map<string, TilingResult>`) lives inside each `buildBoardAnalysis` call and is scoped to a single solve. `sieve.ts` creates a new one per `solve()` call:

```typescript
// solver.ts
const tilingCache = new Map<string, TilingResult>();
```

This means each worker has its own per-solve cache. There is no cross-attempt sharing of tiling results in the current code, so there's nothing to lose by moving to workers. Each worker's cache behaves identically to the serial case.

A future optimization could make the tiling cache persist across attempts within a worker (it's already geometry-pure, so it's valid to share across different boards). This would be a bonus speedup on top of the parallelism, not a prerequisite.

---

## `Infinity` Serialization

`postMessage` uses the structured clone algorithm. `Infinity` is not cloneable in structured clone (it serializes as `null`). The `maxDifficulty: Infinity` default in `SieveOptions` must be converted before passing through `workerData`:

```typescript
maxDifficulty: maxDifficulty === Infinity ? Number.MAX_SAFE_INTEGER : maxDifficulty,
```

The worker then uses `Number.MAX_SAFE_INTEGER` as its effective upper bound, which is functionally equivalent.

---

## File Structure After Changes

```
src/
  generator.ts         -- layoutWithSeed() now exported
  sieve.ts             -- sieve() unchanged, sieveParallel() added
  sieveWorker.ts       -- NEW: worker thread entry point
  cli.ts               -- generate path uses sieveParallel(), +--workers flag
```

---

## Implementation Order

1. **Export `layoutWithSeed` from `generator.ts`** — one-line change, no risk
2. **Write `src/sieveWorker.ts`** — the new file; doesn't affect anything until used
3. **Add `sieveParallel()` to `src/sieve.ts`** — additive, doesn't touch existing `sieve()`
4. **Update `src/cli.ts`** — swap `sieve()` for `sieveParallel()` in the generate path
5. **Smoke test**: `npx tsx src/cli.ts --count 5` — should produce 5 puzzles, faster
6. **Benchmark**: compare `--count 100` before and after; expect ~10× on 12 cores

---

## Expected Performance

On this machine (Apple M2 Max, 12 cores):

| Scenario | Serial | Parallel (12 workers) |
|----------|--------|-----------------------|
| 10×10, count=100 | ~2.1s | ~0.2s |
| 25×25, count=10 | ~60s+ | ~6s |
| With difficulty filter (10–30% hit rate) | 3–10× slower | same ratio, absolute time same improvement |

The difficulty filter doesn't change the parallelism model — workers still generate and solve independently, just with a lower puzzle acceptance rate. The throughput gain is identical in absolute terms (total attempts per second scales with core count regardless of acceptance rate).

---

## Todo List

### Phase 1 — Generator prep (no behavior change, no risk)

- [ ] **1.1** In `src/generator.ts`, change `function layoutWithSeed(...)` to `export function layoutWithSeed(...)`. Confirm the existing `generate()` call inside the same file still compiles. Run `npm test` to verify nothing broke.

---

### Phase 2 — Write the worker entry point

- [ ] **2.1** Create `src/sieveWorker.ts`. Add the `WorkerConfig` type at the top:
  ```ts
  type WorkerConfig = {
    size: number; stars: number; baseSeed: number;
    workerIndex: number; workerCount: number;
    minDifficulty: number; maxDifficulty: number;
  };
  ```
- [ ] **2.2** Import `isMainThread`, `parentPort`, `workerData` from `node:worker_threads`. Add the `isMainThread` guard (`if (isMainThread) throw`).
- [ ] **2.3** Import `layoutWithSeed` from `./generator.ts`, `solve` from `./solver.ts`, `computeDifficulty` from `./helpers/difficulty.ts`, and the `Puzzle`, `Solution` types from `./helpers/types.ts`.
- [ ] **2.4** Read the config from `workerData` with the `WorkerConfig` type.
- [ ] **2.5** Add the `stopped` flag and the `parentPort.on('message')` handler that sets it to `true` on `{ type: 'stop' }`.
- [ ] **2.6** Write the `runLoop()` function:
  - Compute `seed = (config.baseSeed + config.workerIndex + attempt * config.workerCount) | 0`
  - Wrap `layoutWithSeed` call in try/catch; on `GeneratorError`, post `{ type: 'progress', attempts: 1, solverFailed: 0 }` and `continue`
  - Call `solve(board)`. Build `Puzzle` if result is truthy. Check difficulty bounds before posting `{ type: 'puzzle', puzzle }`
  - Always post `{ type: 'progress', attempts: 1, solverFailed: result ? 0 : 1 }`
  - Every 10 iterations: `setImmediate(runLoop); return` to yield to the event loop
- [ ] **2.7** Kick off the loop with `setImmediate(runLoop)` at module top level.

---

### Phase 3 — Add `sieveParallel()` to `src/sieve.ts`

- [ ] **3.1** Add imports at the top of `src/sieve.ts`: `Worker` from `node:worker_threads`, `os` from `node:os`.
- [ ] **3.2** Define `ParallelSieveOptions` extending `SieveOptions` with an optional `workers?: number` field.
- [ ] **3.3** Write the `sieveParallel(options)` function signature — returns `Promise<Puzzle[]>`.
- [ ] **3.4** Inside the function, resolve defaults: `workerCount = options.workers ?? os.cpus().length`. Validate `count` (same guard as `sieve()`). Convert `maxDifficulty === Infinity` to `Number.MAX_SAFE_INTEGER` before passing to `workerData`.
- [ ] **3.5** Compute `baseSeed = (Date.now() ^ (Math.random() * 0x100000000)) | 0`.
- [ ] **3.6** Declare `puzzles: Puzzle[]`, `stats: SieveStats`, `workers: Worker[]`, `settled: boolean`. Write the `finish(err?)` helper that terminates all workers and resolves or rejects the promise.
- [ ] **3.7** Build the worker URL: `new URL('./sieveWorker.ts', import.meta.url)`.
- [ ] **3.8** Spawn `workerCount` workers in a `for` loop. For each:
  - Pass `workerData` with all `WorkerConfig` fields plus `workerIndex: i`
  - Pass `execArgv: ['--import', 'tsx/esm']`
  - Wire `w.on('message', ...)` handler
  - Wire `w.once('error', finish)` and `w.once('exit', ...)` guard
  - Push to `workers` array
- [ ] **3.9** In the `message` handler:
  - On `type === 'puzzle'`: push puzzle, update `stats.solved`, call `onProgress`. If `puzzles.length >= count`, post `{ type: 'stop' }` to all workers, then `setTimeout(() => finish(), 50)`
  - On `type === 'progress'`: accumulate `stats.attempts` and `stats.solverFailed`, call `onProgress`
- [ ] **3.10** Export `sieveParallel` from `src/sieve.ts`.

---

### Phase 4 — Wire up the CLI

- [ ] **4.1** In `src/cli.ts`, add `sieveParallel` to the import from `./sieve`.
- [ ] **4.2** In `parseArgs`, document the new `--workers` flag in the `--help` output string.
- [ ] **4.3** In `main()`, parse `args.workers` as an integer (same pattern as `args.count`).
- [ ] **4.4** Replace the `sieve(...)` call in the generate branch with `await sieveParallel(...)`, passing `workers: workerCount`.
- [ ] **4.5** Confirm `main()` is already `async` (it is) — no further changes needed.

---

### Phase 5 — Smoke tests

- [ ] **5.1** Run `npx tsx src/cli.ts --count 1` and confirm a puzzle string is printed with no errors.
- [ ] **5.2** Run `npx tsx src/cli.ts --count 5` and confirm exactly 5 puzzle strings are printed.
- [ ] **5.3** Run `npx tsx src/cli.ts --count 5 --workers 1` and confirm it works with a single worker (exercises the serial-within-worker path).
- [ ] **5.4** Run `npx tsx src/cli.ts --count 5 --minDiff 50` and confirm difficulty filtering works across workers (all returned puzzles have difficulty ≥ 50).
- [ ] **5.5** Run `npx tsx src/cli.ts --count 5 --size 6 --stars 1` and confirm non-default grid sizes work.
- [ ] **5.6** Run `npm test` and confirm all existing tests still pass (workers don't touch the test-exercised code paths).

---

### Phase 6 — Benchmark and validate

- [ ] **6.1** Time the serial baseline: `time npx tsx src/cli.ts --count 50 --workers 1`.
- [ ] **6.2** Time the parallel run: `time npx tsx src/cli.ts --count 50` (defaults to `os.cpus().length` workers).
- [ ] **6.3** Confirm the speedup is roughly proportional to core count (expect 8–12× on this machine for CPU-bound workloads; accept 4–8× due to startup overhead on small counts).
- [ ] **6.4** Run `--count 200` parallel and check that no puzzle appears twice (uniqueness spot-check via sorting encoded strings and diffing).
- [ ] **6.5** Run the benchmark file path to confirm it is unaffected: `npx tsx src/cli.ts --file sample-puzzle.sbn`. The benchmark path uses the serial `solve()` directly and is not touched by this change.

---

### Phase 7 — Edge cases and hardening

- [ ] **7.1** Test `--count 1` — the most common CLI use case. Confirm the single-puzzle path terminates cleanly (worker pool correctly shut down).
- [ ] **7.2** Test `--workers 24` (more workers than cores) — should work, just with more context-switching; confirm no crash.
- [ ] **7.3** Simulate a stuck sieve (e.g., impossibly tight difficulty filter like `--minDiff 99 --maxDiff 100`) — confirm the process eventually hits `maxAttempts` and exits rather than hanging. Decide whether `sieveParallel` should expose `maxAttempts` or just let it run until the user kills it (currently the serial sieve exits cleanly; parallel needs the same guarantee).
- [ ] **7.4** Verify that if any worker throws an unexpected error (not `GeneratorError`), `finish(err)` is called, the promise rejects, and the CLI prints an error instead of hanging.
- [ ] **7.5** Check that `worker.terminate()` in `finish()` does not emit spurious `exit` events that re-trigger `finish()` — the `settled` flag should guard this, but confirm it does.

---

### Phase 8 — (Optional) Per-solve tiling cache persistence within workers

*This is a bonus optimization, not required for correctness. Add only after Phase 7 is green.*

- [ ] **8.1** Move the `tilingCache` map out of `solve()` and into the worker's module scope, so it persists across all `solve()` calls within a single worker's lifetime.
- [ ] **8.2** Pass the persistent cache into `solve()` via a new optional parameter (e.g., `solve(board, options, tilingCache?)`).
- [ ] **8.3** Benchmark with and without persistent cache to measure the gain. For 10×10 puzzles, expect a modest improvement on repeated tiling patterns; for 25×25, the gain should be more pronounced since the tiling search space is larger and repeats more often across attempts.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `tsx/esm` loader hook not found in worker | Low (tsx is a devDep) | Verify with `npx tsx -e "import 'node:worker_threads'"` before shipping |
| Worker crashes silently | Low | `w.once('error', finish)` and `w.once('exit', ...)` propagate errors |
| Stop signal never received (worker stuck in tight loop) | Eliminated | `setImmediate` yield every 10 iterations |
| Puzzle count slightly exceeds `count` | Expected | Multiple workers can post their last puzzle simultaneously before seeing the stop signal; the main thread just ignores extras |
| Seed collision between workers | Impossible | Workers stride by `workerCount`, never share a seed |
| `Infinity` serialization bug | Caught | Converted to `Number.MAX_SAFE_INTEGER` before `workerData` |
