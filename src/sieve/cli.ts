import * as fs from "fs";
import { sieve } from "./sieve";
import { layout } from "./generator";
import { solve, StepInfo } from "./solver";
import { Board, CellState, computeDifficulty } from "./helpers/types";
import { benchmark } from "./benchmark";
import { printBoard, printCellStateWithDiff } from "./format";

function parsePuzzle(input: string, stars: number = 1): Board {
  const lines = input
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Empty puzzle input");
  }

  const rows: string[][] = lines.map((line) => {
    if (line.includes(" ")) {
      return line.split(/\s+/).filter((t) => t.length > 0);
    }
    return line.split("");
  });

  const size = rows.length;

  for (let i = 0; i < size; i++) {
    if (rows[i].length !== size) {
      throw new Error(
        `Row ${i} has ${rows[i].length} cells, expected ${size}`,
      );
    }
  }

  const symbolToId = new Map<string, number>();
  let nextId = 0;

  const grid: number[][] = rows.map((row) =>
    row.map((symbol) => {
      if (!symbolToId.has(symbol)) {
        symbolToId.set(symbol, nextId++);
      }
      return symbolToId.get(symbol)!;
    }),
  );

  if (symbolToId.size !== size) {
    throw new Error(
      `Found ${symbolToId.size} regions, expected ${size} for a ${size}x${size} puzzle`,
    );
  }

  return { grid, stars };
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith("--")) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function solveFromInput(input: string, stars: number) {
  const puzzle = parsePuzzle(input, stars);

  console.log(`${puzzle.grid.length}x${puzzle.grid.length}, ${stars} star(s)`);
  console.log("\nRegion grid:");
  printBoard(puzzle.grid);

  let prevCells: CellState[][] | null = null;
  const solveStart = Date.now();

  const result = solve(puzzle, {
    onStep: (step: StepInfo) => {
      console.log(
        `\n--- Cycle ${step.cycle}: ${step.rule} (level ${step.level}) ---`,
      );
      printCellStateWithDiff(step.cells, prevCells);
      prevCells = step.cells.map((row) => [...row]);
    },
  });

  const solveTime = ((Date.now() - solveStart) / 1000).toFixed(2);
  const difficulty = result
    ? computeDifficulty(result.maxLevel, result.cycles)
    : null;
  console.log(
    result
      ? `\n=== SOLVED === ${solveTime}s | difficulty: ${difficulty}`
      : `\n=== STUCK === ${solveTime}s`,
  );
}

async function main() {
  const args = parseArgs();
  if (args.help === "true") {
    console.log(`Usage:
  sieve [--size n] [--stars n] [--count n] [--seed n] [--trace]
  sieve [--minDiff n] [--maxDiff n]     # filter by difficulty range
  echo "A B B..." | sieve [--stars n]   # solve from input
  sieve --file puzzles.sbn [--verbose]   # solve puzzle file and track rule usage
  sieve --file puzzles.sbn --unsolved    # output only unsolved puzzles
  sieve --file puzzles.sbn --trace       # trace each puzzle step by step

Trace a single puzzle (encoded notation):
  echo "10x2.AABB..." > /tmp/p.sbn && sieve --file /tmp/p.sbn --trace`);
    return;
  }

  // File mode: solve puzzles and track rule usage
  if (args.file) {
    let content: string;
    if (args.file === "/dev/stdin") {
      content = await readStdin();
    } else {
      content = fs.readFileSync(args.file, "utf-8");
    }
    benchmark(content, {
      verbose: args.verbose === "true",
      unsolved: args.unsolved === "true",
      trace: args.trace === "true",
    });
    return;
  }

  // Check for piped input (only if explicitly not a TTY and has data ready)
  if (!process.stdin.isTTY) {
    const input = await readStdin();
    if (input.trim()) {
      const stars = args.stars ? parseInt(args.stars, 10) : 1;
      solveFromInput(input, stars);
      return;
    }
  }

  const size = args.size ? parseInt(args.size, 10) : 10;
  const stars = args.stars ? parseInt(args.stars, 10) : 2;
  const count = args.count ? parseInt(args.count, 10) : 1;
  const seed = args.seed ? parseInt(args.seed, 10) : undefined;
  const minDiff = args.minDiff ? parseInt(args.minDiff, 10) : undefined;
  const maxDiff = args.maxDiff ? parseInt(args.maxDiff, 10) : undefined;

  if (size < 4 || size > 25 || !Number.isFinite(size)) {
    console.error("Error: size must be between 4 and 25");
    process.exit(1);
  }
  if (stars < 1 || stars > 6 || !Number.isFinite(stars)) {
    console.error("Error: stars must be between 1 and 6");
    process.exit(1);
  }
  if (count < 1 || count > 300 || !Number.isFinite(count)) {
    console.error("Error: count must be between 1 and 300");
    process.exit(1);
  }

  const diffRange =
    minDiff !== undefined || maxDiff !== undefined
      ? `, difficulty ${minDiff ?? 0}-${maxDiff ?? "\u221E"}`
      : "";
  console.log(
    `${size}\u00D7${size}, ${stars} stars${seed !== undefined ? `, seed ${seed}` : ""}${diffRange}\n`,
  );

  if (args.trace === "true" && seed !== undefined) {
    const puzzle = layout(size, stars, seed);
    console.log("Region grid:");
    printBoard(puzzle.grid);
    let prevCells: CellState[][] | null = null;
    const traceStart = Date.now();
    const result = solve(puzzle, {
      onStep: (step: StepInfo) => {
        console.log(
          `\n--- Cycle ${step.cycle}: ${step.rule} (level ${step.level}) ---`,
        );
        printCellStateWithDiff(step.cells, prevCells);
        prevCells = step.cells.map((row) => [...row]);
      },
    });
    const traceTime = ((Date.now() - traceStart) / 1000).toFixed(2);
    const difficulty = result
      ? computeDifficulty(result.maxLevel, result.cycles)
      : null;
    console.log(
      result
        ? `\n=== SOLVED === ${traceTime}s | difficulty: ${difficulty}`
        : `\n=== STUCK === ${traceTime}s`,
    );
    return;
  }

  const startTime = Date.now();
  const puzzles = sieve({
    size,
    stars,
    count,
    seed,
    minDifficulty: minDiff,
    maxDifficulty: maxDiff,
    onProgress: (solved, attempts) =>
      process.stdout.write(`\rGenerated: ${attempts} | Solved: ${solved}`),
  });
  console.log(` | ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);

  if (puzzles.length === 0) {
    console.log("No solvable puzzles found");
  } else {
    for (const p of puzzles) {
      console.log(
        `Seed: ${p.seed}\nDifficulty: ${p.difficulty} (cycles: ${p.cycles}, maxLevel: ${p.maxLevel})`,
      );
      printBoard(p.board.grid);
      console.log("");
    }
  }
}

main();
