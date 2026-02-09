import * as fs from "fs";
import { sieve } from "./sieve";
import { layout } from "./generator";
import { solve, StepInfo, RULE_METADATA } from "./solver";
import { decodePuzzleString } from "./helpers/notation";
import { Board, CellState } from "./helpers/types";

// --- Formatting ---

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function printBoard(grid: number[][]) {
  const size = grid.length;
  const colHeader =
    "    " + Array.from({ length: size }, (_, i) => LETTERS[i]).join(" ");
  console.log(colHeader);
  for (let r = 0; r < size; r++) {
    const label = String(r + 1).padStart(2);
    const row = grid[r].map((id) => LETTERS[id]).join(" ");
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
    "    " + Array.from({ length: size }, (_, i) => LETTERS[i]).join(" ");
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
  let prevCells: CellState[][] | null = null;
  const start = Date.now();
  const result = solve(board, {
    onStep: (step: StepInfo) => {
      console.log(
        `\n--- Cycle ${step.cycle}: ${step.rule} (level ${step.level}) ---`,
      );
      printCellStateWithDiff(step.cells, prevCells);
      prevCells = step.cells.map((row) => [...row]);
    },
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const difficulty = result
    ? Math.round(result.maxLevel * 4 + result.cycles / 4)
    : null;
  console.log(
    result
      ? `\n=== SOLVED === ${elapsed}s | difficulty: ${difficulty}`
      : `\n=== STUCK === ${elapsed}s`,
  );
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

  const ruleStats = new Map<string, { count: number; puzzlesUsed: Set<number> }>();
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

    if (trace) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Puzzle ${i + 1}: ${puzzleStr}`);
      console.log(`${"=".repeat(60)}`);
      console.log("Region grid:");
      printBoard(puzzle.grid);
    }

    let prevCells: CellState[][] | null = null;
    const result = solve(puzzle, {
      timing: ruleTiming,
      onStep: (step: StepInfo) => {
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

  console.log("\nDifficulty distribution:");
  const easy = difficulties.filter((d) => d <= 20).length;
  const medium = difficulties.filter((d) => d > 20 && d <= 40).length;
  const hard = difficulties.filter((d) => d > 40).length;
  console.log(`  Easy (1-20):    ${easy} puzzles`);
  console.log(`  Medium (21-40): ${medium} puzzles`);
  console.log(`  Hard (41+):     ${hard} puzzles`);

  const solveRate = ((solved / lines.length) * 100).toFixed(0);
  console.log(`\nSolve rate: ${solved}/${lines.length} (${solveRate}%)`);
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

const args = parseArgs();

if (args.help === "true") {
  console.log(`Usage:
  sieve --file puzzles.sbn [--verbose] [--unsolved] [--trace]
  sieve [--size n] [--stars n] [--count n] [--seed n] [--trace]
  sieve [--minDiff n] [--maxDiff n]`);
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

  if (args.trace === "true" && seed !== undefined) {
    traceBoard(layout(size, stars, seed));
  } else {
    const diffRange =
      minDiff !== undefined || maxDiff !== undefined
        ? `, difficulty ${minDiff ?? 0}-${maxDiff ?? "\u221E"}`
        : "";
    console.log(
      `${size}\u00D7${size}, ${stars} stars${seed !== undefined ? `, seed ${seed}` : ""}${diffRange}\n`,
    );

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
}
