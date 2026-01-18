import {
  Grid,
  CellState,
  PuzzleDefinition,
  CustomPuzzleInput,
  Region,
} from "./types";
import { layout, layoutVerbose, validateLayout, formatRegions } from "./layout";
import { solve, solveVerbose, formatGrid } from "./solver";

export * from "./types";
export * from "./rules";
export * from "./solver";
export * from "./layout";

export interface GenerateOptions {
  size: number;
  starsPerRegion?: number;
  maxAttempts?: number;
  verbose?: boolean;
  seed?: number;
}

export interface GenerateResult {
  success: boolean;
  puzzle?: PuzzleDefinition;
  attempts: number;
  error?: string;
}

// Generate a valid puzzle using the sieve approach
export function generate(options: GenerateOptions): GenerateResult {
  const {
    size,
    starsPerRegion = size <= 6 ? 1 : 2,
    maxAttempts = 1000,
    verbose = false,
    seed,
  } = options;

  const log = (msg: string) => {
    if (verbose) console.log(msg);
  };

  log(
    `Starting puzzle generation: ${size}x${size}, ${starsPerRegion} stars per region`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Generate candidate layout
    const layoutResult = layout({
      size,
      starsPerRegion,
      seed: seed ? seed + attempt : undefined,
    });

    // Validate layout
    const validation = validateLayout(layoutResult.grid);
    if (!validation.valid) {
      log(
        `Attempt ${attempt}: Invalid layout - ${validation.errors.join(", ")}`,
      );
      continue;
    }

    // Try to solve
    const solveResult = solve(layoutResult.grid, { verbose });

    if (solveResult.solved && solveResult.solution) {
      log(`Attempt ${attempt}: Valid puzzle found!`);

      const puzzle: PuzzleDefinition = {
        size,
        starsPerRegion,
        regions: layoutResult.grid.regions,
        solution: solveResult.solution.stars,
        difficulty: {
          cycles: solveResult.cycles,
          maxRuleTier: solveResult.maxRuleTier,
        },
      };

      return {
        success: true,
        puzzle,
        attempts: attempt,
      };
    }

    if (verbose && attempt % 100 === 0) {
      log(`Attempt ${attempt}: No solution found, continuing...`);
    }
  }

  return {
    success: false,
    attempts: maxAttempts,
    error: `Failed to generate valid puzzle after ${maxAttempts} attempts`,
  };
}

// Parse custom puzzle input
export function parseCustomPuzzle(input: CustomPuzzleInput): Grid {
  const { size, starsPerRegion = size <= 6 ? 1 : 2, regions } = input;

  let regionGrid: number[][];

  if (typeof regions[0] === "string") {
    // Parse string format like ["AABBC", "AABCC", ...]
    const stringRows = regions as string[];
    regionGrid = stringRows.map((row) => {
      return [...row].map((char) => {
        const code = char.toUpperCase().charCodeAt(0);
        return code - 65; // A=0, B=1, etc.
      });
    });
  } else {
    regionGrid = regions as number[][];
  }

  // Build region list
  const regionMap = new Map<number, Cell[]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = regionGrid[r][c];
      if (!regionMap.has(regionId)) {
        regionMap.set(regionId, []);
      }
      regionMap.get(regionId)!.push({ row: r, col: c });
    }
  }

  const regionList: Region[] = [];
  for (const [id, cells] of regionMap) {
    regionList.push({ id, cells });
  }
  regionList.sort((a, b) => a.id - b.id);

  // Initialize cell states
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array(size).fill(CellState.UNKNOWN),
  );

  return {
    size,
    starsPerRegion,
    cells,
    regions: regionGrid,
    regionList,
  };
}

// Solve a custom puzzle from string input
export function solveCustom(input: CustomPuzzleInput, verbose = false) {
  const grid = parseCustomPuzzle(input);

  console.log("Input puzzle:");
  console.log(formatRegions(grid));
  console.log();

  const result = solve(grid, { verbose });

  console.log("Result:");
  console.log(formatGrid(result.grid));
  console.log();
  console.log(`Solved: ${result.solved}`);
  console.log(`Cycles: ${result.cycles}`);
  console.log(`Max tier used: ${result.maxRuleTier}`);
  console.log(`Rules applied: ${result.rulesApplied.length}`);

  if (result.solution) {
    console.log(
      `Stars: ${result.solution.stars.map((s) => `(${s.row},${s.col})`).join(", ")}`,
    );
  }

  return result;
}

// Generate with verbose output
export function generateVerbose(size: number, seed?: number): GenerateResult {
  return generate({ size, verbose: true, seed });
}
