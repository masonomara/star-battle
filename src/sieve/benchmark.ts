import { solve, StepInfo, RULE_METADATA } from "./solver";
import { decodePuzzleString } from "./helpers/notation";
import { Board, CellState, computeDifficulty } from "./helpers/types";
import { printBoard, printCellStateWithDiff } from "./format";

export interface BenchmarkOptions {
  verbose?: boolean;
  unsolved?: boolean;
  trace?: boolean;
}

interface RuleStats {
  count: number;
  puzzlesUsed: Set<number>;
}

export function benchmark(content: string, options: BenchmarkOptions = {}) {
  const { verbose = false, unsolved: filterUnsolved = false, trace = false } = options;

  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    console.log("No puzzles found in file");
    return;
  }

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
      const difficulty = computeDifficulty(result.maxLevel, result.cycles);
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
