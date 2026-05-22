import * as fs from "fs";
import { decodePuzzleString } from "./helpers/notation";
import { solveWithSteps } from "./solver";
import { computeDifficulty } from "./helpers/difficulty";
import { Coord } from "./helpers/types";

type Hint = {
  rule: string;
  level: number;
  placements: Coord[];
  marks: Coord[];
};

type PackPuzzle = {
  sbn: string;
  solution: Coord[];
  hints: Hint[];
};

type Pack = {
  id: string;
  name: string;
  version: number;
  free: boolean;
  gridSize: number;
  stars: number;
  puzzles: PackPuzzle[];
};

type ConverterOptions = {
  inputFile: string;
  id: string;
  name: string;
  free: boolean;
  outputFile: string;
  version: number;
  count?: number;
  skip?: number;
};

function extractSolution(cells: ReturnType<typeof solveWithSteps>["cells"]): Coord[] {
  const coords: Coord[] = [];
  for (let r = 0; r < cells.length; r++)
    for (let c = 0; c < cells[r].length; c++)
      if (cells[r][c] === "star") coords.push([r, c]);
  return coords;
}

export function convertToPack(opts: ConverterOptions): Pack {
  const content = fs.readFileSync(opts.inputFile, "utf-8");
  const lines = content
    .trim()
    .split("\n")
    .map((l) => l.split("#")[0].trim())
    .filter((l) => l.length > 0);

  type Entry = { sbn: string; solution: Coord[]; hints: Hint[]; difficulty: number; gridSize: number; stars: number };
  const entries: Entry[] = [];
  let skipped = 0;

  for (const sbn of lines) {
    const { board, metadata } = decodePuzzleString(sbn);
    const result = solveWithSteps(board);
    if (!result) {
      skipped++;
      continue;
    }
    const difficulty = metadata.difficulty ?? computeDifficulty(result);
    const hints: Hint[] = result.steps.map(({ rule, level, placements, marks }) => ({
      rule,
      level,
      placements,
      marks,
    }));
    entries.push({
      sbn,
      solution: extractSolution(result.cells),
      hints,
      difficulty,
      gridSize: board.grid.length,
      stars: board.stars,
    });
  }

  if (skipped > 0) process.stderr.write(`Warning: skipped ${skipped} unsolvable puzzle(s)\n`);

  entries.sort((a, b) => a.difficulty - b.difficulty);

  const skipOffset = opts.skip ?? 0;
  const selected = opts.count !== undefined
    ? entries.slice(skipOffset, skipOffset + opts.count)
    : entries.slice(skipOffset);
  if (selected.length === 0) throw new Error("No solvable puzzles found in input file");

  const first = selected[0];
  const gridSize = first.gridSize;
  const stars = first.stars;

  const puzzles: PackPuzzle[] = selected.map(({ sbn, solution, hints }) => ({ sbn, solution, hints }));

  return {
    id: opts.id,
    name: opts.name,
    version: opts.version,
    free: opts.free,
    gridSize,
    stars,
    puzzles,
  };
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      args[key] = next && !next.startsWith("--") ? (i++, next) : "true";
    }
  }
  return args;
}

function main() {
  const args = parseArgs();

  if (args.help === "true" || !args.input || !args.id || !args.name) {
    console.log(`Usage:
  tsx src/converter.ts --input <file.sbn> --id <pack-id> --name "<display name>" [options]

Options:
  --input    Path to .sbn file (required)
  --id       Pack ID, e.g. "5x5-normal" (required)
  --name     Display name, e.g. "5×5 / 1★ Normal" (required)
  --free     Mark pack as free (flag)
  --output   Output JSON file (default: <id>.json)
  --version  Pack version integer (default: 1)
  --skip     Number of puzzles to skip after sorting (default: 0)
  --count    Max number of puzzles to include`);
    if (!args.input || !args.id || !args.name) process.exit(1);
    return;
  }

  const opts: ConverterOptions = {
    inputFile: args.input,
    id: args.id,
    name: args.name,
    free: args.free === "true",
    outputFile: args.output ?? `${args.id}.json`,
    version: args.version ? parseInt(args.version, 10) : 1,
    skip: args.skip ? parseInt(args.skip, 10) : undefined,
    count: args.count ? parseInt(args.count, 10) : undefined,
  };

  process.stderr.write(`Converting ${opts.inputFile} → ${opts.outputFile}\n`);

  const pack = convertToPack(opts);
  fs.writeFileSync(opts.outputFile, JSON.stringify(pack, null, 2) + "\n");

  process.stderr.write(`Done: ${pack.puzzles.length} puzzles written to ${opts.outputFile}\n`);
}

main();
