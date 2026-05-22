import * as os from "node:os";
import { Worker } from "node:worker_threads";
import { Puzzle, SieveStats } from "./helpers/types";

type WorkerInboundMessage = { type: "stop" };

type WorkerOutboundMessage =
  | { type: "puzzle"; puzzle: Puzzle }
  | { type: "progress"; attempts: number; solverFailed: number }
  | { type: "done" };

type SieveOptions = {
  size?: number;
  stars?: number;
  count?: number;
  maxAttempts?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  baseSeed?: number;
  startAttemptOffset?: number;
  useInverse?: boolean;
  useBacktrack?: boolean;
  onPuzzle?: (puzzle: Puzzle) => void;
  onProgress?: (stats: SieveStats) => void;
};

type ParallelSieveOptions = SieveOptions & {
  workers?: number;
};

export function sieveParallel(options: ParallelSieveOptions = {}): Promise<{ puzzles: Puzzle[]; baseSeed: number; attempts: number }> {
  return new Promise((resolve, reject) => {
    const size = options.size ?? 10;
    const stars = options.stars ?? 2;
    const count = options.count ?? Number.MAX_SAFE_INTEGER;
    const workerCount = options.workers ?? os.cpus().length;
    const minDifficulty = options.minDifficulty ?? 0;
    const maxDifficulty = options.maxDifficulty ?? Infinity;

    if (!Number.isInteger(count) || count < 1)
      throw new Error(`count must be a positive integer, got ${count}`);

    const maxAttempts = options.maxAttempts ?? 100_000_000;
    const baseSeed = options.baseSeed ?? ((Date.now() ^ (Math.random() * 0x100000000)) | 0);

    const puzzles: Puzzle[] = [];
    const stats: SieveStats = { attempts: 0, solved: 0, solverFailed: 0 };
    const workers: Worker[] = [];
    let settled = false;
    let doneCount = 0;
    let stopSent = false;
    let forceFinishTimer: ReturnType<typeof setTimeout> | null = null;

    function finish(err?: Error): void {
      if (settled) return;
      settled = true;
      if (forceFinishTimer) clearTimeout(forceFinishTimer);
      for (const w of workers) w.terminate();
      if (err) reject(err);
      else resolve({ puzzles, baseSeed, attempts: stats.attempts });
    }

    function sendStop(): void {
      if (stopSent) return;
      stopSent = true;
      for (const w of workers) w.postMessage({ type: "stop" } as WorkerInboundMessage);
      // Force-finish if workers don't drain within 2s
      forceFinishTimer = setTimeout(() => finish(), 2000);
    }

    const workerURL = new URL("./sieve.worker.bootstrap.mjs", import.meta.url);

    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(workerURL, {
        workerData: {
          size,
          stars,
          baseSeed,
          startAttemptOffset: options.startAttemptOffset ?? 0,
          workerIndex: i,
          workerCount,
          maxAttempts: Math.ceil(maxAttempts / workerCount),
          minDifficulty,
          maxDifficulty: maxDifficulty === Infinity ? Number.MAX_SAFE_INTEGER : maxDifficulty,
          useInverse:   options.useInverse   ?? false,
          useBacktrack: options.useBacktrack ?? false,
        },
      });

      w.on("message", (msg: WorkerOutboundMessage) => {
        if (settled) return;

        if (msg.type === "puzzle") {
          if (stopSent) return;
          puzzles.push(msg.puzzle);
          stats.solved = puzzles.length;
          options.onPuzzle?.(msg.puzzle);
          options.onProgress?.(stats);

          if (puzzles.length >= count) sendStop();
        } else if (msg.type === "progress") {
          stats.attempts += msg.attempts;
          stats.solverFailed += msg.solverFailed;
          options.onProgress?.(stats);
        } else if (msg.type === "done") {
          doneCount++;
          if (doneCount === workerCount) finish();
        }
      });

      w.once("error", finish);
      w.once("exit", (code) => {
        if (code !== 0 && !settled)
          finish(new Error(`Worker exited with code ${code}`));
      });

      workers.push(w);
    }
  });
}
