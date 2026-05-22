import * as fs from "fs";
import { sieveParallel } from "./sieve";
import { solve } from "./solver";
import { decodePuzzleString, encodePuzzleString, REGION_LETTERS } from "./helpers/notation";
import { Board, CellState, Puzzle } from "./helpers/types";
import { computeDifficulty } from "./helpers/difficulty";

// --- Formatting ---

function printBoard(grid: number[][]) {
  const size = grid.length;
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => REGION_LETTERS[i]).join(" ");
  console.log(colHeader);
  for (let r = 0; r < size; r++) {
    const label = String(r + 1).padStart(2);
    const row = grid[r].map((id) => REGION_LETTERS[id]).join(" ");
    console.log(`${label}  ${row}`);
  }
}

function printCellStateWithDiff(
  cells: CellState[][],
  prev: CellState[][] | null,
) {
  const size = cells.length;
  const sym = { unknown: ".", marked: "X", star: "\u2605" };
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => REGION_LETTERS[i]).join(" ");
  console.log(colHeader);
  for (let r = 0; r < size; r++) {
    const label = String(r + 1).padStart(2);
    const line = cells[r].map((c, i) => {
      const s = sym[c];
      return prev && prev[r][i] !== c ? `\x1b[43m\x1b[30m${s}\x1b[0m` : s;
    });
    console.log(`${label}  ${line.join(" ")}`);
  }
}

// --- Trace ---

function traceBoard(board: Board) {
  console.log("Region grid:");
  printBoard(board.grid);
  const start = Date.now();
  const result = solve(board);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  if (result) {
    const difficulty = computeDifficulty(result);
    printCellStateWithDiff(result.cells, null);
    console.log(`\n=== SOLVED === ${elapsed}s | difficulty: ${difficulty} | cycles: ${result.cycles} | maxLevel: ${result.maxLevel}`);
  } else {
    console.log(`\n=== STUCK === ${elapsed}s`);
  }
}

// --- Benchmark ---

function benchmark(content: string, verbose: boolean, filterUnsolved: boolean, trace: boolean) {
  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    console.log("No puzzles found in file");
    return;
  }

  let solved = 0;
  const difficulties: number[] = [];
  const unsolvedPuzzles: { index: number; line: string; reason: string }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const puzzleStr = line.split("#")[0].trim();

    let puzzle: Board;
    try {
      puzzle = decodePuzzleString(puzzleStr).board;
    } catch (e) {
      unsolvedPuzzles.push({
        index: i + 1,
        line,
        reason: `PARSE ERROR: ${(e as Error).message}`,
      });
      if (verbose && !filterUnsolved) {
        console.log(`Puzzle ${i + 1}: PARSE ERROR - ${(e as Error).message}`);
      }
      continue;
    }

    if (trace) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Puzzle ${i + 1}: ${puzzleStr}`);
      console.log(`${"=".repeat(60)}`);
      traceBoard(puzzle);
      continue;
    }

    const result = solve(puzzle);

    if (result) {
      solved++;
      const difficulty = computeDifficulty(result);
      difficulties.push(difficulty);
      if (verbose && !filterUnsolved) {
        console.log(
          `Puzzle ${i + 1}: SOLVED (difficulty: ${difficulty}, cycles: ${result.cycles}, maxLevel: ${result.maxLevel})`,
        );
      }
    } else {
      unsolvedPuzzles.push({ index: i + 1, line, reason: "STUCK" });
      if (verbose && !filterUnsolved) {
        console.log(`Puzzle ${i + 1}: STUCK`);
      }
    }

    if (!verbose && !filterUnsolved && (i + 1) % 100 === 0) {
      process.stdout.write(`\rProcessed: ${i + 1}/${lines.length}`);
    }
  }

  if (filterUnsolved) {
    console.error(
      `# ${unsolvedPuzzles.length} unsolved puzzles out of ${lines.length}`,
    );
    for (const { index, line, reason } of unsolvedPuzzles) {
      console.log(`${line} # puzzle ${index}: ${reason}`);
    }
    return;
  }

  if (!verbose) {
    process.stdout.write("\r");
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Processed ${lines.length} puzzles in ${elapsed}s\n`);

  console.log("Difficulty distribution:");
  const easy = difficulties.filter((d) => d <= 20).length;
  const medium = difficulties.filter((d) => d > 20 && d <= 40).length;
  const hard = difficulties.filter((d) => d > 40).length;
  console.log(`  Easy (1-20):    ${easy} puzzles`);
  console.log(`  Medium (21-40): ${medium} puzzles`);
  console.log(`  Hard (41+):     ${hard} puzzles`);

  const solveRate = ((solved / lines.length) * 100).toFixed(0);
  console.log(`\nSolve rate: ${solved}/${lines.length} (${solveRate}%)`);
}

// --- Stdin grid parser ---

function parseGridFromStdin(input: string, stars: number): Board {
  const rows = input.trim().split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  const size = rows.length;

  const grid: number[][] = [];
  const letterToRegion = new Map<string, number>();
  let nextRegion = 0;

  for (const row of rows) {
    const cells = row.split(/\s+/);
    if (cells.length !== size) {
      throw new Error(`Expected ${size} columns but row has ${cells.length}: "${row}"`);
    }
    const rowData: number[] = [];
    for (const cell of cells) {
      const letter = cell.toUpperCase();
      if (!letterToRegion.has(letter)) {
        letterToRegion.set(letter, nextRegion++);
      }
      rowData.push(letterToRegion.get(letter)!);
    }
    grid.push(rowData);
  }

  if (letterToRegion.size !== size) {
    throw new Error(`Found ${letterToRegion.size} regions, expected ${size}`);
  }

  return { grid, stars };
}

// --- Library generation with resume ---

type SieveState = {
  size: number;
  stars: number;
  baseSeed: number;
  attempts: number;
  found: number;
};

function readState(stateFile: string): SieveState | null {
  try { return JSON.parse(fs.readFileSync(stateFile, "utf-8")); }
  catch { return null; }
}

function writeState(stateFile: string, state: SieveState): void {
  fs.writeFileSync(stateFile, JSON.stringify(state) + "\n");
}

type GenerateToFileOptions = {
  size: number;
  stars: number;
  count: number;
  minDiff?: number;
  maxDiff?: number;
  workers?: number;
  useInverse?: boolean;
  useBacktrack?: boolean;
};

async function generateToFile(outputFile: string, opts: GenerateToFileOptions): Promise<void> {
  const stateFile = outputFile + ".state";
  const existingState = readState(stateFile);

  if (existingState) {
    if (existingState.size !== opts.size || existingState.stars !== opts.stars) {
      throw new Error(
        `Cannot resume: state file has size=${existingState.size} stars=${existingState.stars}, ` +
        `but requested size=${opts.size} stars=${opts.stars}`
      );
    }
    console.error(`Resuming from attempt ${existingState.attempts} (${existingState.found} puzzles already found)`);
  }

  const baseSeed = existingState?.baseSeed ?? ((Date.now() ^ (Math.random() * 0x100000000)) | 0);
  const startAttemptOffset = existingState?.attempts ?? 0;
  let found = existingState?.found ?? 0;
  let latestAttempts = startAttemptOffset;

  const state: SieveState = { size: opts.size, stars: opts.stars, baseSeed, attempts: startAttemptOffset, found };

  if (!existingState) {
    fs.writeFileSync(outputFile, "");
    writeState(stateFile, state);
  }

  const onPuzzle = (p: Puzzle): void => {
    fs.appendFileSync(outputFile, encodePuzzleString(p) + "\n");
    found++;
    state.found = found;
    state.attempts = latestAttempts;
    writeState(stateFile, state);
  };

  const onProgress = (stats: { attempts: number; solved: number }): void => {
    latestAttempts = startAttemptOffset + stats.attempts;
    state.attempts = latestAttempts;
    writeState(stateFile, state);
    process.stderr.write(`\rAttempts: ${latestAttempts} | Found: ${found}`);
  };

  const { attempts } = await sieveParallel({
    size: opts.size,
    stars: opts.stars,
    count: opts.count,
    minDifficulty: opts.minDiff,
    maxDifficulty: opts.maxDiff,
    workers: opts.workers,
    baseSeed,
    startAttemptOffset,
    useInverse:   opts.useInverse,
    useBacktrack: opts.useBacktrack,
    onPuzzle,
    onProgress,
  });

  state.attempts = startAttemptOffset + attempts;
  state.found = found;
  writeState(stateFile, state);
  process.stderr.write(`\rAttempts: ${state.attempts} | Found: ${found}\n`);
  console.error(`Written to ${outputFile}`);
}

// --- Entry point ---

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

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  const args = parseArgs();
  const hasStdin = !process.stdin.isTTY;

  if (args.help === "true") {
    console.log(`Usage:
  echo "<grid>" | sieve --stars n [--trace]
  sieve --file puzzles.sbn [--verbose] [--unsolved] [--trace]
  sieve [--size n] [--stars n] [--count n] [--workers n] [--minDiff n] [--maxDiff n]
  sieve [--size n] [--stars n] [--count n] --output lib.sbn   (append/resume library)`);
  } else if (hasStdin && !args.file && !args.output && !args.size && !args.stars && !args.count) {
    const input = await readStdin();
    const stars = args.stars ? parseInt(args.stars, 10) : 2;
    const board = parseGridFromStdin(input, stars);
    traceBoard(board);
  } else if (args.file) {
    benchmark(
      fs.readFileSync(args.file, "utf-8"),
      args.verbose === "true",
      args.unsolved === "true",
      args.trace === "true",
    );
  } else {
    const size = args.size ? parseInt(args.size, 10) : 10;
    const stars = args.stars ? parseInt(args.stars, 10) : 2;
    const count = args.count ? parseInt(args.count, 10) : 1;
    const workers = args.workers ? parseInt(args.workers, 10) : undefined;
    const seed = args.seed ? parseInt(args.seed, 10) : undefined;
    const minDiff = args.minDiff ? parseInt(args.minDiff, 10) : undefined;
    const maxDiff = args.maxDiff ? parseInt(args.maxDiff, 10) : undefined;
    const useInverse   = args.inverse   === "true";
    const useBacktrack = args.backtrack === "true";

    {
      const diffRange =
        minDiff !== undefined || maxDiff !== undefined
          ? `, difficulty ${minDiff ?? 0}-${maxDiff ?? "\u221E"}`
          : "";
      console.log(
        `${size}\u00D7${size}, ${stars} stars${seed !== undefined ? `, seed ${seed}` : ""}${diffRange}\n`,
      );

      const outputFile = args.output ?? `puzzles-${size}x${stars}.sbn`;
      await generateToFile(outputFile, { size, stars, count, minDiff, maxDiff, workers, useInverse, useBacktrack });
    }
  }
}

main();
