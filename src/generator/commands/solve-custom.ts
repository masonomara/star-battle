import type { Grid, Cell, CellState, SolverGrid, Difficulty } from "../types";
import { initializeSolver, solve, getHighestDifficulty, isSolved, isInvalid } from "../solver";
import { visualizeGrid } from "../layout";
import { allRules } from "../rules";
import { DIFFICULTY_ORDER } from "../types";

/**
 * Parse a letter-grid string into a Grid object.
 *
 * Example input:
 *   A A B B C
 *   A A B C C
 *   D D B C C
 *   D E E C C
 *   D E E E C
 *
 * Or without spaces:
 *   AABBC
 *   AABCC
 *   DDBCC
 *   DEECC
 *   DEEEC
 */

/*
npx tsx -e "
import { solveCustom } from './src/generator/solve-custom.ts';
solveCustom(\`
AABBBBBBB
ACCCCDBEB
ACCCDDEEB
ACCDDEEEB
ACAADDEEB
AAAFDDDEB
GAFFFDDHH
GFFFFFDDH
GIIIDDDHH
\`, 1);
"
*/

/*
npx tsx -e "
import { solveCustom } from './src/generator/solve-custom.ts';
solveCustom(\`
AAAAAGGGGGGGOOOOSSSSSSSSS
AAAGGGGGGHGGGOOOOOOSSSSSS
AAAAAHHGHHHLGLPOOOOOSSSSS
AAAHHHHGHHHLLLPPOOOOSSSSS
AAAAHIHHHHLLLPPPPOOPPSYSS
AAAAHIIIHHHLPPPPPPOPYYYSY
AAAAAIIIILLLPPPPPPPPPYYYY
ABAAAAAIIIIPPPPPPPPQYYXXY
ABAAAAIIIIIIIIPQPQPQQXXXX
BBBIIIIIIIIIIPPQQQPQQXXXX
BBBBBCCICMMIMMMQQQQQXXXXX
BBCCBBCCCCMIMQMQQQQQQXXXX
BCCCCCCCCCMMMQQQQQUXXXXXX
BCCCCCCCCCMMMQQQQQUUXXXUU
CCCCCCCCCCMMNQRRRQUUUUUUU
DCDDDCJCNCMMNRRRRUUUUUUWW
DCDJJJJJNNNNNRRRRVUVUUUUW
DDDJEEEJJKKNRRRRRVUVUUWUW
DDEEEEJJKKKNRRRRRVVVVUWWW
DDEEEEEJKJKNRKRRRVWWVVWWW
EEEEEEJJJJKNKKKRRVWWWWWWW
EEEFEEFJFJKKKKKRRVVWWWWWW
EEEFFEFFFKKKKKKKKTVTWWWWW
FEFFFFFKFKKKKKKKKTTTWWWWW
FFFFKKKKKKKKKKKTTTTTTTTTW
\`, 1);
"
*/

export function parseGrid(input: string): Grid {
  const lines = input
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Remove spaces if present
  const rows = lines.map((line) => line.replace(/\s+/g, "").split(""));
  const size = rows.length;

  // Validate square grid
  for (const row of rows) {
    if (row.length !== size) {
      throw new Error(
        `Grid must be square. Expected ${size} cols, got ${row.length}`
      );
    }
  }

  // Group cells by letter
  const shapeMap = new Map<string, Cell[]>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const letter = rows[row][col];
      if (!shapeMap.has(letter)) {
        shapeMap.set(letter, []);
      }
      shapeMap.get(letter)!.push({ row, col });
    }
  }

  // Convert to shapes array (sorted by letter for consistency)
  const sortedLetters = [...shapeMap.keys()].sort();
  const shapes = sortedLetters.map((letter) => shapeMap.get(letter)!);

  // Validate: should have exactly `size` shapes
  if (shapes.length !== size) {
    throw new Error(
      `Expected ${size} shapes for a ${size}x${size} grid, got ${shapes.length}`
    );
  }

  return { size, shapes };
}

function visualizeBoard(grid: Grid, board: CellState[][]): string {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const shapeMap: number[][] = Array.from({ length: grid.size }, () =>
    Array(grid.size).fill(-1)
  );
  grid.shapes.forEach((shape, id) =>
    shape.forEach((c) => (shapeMap[c.row][c.col] = id))
  );
  return board
    .map((row, r) =>
      row
        .map((cell, c) => {
          if (cell === "star") return "*";
          if (cell === "eliminated") return ".";
          return labels[shapeMap[r][c]] || "?";
        })
        .join(" ")
    )
    .join("\n");
}

function boardDiff(before: CellState[][], after: CellState[][]): { stars: Cell[]; eliminated: Cell[] } {
  const stars: Cell[] = [];
  const eliminated: Cell[] = [];
  for (let row = 0; row < before.length; row++) {
    for (let col = 0; col < before[row].length; col++) {
      if (before[row][col] !== after[row][col]) {
        if (after[row][col] === "star") stars.push({ row, col });
        if (after[row][col] === "eliminated") eliminated.push({ row, col });
      }
    }
  }
  return { stars, eliminated };
}

function cloneBoard(board: CellState[][]): CellState[][] {
  return board.map(row => [...row]);
}

/**
 * Solve with step-by-step verbose output
 */
export function solveCustomVerbose(input: string, starsPerContainer: number) {
  const grid = parseGrid(input);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`VERBOSE SOLVE: ${grid.size}x${grid.size} puzzle (${starsPerContainer}-star)`);
  console.log(`${"=".repeat(60)}\n`);

  console.log("Initial Layout:");
  console.log(visualizeGrid(grid));
  console.log();

  const solverGrid = initializeSolver(grid, starsPerContainer);
  const maxIterations = grid.size * grid.size * 2;

  const allowed = [...allRules].sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
  );

  let iteration = 0;
  const rulesApplied: string[] = [];

  for (let i = 1; i <= maxIterations; i++) {
    iteration = i;
    const beforeBoard = cloneBoard(solverGrid.board);
    let changed = false;
    let appliedRule = "";

    for (const rule of allowed) {
      if (rule.apply(solverGrid)) {
        appliedRule = rule.name;
        rulesApplied.push(rule.name);
        changed = true;
        break;
      }
    }

    if (changed) {
      const diff = boardDiff(beforeBoard, solverGrid.board);
      const starsPlaced = solverGrid.board.flat().filter(c => c === "star").length;
      const eliminated = solverGrid.board.flat().filter(c => c === "eliminated").length;
      const empty = solverGrid.board.flat().filter(c => c === "empty").length;

      console.log(`--- Step ${i}: ${appliedRule} ---`);
      if (diff.stars.length > 0) {
        console.log(`  Placed stars: ${diff.stars.map(c => `(${c.row},${c.col})`).join(", ")}`);
      }
      if (diff.eliminated.length > 0) {
        console.log(`  Eliminated: ${diff.eliminated.map(c => `(${c.row},${c.col})`).join(", ")}`);
      }
      console.log(`  Progress: ${starsPlaced} stars, ${eliminated} eliminated, ${empty} empty`);
      console.log();
    }

    if (isSolved(solverGrid)) {
      console.log(`\n${"=".repeat(60)}`);
      console.log("SOLVED!");
      console.log(`${"=".repeat(60)}\n`);
      console.log(`Iterations: ${iteration}`);
      console.log(`Difficulty: ${getHighestDifficulty(rulesApplied)}`);
      console.log(`\nFinal Solution:`);
      console.log(visualizeBoard(grid, solverGrid.board));
      return { solved: true, board: solverGrid.board, iterations: iteration, rulesApplied };
    }

    if (isInvalid(solverGrid)) {
      console.log(`\n${"=".repeat(60)}`);
      console.log("INVALID STATE REACHED!");
      console.log(`${"=".repeat(60)}\n`);
      console.log(`\nCurrent Board:`);
      console.log(visualizeBoard(grid, solverGrid.board));
      return { solved: false, board: solverGrid.board, iterations: iteration, rulesApplied };
    }

    if (!changed) {
      console.log(`\n${"=".repeat(60)}`);
      console.log("STALLED - No rule could make progress");
      console.log(`${"=".repeat(60)}\n`);

      const starsPlaced = solverGrid.board.flat().filter(c => c === "star").length;
      const eliminatedCount = solverGrid.board.flat().filter(c => c === "eliminated").length;
      const emptyCount = solverGrid.board.flat().filter(c => c === "empty").length;

      console.log(`Final stats: ${starsPlaced} stars, ${eliminatedCount} eliminated, ${emptyCount} empty`);
      console.log(`\nCurrent Board (. = eliminated, * = star):`);
      console.log(visualizeBoard(grid, solverGrid.board));

      // Show which rows/cols/shapes still need stars
      console.log(`\n--- Analysis of remaining work ---`);
      const rowStars = new Array(grid.size).fill(0);
      const colStars = new Array(grid.size).fill(0);
      const shapeStars = new Array(grid.shapes.length).fill(0);
      const rowEmpty = new Array(grid.size).fill(0);
      const colEmpty = new Array(grid.size).fill(0);
      const shapeEmpty = new Array(grid.shapes.length).fill(0);

      for (let r = 0; r < grid.size; r++) {
        for (let c = 0; c < grid.size; c++) {
          const cell = solverGrid.board[r][c];
          const shapeId = solverGrid.shapeMap[r][c];
          if (cell === "star") {
            rowStars[r]++;
            colStars[c]++;
            shapeStars[shapeId]++;
          } else if (cell === "empty") {
            rowEmpty[r]++;
            colEmpty[c]++;
            shapeEmpty[shapeId]++;
          }
        }
      }

      const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      console.log(`\nRows needing stars:`);
      for (let r = 0; r < grid.size; r++) {
        const needed = starsPerContainer - rowStars[r];
        if (needed > 0) console.log(`  Row ${r}: needs ${needed} more, has ${rowEmpty[r]} empty cells`);
      }

      console.log(`\nColumns needing stars:`);
      for (let c = 0; c < grid.size; c++) {
        const needed = starsPerContainer - colStars[c];
        if (needed > 0) console.log(`  Col ${c}: needs ${needed} more, has ${colEmpty[c]} empty cells`);
      }

      console.log(`\nShapes needing stars:`);
      for (let s = 0; s < grid.shapes.length; s++) {
        const needed = starsPerContainer - shapeStars[s];
        if (needed > 0) console.log(`  Shape ${labels[s]}: needs ${needed} more, has ${shapeEmpty[s]} empty cells`);
      }

      return { solved: false, board: solverGrid.board, iterations: iteration, rulesApplied };
    }
  }

  return { solved: false, board: solverGrid.board, iterations: iteration, rulesApplied };
}

/**
 * Solve a custom puzzle from a letter-grid string.
 */
export function solveCustom(input: string, starsPerContainer: number) {
  const grid = parseGrid(input);

  console.log(`\n========================================`);
  console.log(
    `Solving custom ${grid.size}x${grid.size} puzzle (${starsPerContainer}-star)`
  );
  console.log(`========================================\n`);

  console.log("Layout:");
  console.log(visualizeGrid(grid));
  console.log();

  const solverGrid = initializeSolver(grid, starsPerContainer);
  const result = solve(solverGrid);

  console.log(`Result: ${result.solved ? "SOLVED" : "FAILED"}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Rules applied: ${result.rulesApplied.length}`);

  if (result.rulesApplied.length > 0) {
    const ruleCounts: Record<string, number> = {};
    result.rulesApplied.forEach(
      (r) => (ruleCounts[r] = (ruleCounts[r] || 0) + 1)
    );
    console.log(`Rule usage:`, ruleCounts);
  }

  if (result.solved) {
    console.log(`Difficulty: ${getHighestDifficulty(result.rulesApplied)}`);
    console.log(`\nSolution:`);
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const shapeMap: number[][] = Array.from({ length: grid.size }, () =>
      Array(grid.size).fill(-1)
    );
    grid.shapes.forEach((shape, id) =>
      shape.forEach((c) => (shapeMap[c.row][c.col] = id))
    );
    const solutionStr = result.board
      .map((row, r) =>
        row
          .map((cell, c) => {
            if (cell === "star") return "*";
            return labels[shapeMap[r][c]] || "?";
          })
          .join(" ")
      )
      .join("\n");
    console.log(solutionStr);
  } else {
    // Show partial progress
    const starsPlaced = result.board.flat().filter((c) => c === "star").length;
    const eliminated = result.board
      .flat()
      .filter((c) => c === "eliminated").length;
    const empty = result.board.flat().filter((c) => c === "empty").length;
    console.log(
      `\nPartial progress: ${starsPlaced} stars, ${eliminated} eliminated, ${empty} empty`
    );
  }

  return result;
}

// No auto-run - import and call solveCustom or solveCustomVerbose directly
