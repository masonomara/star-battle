import { isMainThread, parentPort, workerData } from "node:worker_threads";
import { layoutWithSeed } from "./generator";
import { solve } from "./solver";
import { computeDifficulty } from "./helpers/difficulty";
import type { Board, Puzzle, Solution, TilingResult } from "./helpers/types";

if (isMainThread) throw new Error("sieve.worker.ts must run as a worker thread");

type WorkerConfig = {
  size: number;
  stars: number;
  baseSeed: number;
  workerIndex: number;
  workerCount: number;
  maxAttempts: number;
  minDifficulty: number;
  maxDifficulty: number;
};

type InboundMessage = { type: "stop" };

type OutboundMessage =
  | { type: "puzzle"; puzzle: Puzzle }
  | { type: "progress"; attempts: number; solverFailed: number }
  | { type: "done" };

const PROGRESS_BATCH = 100000;

const config: WorkerConfig = workerData as WorkerConfig;
let stopped = false;
let attempt = 0;
let pendingAttempts = 0;
let pendingSolverFailed = 0;
const tilingCache = new Map<string, TilingResult>();

parentPort!.on("message", (msg: InboundMessage) => {
  if (msg.type === "stop") stopped = true;
});

function flushProgress(): void {
  if (pendingAttempts === 0) return;
  const msg: OutboundMessage = { type: "progress", attempts: pendingAttempts, solverFailed: pendingSolverFailed };
  parentPort!.postMessage(msg);
  pendingAttempts = 0;
  pendingSolverFailed = 0;
}

function runLoop(): void {
  while (!stopped && attempt < config.maxAttempts) {
    const seed = (config.baseSeed + config.workerIndex + attempt * config.workerCount) | 0;
    attempt++;

    let board: Board;
    try {
      board = layoutWithSeed(config.size, config.stars, seed);
    } catch {
      pendingAttempts++;
      continue;
    }

    const result = solve(board, { tilingCache });

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };
      if (puzzle.difficulty >= config.minDifficulty && puzzle.difficulty <= config.maxDifficulty) {
        const msg: OutboundMessage = { type: "puzzle", puzzle };
        parentPort!.postMessage(msg);
      }
    }

    pendingAttempts++;
    if (!result) pendingSolverFailed++;

    if (attempt % PROGRESS_BATCH === 0) {
      flushProgress();
      setImmediate(runLoop);
      return;
    }
  }
  flushProgress();
  const done: OutboundMessage = { type: "done" };
  parentPort!.postMessage(done);
}

setImmediate(runLoop);
