import * as fs from "fs";
import { sieve } from "./sieve";
import { layout } from "./generator";
import { solve, StepInfo, RULE_METADATA } from "./solver";
import { Board, CellState } from "./helpers/types";
import { decodePuzzleString } from "./helpers/notation";

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

async function main() {
  const args = parseArgs();
  if (args.help === "true") {
    console.log(`Usage:
  sieve [--size n] [--stars n] [--count n] [--seed n] [--trace]
  sieve [--minDiff n] [--maxDiff n]     # filter by difficulty range
  echo "A B B..." | sieve [--stars n]   # solve from input
  sieve --file puzzles.sbn [--verbose]   # solve puzzle file and track rule usage
  sieve --file puzzles.sbn --unsolved    # output only unsolved puzzles
  sieve --file puzzles.sbn --trace       # trace each puzzle step by step`);
    return;
  }

  // File mode: solve puzzles and track rule usage
  if (args.file) {
    const verbose = args.verbose === "true";
    const unsolved = args.unsolved === "true";
    const trace = args.trace === "true";
    await solvePuzzleFile(args.file, verbose, unsolved, trace);
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
      ? `, difficulty ${minDiff ?? 0}-${maxDiff ?? "∞"}`
      : "";
  console.log(
    `${size}×${size}, ${stars} stars${seed !== undefined ? `, seed ${seed}` : ""}${diffRange}\n`,
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
      ? Math.round(result.maxLevel * 4 + result.cycles / 4)
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

function printBoard(grid: number[][]) {
  const size = grid.length;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => letters[i]).join(" ");
  console.log(colHeader);
  for (let r = 0; r < size; r++) {
    const label = String(r + 1).padStart(2);
    const row = grid[r].map((id) => letters[id]).join(" ");
    console.log(`${label}  ${row}`);
  }
}

function printCellStateWithDiff(
  cells: CellState[][],
  prev: CellState[][] | null,
) {
  const size = cells.length;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const sym = { unknown: ".", marked: "X", star: "★" };
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => letters[i]).join(" ");
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
    ? Math.round(result.maxLevel * 4 + result.cycles / 4)
    : null;
  console.log(
    result
      ? `\n=== SOLVED === ${solveTime}s | difficulty: ${difficulty}`
      : `\n=== STUCK === ${solveTime}s`,
  );
}

interface RuleStats {
  count: number;
  puzzlesUsed: Set<number>;
}

async function solvePuzzleFile(
  filePath: string,
  verbose: boolean,
  filterUnsolved: boolean = false,
  trace: boolean = false,
) {
  // Read puzzle file (support /dev/stdin)
  let content: string;
  if (filePath === "/dev/stdin") {
    content = await readStdin();
  } else {
    content = fs.readFileSync(filePath, "utf-8");
  }

  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    console.log("No puzzles found in file");
    return;
  }

  // Initialize rule stats and timing
  const ruleStats = new Map<string, RuleStats>();
  for (const { name } of RULE_METADATA) {
    ruleStats.set(name, { count: 0, puzzlesUsed: new Set() });
  }
  const ruleTiming = new Map<string, number>();

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

    // Trace mode: show full board and steps
    if (trace) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Puzzle ${i + 1}: ${puzzleStr}`);
      console.log(`${"=".repeat(60)}`);
      console.log("Region grid:");
      printBoard(puzzle.grid);
    }

    const puzzleRules: string[] = [];
    let prevCells: CellState[][] | null = null;
    const result = solve(puzzle, {
      timing: ruleTiming,
      onStep: (step: StepInfo) => {
        puzzleRules.push(step.rule);
        const stats = ruleStats.get(step.rule);
        if (stats) {
          stats.count++;
          stats.puzzlesUsed.add(i);
        }
        if (trace) {
          console.log(
            `\n--- Cycle ${step.cycle}: ${step.rule} (level ${step.level}) ---`,
          );
          printCellStateWithDiff(step.cells, prevCells);
          prevCells = step.cells.map((row) => [...row]);
        }
      },
    });

    if (result) {
      solved++;
      const difficulty = Math.round(result.maxLevel * 4 + result.cycles / 4);
      difficulties.push(difficulty);

      if (trace) {
        console.log(`\n=== SOLVED === difficulty: ${difficulty}`);
      } else if (verbose && !filterUnsolved) {
        console.log(
          `Puzzle ${i + 1}: SOLVED (difficulty: ${difficulty}, cycles: ${result.cycles}, maxLevel: ${result.maxLevel})`,
        );
      }
    } else {
      unsolvedPuzzles.push({ index: i + 1, line, reason: "STUCK" });
      if (trace) {
        console.log(`\n=== STUCK ===`);
      } else if (verbose && !filterUnsolved) {
        console.log(`Puzzle ${i + 1}: STUCK`);
      }
    }

    // Progress indicator for non-verbose mode
    if (!verbose && !filterUnsolved && (i + 1) % 100 === 0) {
      process.stdout.write(`\rProcessed: ${i + 1}/${lines.length}`);
    }
  }

  // If filtering unsolved, output them and exit
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

  // Rule usage summary
  console.log("Rule Usage:");
  const sortedRules = [...ruleStats.entries()].sort((a, b) => {
    const indexA = RULE_METADATA.findIndex((r) => r.name === a[0]);
    const indexB = RULE_METADATA.findIndex((r) => r.name === b[0]);
    return indexA - indexB;
  });

  const maxName = Math.max(...sortedRules.map(([n]) => n.length));
  let ruleTimeTotal = 0;

  for (const [name, stats] of sortedRules) {
    const level = RULE_METADATA.find((r) => r.name === name)?.level ?? 0;
    const pct = ((stats.puzzlesUsed.size / lines.length) * 100).toFixed(0);
    const ms = ruleTiming.get(name) ?? 0;
    ruleTimeTotal += ms;
    const time = (ms / 1000).toFixed(2);
    const pad = " ".repeat(maxName - name.length + 2);
    console.log(
      `  ${name}${pad}L${level}  ${String(stats.count).padStart(6)}  ${pct.padStart(3)}%  ${time.padStart(6)}s`,
    );
  }

  console.log(
    `  ${"Rule time".padEnd(maxName + 2)}${" ".repeat(18)}${(ruleTimeTotal / 1000).toFixed(2).padStart(6)}s`,
  );

  // Difficulty distribution
  console.log("\nDifficulty distribution:");
  const easy = difficulties.filter((d) => d <= 20).length;
  const medium = difficulties.filter((d) => d > 20 && d <= 40).length;
  const hard = difficulties.filter((d) => d > 40).length;
  console.log(`  Easy (1-20):    ${easy} puzzles`);
  console.log(`  Medium (21-40): ${medium} puzzles`);
  console.log(`  Hard (41+):     ${hard} puzzles`);

  // Solve rate
  const solveRate = ((solved / lines.length) * 100).toFixed(0);
  console.log(`\nSolve rate: ${solved}/${lines.length} (${solveRate}%)`);
}

main();
