import * as fs from "fs";
import { sieve } from "./sieve";
import { layout } from "./generator";
import { solve, isValidLayout, StepInfo } from "./solver";
import { Board, CellState } from "./helpers/types";
import { parsePuzzle } from "./helpers/parsePuzzle";

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
  sieve --sbf puzzles.sbf [--verbose]   # solve SBF file and track rule usage
  sieve --sbf puzzles.sbf --unsolved    # output only unsolved puzzles
  sieve --sbf puzzles.sbf --trace       # trace each puzzle step by step`);
    return;
  }

  // SBF mode: solve puzzles and track rule usage
  if (args.sbf) {
    const verbose = args.verbose === "true";
    const unsolved = args.unsolved === "true";
    const trace = args.trace === "true";
    await solveSbfFile(args.sbf, verbose, unsolved, trace);
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
    const board = layout(size, stars, seed);
    console.log("Region grid:");
    printBoard(board.grid);
    let prevCells: CellState[][] | null = null;
    const traceStart = Date.now();
    const result = solve(board, {
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
  const width = Math.max(...grid.flat()).toString().length;
  for (const row of grid)
    console.log(row.map((n) => n.toString().padStart(width)).join(" "));
}

function printCellStateWithDiff(
  cells: CellState[][],
  prev: CellState[][] | null,
) {
  const sym = { unknown: ".", marked: "X", star: "★" };
  for (let r = 0; r < cells.length; r++) {
    const line = cells[r].map((c, i) => {
      const s = sym[c];
      return prev && prev[r][i] !== c ? `\x1b[43m\x1b[30m${s}\x1b[0m` : s;
    });
    console.log(line.join(" "));
  }
}

function solveFromInput(input: string, stars: number) {
  const board = parsePuzzle(input, stars);

  if (!isValidLayout(board)) {
    console.log("Invalid layout");
    process.exit(1);
  }

  console.log(`${board.grid.length}x${board.grid.length}, ${stars} star(s)`);
  console.log("\nRegion grid:");
  printBoard(board.grid);

  let prevCells: CellState[][] | null = null;
  const solveStart = Date.now();

  const result = solve(board, {
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

/**
 * Parse SBF format: {size}x{stars}.{regions_base36}
 * Example: 10x2.0001112233...
 */
function parseSbf(sbf: string): Board {
  const match = sbf.match(/^(\d+)x(\d+)\.([0-9a-p]+)$/);
  if (!match) {
    throw new Error(`Invalid SBF format: ${sbf}`);
  }

  const size = parseInt(match[1], 10);
  const stars = parseInt(match[2], 10);
  const regionsBase36 = match[3];

  if (regionsBase36.length !== size * size) {
    throw new Error(
      `Region string length ${regionsBase36.length} doesn't match ${size}x${size}=${size * size}`,
    );
  }

  // Convert base36 chars to region IDs (0→0, 1→1, ..., 9→9, a→10, b→11, ..., p→25)
  const grid: number[][] = [];
  for (let row = 0; row < size; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < size; col++) {
      const char = regionsBase36[row * size + col];
      const regionId = parseInt(char, 26); // base26 covers 0-9 and a-p
      rowData.push(regionId);
    }
    grid.push(rowData);
  }

  return { grid, stars };
}

// Rule metadata for reporting (must match solver.ts allRules)
const RULE_METADATA: { name: string; level: number }[] = [
  { name: "Star Neighbors", level: 0 },
  { name: "Row Complete", level: 0 },
  { name: "Column Complete", level: 0 },
  { name: "Region Complete", level: 0 },
  { name: "Forced Placement", level: 0 },
  { name: "2×2 Tiling", level: 3 },
  { name: "1×n Confinement", level: 3 },
  { name: "Pressured Exclusion", level: 5 },
  { name: "Finned Counts", level: 5 },
  { name: "Composite Regions", level: 6 },
];

interface RuleStats {
  count: number;
  puzzlesUsed: Set<number>;
}

async function solveSbfFile(
  filePath: string,
  verbose: boolean,
  filterUnsolved: boolean = false,
  trace: boolean = false,
) {
  // Read SBF file (support /dev/stdin)
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

  // Initialize rule stats
  const ruleStats = new Map<string, RuleStats>();
  for (const { name } of RULE_METADATA) {
    ruleStats.set(name, { count: 0, puzzlesUsed: new Set() });
  }

  let solved = 0;
  const difficulties: number[] = [];
  const unsolvedPuzzles: { index: number; sbf: string; reason: string }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < lines.length; i++) {
    const sbf = lines[i];

    let board: Board;
    try {
      board = parseSbf(sbf);
    } catch (e) {
      unsolvedPuzzles.push({
        index: i + 1,
        sbf,
        reason: `PARSE ERROR: ${(e as Error).message}`,
      });
      if (verbose && !filterUnsolved) {
        console.log(`Puzzle ${i + 1}: PARSE ERROR - ${(e as Error).message}`);
      }
      continue;
    }

    if (!isValidLayout(board)) {
      unsolvedPuzzles.push({ index: i + 1, sbf, reason: "INVALID LAYOUT" });
      if (verbose && !filterUnsolved) {
        console.log(`Puzzle ${i + 1}: INVALID LAYOUT`);
      }
      continue;
    }

    // Trace mode: show full board and steps
    if (trace) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Puzzle ${i + 1}: ${sbf}`);
      console.log(`${"=".repeat(60)}`);
      console.log("Region grid:");
      printBoard(board.grid);
    }

    const puzzleRules: string[] = [];
    let prevCells: CellState[][] | null = null;
    const result = solve(board, {
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
      unsolvedPuzzles.push({ index: i + 1, sbf, reason: "STUCK" });
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
    for (const { index, sbf, reason } of unsolvedPuzzles) {
      console.log(`${sbf} # puzzle ${index}: ${reason}`);
    }
    return;
  }

  if (!verbose) {
    process.stdout.write("\r");
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Processed ${lines.length} puzzles in ${elapsed}s\n`);

  // Rule usage summary
  console.log("Rule Usage Summary:");
  const sortedRules = [...ruleStats.entries()].sort((a, b) => {
    // Sort by level, then by count
    const levelA = RULE_METADATA.find((r) => r.name === a[0])?.level ?? 0;
    const levelB = RULE_METADATA.find((r) => r.name === b[0])?.level ?? 0;
    if (levelA !== levelB) return levelA - levelB;
    return b[1].count - a[1].count;
  });

  for (const [name, stats] of sortedRules) {
    const level = RULE_METADATA.find((r) => r.name === name)?.level ?? 0;
    const pct = ((stats.puzzlesUsed.size / lines.length) * 100).toFixed(0);
    const padding = " ".repeat(Math.max(0, 22 - name.length));
    console.log(
      `  ${name}${padding}(L${level}): ${stats.count} times (${pct}% of puzzles)`,
    );
  }

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
