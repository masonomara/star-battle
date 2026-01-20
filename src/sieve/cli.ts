import { sieve } from "./sieve";

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

function main() {
  const args = parseArgs();

  console.log("Options:", {
    size: args.size ? parseInt(args.size, 10) : 10,
    stars: args.stars ? parseInt(args.stars, 10) : 2,
    count: args.count ? parseInt(args.count, 10) : 1,
    seed: args.seed ? parseInt(args.seed, 10) : undefined,
  });
  console.log("---");

  let generated = 0;
  const puzzles = sieve({
    size: args.size ? parseInt(args.size, 10) : undefined,
    stars: args.stars ? parseInt(args.stars, 10) : undefined,
    count: args.count ? parseInt(args.count, 10) : undefined,
    seed: args.seed ? parseInt(args.seed, 10) : undefined,
    onProgress: (solved, attempts) => {
      generated = attempts;
      process.stdout.write(`\rGenerated: ${attempts} | Solved: ${solved}`);
    },
  });

  console.log(`\nGenerated: ${generated} | Solved: ${puzzles.length}`);

  if (puzzles.length === 0) {
    console.log("\nNo solvable puzzles found (max attempts reached)");
    console.log("Try smaller grid or fewer stars, or add more solver rules");
  } else {
    console.log("");
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

main();
