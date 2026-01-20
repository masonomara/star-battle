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

  const options = {
    size: args.size ? parseInt(args.size, 10) : undefined,
    stars: args.stars ? parseInt(args.stars, 10) : undefined,
    count: args.count ? parseInt(args.count, 10) : undefined,
    seed: args.seed ? parseInt(args.seed, 10) : undefined,
    mode: args.mode as "puzzle" | "board" | undefined,
  };

  const result = sieve(options);

  console.log("Options:", options);
  console.log("---");

  if ("puzzles" in result) {
    console.log(`Generated ${result.puzzles.length} puzzle(s) in ${result.attempts} attempts\n`);
    for (const puzzle of result.puzzles) {
      console.log(`Seed: ${puzzle.seed}`);
      console.log(
        `Difficulty: ${puzzle.difficulty} (cycles: ${puzzle.cycles}, maxLevel: ${puzzle.maxLevel})`,
      );
      printBoard(puzzle.board.grid);
      console.log("");
    }
  } else if ("boards" in result) {
    console.log(`Generated ${result.boards.length} board(s):\n`);
    for (const { board, seed } of result.boards) {
      console.log(`Seed: ${seed}`);
      printBoard(board.grid);
      console.log("");
    }
  } else {
    console.log(`Seed: ${result.seed}`);
    printBoard(result.board.grid);
    if (result.puzzle) {
      console.log(
        `\nSolvable! Difficulty: ${result.puzzle.difficulty} (cycles: ${result.puzzle.cycles}, maxLevel: ${result.puzzle.maxLevel})`,
      );
    } else {
      console.log("\nNot solvable with current rules");
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
