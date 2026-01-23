/**
 * Validation utilities for checking rule correctness against brute-force solutions.
 */

import { Board, CellState } from "../sieve/helpers/types";
import {
  Solution,
  bruteForce,
  filterCompatibleSolutions,
  isStarInAllSolutions,
  isStarInAnySolution,
} from "./bruteForce";

export interface ValidationError {
  type: "false_positive_mark" | "false_positive_star";
  row: number;
  col: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  solutionsBefore: number;
  solutionsAfter: number;
}

/**
 * Validate that a rule's deductions are sound.
 *
 * Compares cellsBefore and cellsAfter to find what the rule changed,
 * then verifies each change against the set of valid solutions.
 *
 * @param board - The puzzle board
 * @param cellsBefore - Cell state before rule application
 * @param cellsAfter - Cell state after rule application
 * @param allSolutions - All valid solutions (from bruteForce)
 * @returns Validation result with any errors found
 */
export function validateDeductions(
  board: Board,
  cellsBefore: CellState[][],
  cellsAfter: CellState[][],
  allSolutions: Solution[]
): ValidationResult {
  const size = board.grid.length;
  const errors: ValidationError[] = [];

  // Filter to solutions compatible with the "before" state
  const compatibleSolutions = filterCompatibleSolutions(
    allSolutions,
    cellsBefore
  );

  if (compatibleSolutions.length === 0) {
    // No valid solutions - the puzzle state is already broken
    return {
      valid: true,
      errors: [],
      solutionsBefore: 0,
      solutionsAfter: 0,
    };
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const before = cellsBefore[r][c];
      const after = cellsAfter[r][c];

      if (before === "unknown" && after === "marked") {
        // Rule marked this cell - verify NO compatible solution has a star here
        if (isStarInAnySolution(compatibleSolutions, r, c)) {
          errors.push({
            type: "false_positive_mark",
            row: r,
            col: c,
            message: `Cell (${r},${c}) marked but is a star in ${
              compatibleSolutions.filter((s) => s[r][c] === "star").length
            }/${compatibleSolutions.length} valid solutions`,
          });
        }
      }

      if (before === "unknown" && after === "star") {
        // Rule placed a star - verify ALL compatible solutions have a star here
        if (!isStarInAllSolutions(compatibleSolutions, r, c)) {
          const withStar = compatibleSolutions.filter(
            (s) => s[r][c] === "star"
          ).length;
          errors.push({
            type: "false_positive_star",
            row: r,
            col: c,
            message: `Star placed at (${r},${c}) but only ${withStar}/${compatibleSolutions.length} valid solutions have star here`,
          });
        }
      }
    }
  }

  const solutionsAfter = filterCompatibleSolutions(
    allSolutions,
    cellsAfter
  ).length;

  return {
    valid: errors.length === 0,
    errors,
    solutionsBefore: compatibleSolutions.length,
    solutionsAfter,
  };
}

/**
 * Type for a rule function.
 */
export type RuleFunction = (board: Board, cells: CellState[][]) => boolean;

/**
 * Test a rule against a specific board state.
 *
 * @param rule - The rule function to test
 * @param board - The puzzle board
 * @param initialCells - Starting cell state (or undefined for all unknown)
 * @returns Validation result
 */
export function testRule(
  rule: RuleFunction,
  board: Board,
  initialCells?: CellState[][]
): ValidationResult {
  const size = board.grid.length;

  // Create cell state
  const cells: CellState[][] =
    initialCells?.map((row) => [...row]) ??
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => "unknown" as CellState)
    );

  // Deep copy for "before" state
  const cellsBefore = cells.map((row) => [...row]);

  // Get all valid solutions for this board
  const allSolutions = bruteForce(board);

  // Apply the rule
  rule(board, cells);

  // Validate the deductions
  return validateDeductions(board, cellsBefore, cells, allSolutions);
}

/**
 * Run a rule repeatedly until it makes no progress, validating each step.
 *
 * @param rule - The rule function to test
 * @param board - The puzzle board
 * @param initialCells - Starting cell state
 * @param maxIterations - Safety limit
 * @returns Array of validation results for each iteration
 */
export function testRuleIteratively(
  rule: RuleFunction,
  board: Board,
  initialCells?: CellState[][],
  maxIterations = 100
): ValidationResult[] {
  const size = board.grid.length;
  const results: ValidationResult[] = [];

  const cells: CellState[][] =
    initialCells?.map((row) => [...row]) ??
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => "unknown" as CellState)
    );

  const allSolutions = bruteForce(board);

  for (let i = 0; i < maxIterations; i++) {
    const cellsBefore = cells.map((row) => [...row]);
    const changed = rule(board, cells);

    if (!changed) break;

    const result = validateDeductions(board, cellsBefore, cells, allSolutions);
    results.push(result);

    if (!result.valid) break; // Stop on first error
  }

  return results;
}

/**
 * Fuzz test a rule with random partial states.
 *
 * @param rule - The rule function to test
 * @param board - The puzzle board
 * @param iterations - Number of random states to test
 * @param seed - Random seed for reproducibility
 * @returns Array of failed validation results (empty if all passed)
 */
export function fuzzTestRule(
  rule: RuleFunction,
  board: Board,
  iterations: number,
  seed = 0
): { iteration: number; cells: CellState[][]; result: ValidationResult }[] {
  const size = board.grid.length;
  const allSolutions = bruteForce(board);
  const failures: {
    iteration: number;
    cells: CellState[][];
    result: ValidationResult;
  }[] = [];

  if (allSolutions.length === 0) {
    return failures; // Unsolvable puzzle
  }

  // Simple seeded random
  let rng = seed;
  const random = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  for (let iter = 0; iter < iterations; iter++) {
    // Pick a random valid solution
    const solution = allSolutions[Math.floor(random() * allSolutions.length)];

    // Create a partial state by revealing some cells
    const cells: CellState[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => "unknown" as CellState)
    );

    // Randomly reveal 0-50% of cells
    const revealRate = random() * 0.5;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (random() < revealRate) {
          cells[r][c] = solution[r][c] === "star" ? "star" : "marked";
        }
      }
    }

    // Test the rule
    const result = testRule(rule, board, cells);
    if (!result.valid) {
      failures.push({
        iteration: iter,
        cells: cells.map((row) => [...row]),
        result,
      });
    }
  }

  return failures;
}

/**
 * Pretty print a cell state for debugging.
 */
export function formatCells(cells: CellState[][]): string {
  return cells
    .map((row) =>
      row.map((c) => (c === "star" ? "★" : c === "marked" ? "×" : ".")).join(" ")
    )
    .join("\n");
}

/**
 * Pretty print a solution for debugging.
 */
export function formatSolution(solution: Solution): string {
  return solution
    .map((row) => row.map((c) => (c === "star" ? "★" : ".")).join(" "))
    .join("\n");
}
