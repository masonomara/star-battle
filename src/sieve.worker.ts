import { isMainThread, parentPort, workerData } from "node:worker_threads";
import { layoutWithSeed, layoutInverse } from "./generator";
import { solve, hasUniqueSolution } from "./solver";
import { computeDifficulty } from "./helpers/difficulty";
import type { Board, CellState, Puzzle, Solution } from "./helpers/types";

if (isMainThread) throw new Error("sieve.worker.ts must run as a worker thread");

type WorkerConfig = {
  size: number;
  stars: number;
  baseSeed: number;
  startAttemptOffset: number;
  workerIndex: number;
  workerCount: number;
  maxAttempts: number;
  minDifficulty: number;
  maxDifficulty: number;
  useInverse: boolean;
  useBacktrack: boolean;
};

type InboundMessage = { type: "stop" };

type OutboundMessage =
  | { type: "puzzle"; puzzle: Puzzle }
  | { type: "progress"; attempts: number; solverFailed: number }
  | { type: "done" };

const PROGRESS_BATCH = 10_000;
const PROGRESS_INTERVAL_MS = 1_000;

const config: WorkerConfig = workerData as WorkerConfig;
let stopped = false;
let attempt = 0;
let pendingAttempts = 0;
let pendingSolverFailed = 0;
let lastFlushTime = Date.now();

parentPort!.on("message", (msg: InboundMessage) => {
  if (msg.type === "stop") stopped = true;
});

function flushProgress(): void {
  if (pendingAttempts === 0) return;
  const msg: OutboundMessage = { type: "progress", attempts: pendingAttempts, solverFailed: pendingSolverFailed };
  parentPort!.postMessage(msg);
  pendingAttempts = 0;
  pendingSolverFailed = 0;
  lastFlushTime = Date.now();
}

function runLoop(): void {
  while (!stopped && attempt < config.maxAttempts) {
    const seed = (config.baseSeed + config.startAttemptOffset + config.workerIndex + attempt * config.workerCount) | 0;
    attempt++;

    let board: Board;
    try {
      board = config.useInverse
        ? layoutInverse(config.size, config.stars, seed)
        : layoutWithSeed(config.size, config.stars, seed);
    } catch {
      pendingAttempts++;
      if (Date.now() - lastFlushTime >= PROGRESS_INTERVAL_MS) {
        flushProgress();
        setImmediate(runLoop);
        return;
      }
      continue;
    }

    const result = solve(board);

    if (result) {
      const solution: Solution = { ...result, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(solution) };
      if (puzzle.difficulty >= config.minDifficulty && puzzle.difficulty <= config.maxDifficulty) {
        const msg: OutboundMessage = { type: "puzzle", puzzle };
        parentPort!.postMessage(msg);
      }
    } else if (config.useBacktrack && hasUniqueSolution(board)) {
      const size = config.size;
      // cells not needed by encodePuzzleString; maxLevel=12 signals backtracking-required
      const cells: CellState[][] = Array.from({ length: size }, () =>
        Array(size).fill('unknown' as CellState));
      const syntheticResult = { cells, cycles: 0, maxLevel: 12 };
      const solution: Solution = { ...syntheticResult, board, seed };
      const puzzle: Puzzle = { ...solution, difficulty: computeDifficulty(syntheticResult) };
      if (puzzle.difficulty >= config.minDifficulty && puzzle.difficulty <= config.maxDifficulty) {
        const msg: OutboundMessage = { type: "puzzle", puzzle };
        parentPort!.postMessage(msg);
      }
    }

    pendingAttempts++;
    if (!result) pendingSolverFailed++;

    const elapsed = Date.now() - lastFlushTime;
    const shouldFlush = attempt % PROGRESS_BATCH === 0 || elapsed >= PROGRESS_INTERVAL_MS;
    if (shouldFlush) {
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
