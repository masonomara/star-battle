import { sieve } from "./sieve";
import { layout } from "./generator";
import { solve, StepInfo } from "./solver";
import { CellState } from "./types";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        args[key] = value;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: sieve [options]

Options:
  --size <n>     Grid size (default: 10)
  --stars <n>    Stars per row/column/region (default: 2)
  --count <n>    Number of puzzles to generate (default: 1)
  --seed <n>     Random seed for reproducibility
  --trace        Show step-by-step solve process (use with --seed)
  --help         Show this help`);
}

function main() {
  const args = parseArgs();

  if (args.help === "true") {
    printHelp();
    return;
  }

  const size = args.size ? parseInt(args.size, 10) : 10;
  const stars = args.stars ? parseInt(args.stars, 10) : 2;
  const count = args.count ? parseInt(args.count, 10) : 1;
  const seed = args.seed ? parseInt(args.seed, 10) : undefined;
  const trace = args.trace === "true";

  const seedDisplay = seed !== undefined ? `, seed ${seed}` : "";
  console.log(`${size}×${size}, ${stars} stars${seedDisplay}`);
  console.log("");

  // Trace mode: show step-by-step solve process
  if (trace && seed !== undefined) {
    const board = layout(size, stars, seed);

    console.log("Region grid:");
    printBoard(board.grid);
    console.log("");

    let prevCells: CellState[][] | null = null;

    const solution = solve(board, seed, {
      onStep: (step: StepInfo) => {
        console.log(
          `--- Cycle ${step.cycle}: ${step.rule} (level ${step.level}) ---`,
        );
        printCellStateWithDiff(step.cells, prevCells);
        console.log("");
        prevCells = step.cells.map((row) => [...row]);
      },
    });

    console.log(solution ? `=== SOLVED ===` : `=== STUCK ===`);
    return;
  }

  const startTime = Date.now();

  const puzzles = sieve({
    size,
    stars,
    count,
    seed,
    onProgress: (solved, attempts) => {
      process.stdout.write(`\rGenerated: ${attempts} | Solved: ${solved}`);
    },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(` | ${elapsed}s\n`);

  if (puzzles.length === 0) {
    console.log("No solvable puzzles found (max attempts reached)");
    console.log("Try smaller grid or fewer stars, or add more solver rules");
  } else {
    for (const puzzle of puzzles) {
      console.log(`Seed: ${puzzle.seed}`);
      console.log(
        `Difficulty: ${puzzle.difficulty} (cycles: ${puzzle.cycles}, maxLevel: ${puzzle.maxLevel})`,
      );
      printBoard(puzzle.board.grid);
      console.log("");
    }
  }
}

function printBoard(grid: number[][]) {
  const size = grid.length;
  const width = Math.max(...grid.flat()).toString().length;

  for (let row = 0; row < size; row++) {
    const line = grid[row].map((n) => n.toString().padStart(width)).join(" ");
    console.log(line);
  }
}

function printCellStateWithDiff(
  cells: CellState[][],
  prev: CellState[][] | null,
) {
  const symbols: Record<CellState, string> = {
    unknown: ".",
    marked: "X",
    star: "★",
  };

  // ANSI codes for highlighting
  const YELLOW_BG = "\x1b[43m\x1b[30m"; // Yellow background, black text
  const RESET = "\x1b[0m";

  for (let row = 0; row < cells.length; row++) {
    const parts: string[] = [];
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col];
      const symbol = symbols[cell];
      const changed = prev !== null && prev[row][col] !== cell;

      if (changed) {
        parts.push(`${YELLOW_BG}${symbol}${RESET}`);
      } else {
        parts.push(symbol);
      }
    }
    console.log(parts.join(" "));
  }
}

main();
