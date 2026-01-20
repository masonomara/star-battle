import { sieve } from "./sieve";
import { layout } from "./generator";
import { solveWithDetails, StuckState } from "./solver";
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
  --verbose      Show timing and solver metrics
  --debug        Show stuck state when puzzle can't be solved (use with --seed)
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
  const verbose = args.verbose === "true";
  const debug = args.debug === "true";

  const seedDisplay = seed !== undefined ? `, seed ${seed}` : "";
  console.log(`${size}×${size}, ${stars} stars${seedDisplay}`);
  console.log("");

  // Debug mode: try to solve a specific seed and show stuck state
  if (debug && seed !== undefined) {
    const board = layout(size, stars, seed);
    const result = solveWithDetails(board, seed);

    if (result.solved) {
      console.log("Puzzle solved successfully!");
      console.log(`Cycles: ${result.solution.cycles}, Max Level: ${result.solution.maxLevel}`);
      console.log("");
      printBoard(board.grid);
      console.log("");
      printCellState(result.solution.cells);
    } else {
      console.log("Puzzle STUCK");
      printStuckState(result.stuck);
    }
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

  if (verbose) {
    console.log(` | ${elapsed}s`);
  } else {
    console.log("");
  }
  console.log("");

  if (puzzles.length === 0) {
    console.log("No solvable puzzles found (max attempts reached)");
    console.log("Try smaller grid or fewer stars, or add more solver rules");
  } else {
    for (const puzzle of puzzles) {
      console.log(`Seed: ${puzzle.seed}`);
      if (verbose) {
        console.log(`Difficulty: ${puzzle.difficulty} (cycles: ${puzzle.cycles}, maxLevel: ${puzzle.maxLevel})`);
      } else {
        console.log(`Difficulty: ${puzzle.difficulty}`);
      }
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

function printCellState(cells: CellState[][]) {
  const symbols: Record<CellState, string> = {
    unknown: ".",
    marked: "X",
    star: "★",
  };

  for (const row of cells) {
    console.log(row.map((c) => symbols[c]).join(" "));
  }
}

function printStuckState(stuck: StuckState) {
  const cells = stuck.cells;
  const size = cells.length;

  // Count stats
  let stars = 0;
  let marks = 0;
  let unknown = 0;
  for (const row of cells) {
    for (const cell of row) {
      if (cell === "star") stars++;
      else if (cell === "marked") marks++;
      else unknown++;
    }
  }

  const totalStars = stuck.board.stars * size;

  console.log(`Cycles: ${stuck.cycles}`);
  console.log(`Max Level: ${stuck.maxLevel}`);
  console.log(`Last Rule: ${stuck.lastRule ?? "none"}`);
  console.log(`Stars: ${stars}/${totalStars}  Marks: ${marks}  Unknown: ${unknown}`);
  console.log("");

  console.log("Region grid:");
  printBoard(stuck.board.grid);
  console.log("");

  console.log("Cell state (★=star, X=marked, .=unknown):");
  printCellState(cells);
}

main();
