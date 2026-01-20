import { sieve } from "./sieve";
import { layout } from "./generator";
import { solve, StepInfo } from "./solver";
import { CellState } from "./types";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value && !value.startsWith("--") ? (i++, value) : "true";
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  if (args.help === "true") {
    console.log(
      `Usage: sieve [--size n] [--stars n] [--count n] [--seed n] [--trace] [--help]`,
    );
    return;
  }

  const size = args.size ? parseInt(args.size, 10) : 10;
  const stars = args.stars ? parseInt(args.stars, 10) : 2;
  const count = args.count ? parseInt(args.count, 10) : 1;
  const seed = args.seed ? parseInt(args.seed, 10) : undefined;

  console.log(
    `${size}×${size}, ${stars} stars${seed !== undefined ? `, seed ${seed}` : ""}\n`,
  );

  if (args.trace === "true" && seed !== undefined) {
    const board = layout(size, stars, seed);
    console.log("Region grid:");
    printBoard(board.grid);
    let prevCells: CellState[][] | null = null;
    const solution = solve(board, seed, {
      onStep: (step: StepInfo) => {
        console.log(
          `\n--- Cycle ${step.cycle}: ${step.rule} (level ${step.level}) ---`,
        );
        printCellStateWithDiff(step.cells, prevCells);
        prevCells = step.cells.map((row) => [...row]);
      },
    });
    console.log(solution ? `\n=== SOLVED ===` : `\n=== STUCK ===`);
    return;
  }

  const startTime = Date.now();
  const puzzles = sieve({
    size,
    stars,
    count,
    seed,
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

function printCellStateWithDiff(cells: CellState[][], prev: CellState[][] | null) {
  const sym = { unknown: ".", marked: "X", star: "★" };
  for (let r = 0; r < cells.length; r++) {
    const line = cells[r].map((c, i) => {
      const s = sym[c];
      return prev && prev[r][i] !== c ? `\x1b[43m\x1b[30m${s}\x1b[0m` : s;
    });
    console.log(line.join(" "));
  }
}

main();
