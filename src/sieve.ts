import * as os from "node:os";
import { Worker } from "node:worker_threads";
import { generate } from "./generator";
import { solve } from "./solver";
import { Puzzle, SieveStats, Solution, TilingResult } from "./helpers/types";
import { computeDifficulty } from "./helpers/difficulty";

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
  onProgress?: (stats: SieveStats) => void;
};

export function sieve(options: SieveOptions = {}): Puzzle[] {
  const size = options.size ?? 10;
  const stars = options.stars ?? 2;
  const count = options.count ?? 1;
  const maxAttempts = options.maxAttempts ?? 1000000000;
  if (!Number.isInteger(count) || count < 1 || count > 300)
    throw new Error(`count must be an integer between 1 and 300, got ${count}`);

  const stats: SieveStats = { attempts: 0, solved: 0, solverFailed: 0 };
  const tilingCache = new Map<string, TilingResult>();

  const puzzles: Puzzle[] = [];

  while (puzzles.length < count && stats.attempts < maxAttempts) {
    stats.attempts++;
    const { board, seed } = generate(size, stars);
    const result = solve(board, { tilingCache });

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };
      const minDiff = options.minDifficulty ?? 0;
      const maxDiff = options.maxDifficulty ?? Infinity;
      if (puzzle.difficulty >= minDiff && puzzle.difficulty <= maxDiff) {
        puzzles.push(puzzle);
      }
    } else {
      stats.solverFailed++;
    }

    stats.solved = puzzles.length;
    options.onProgress?.(stats);
  }

  return puzzles;
}

type ParallelSieveOptions = SieveOptions & {
  workers?: number;
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

    const maxAttempts = options.maxAttempts ?? 100_000_000;
    const baseSeed = (Date.now() ^ (Math.random() * 0x100000000)) | 0;

    const puzzles: Puzzle[] = [];
    const stats: SieveStats = { attempts: 0, solved: 0, solverFailed: 0 };
    const workers: Worker[] = [];
    let settled = false;
    let doneCount = 0;

    function finish(err?: Error): void {
      if (settled) return;
      settled = true;
      for (const w of workers) w.terminate();
      if (err) reject(err);
      else resolve(puzzles);
    }

    const workerURL = new URL("./sieve.worker.bootstrap.mjs", import.meta.url);

    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(workerURL, {
        workerData: {
          size,
          stars,
          baseSeed,
          workerIndex: i,
          workerCount,
          maxAttempts: Math.ceil(maxAttempts / workerCount),
          minDifficulty,
          maxDifficulty: maxDifficulty === Infinity ? Number.MAX_SAFE_INTEGER : maxDifficulty,
        },
      });

      w.on("message", (msg: WorkerOutboundMessage) => {
        if (settled) return;

        if (msg.type === "puzzle") {
          puzzles.push(msg.puzzle);
          stats.solved = puzzles.length;
          options.onProgress?.(stats);

          if (puzzles.length >= count) {
            for (const w of workers) {
              const stop: WorkerInboundMessage = { type: "stop" };
              w.postMessage(stop);
            }
            setTimeout(() => finish(), 50);
          }
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
