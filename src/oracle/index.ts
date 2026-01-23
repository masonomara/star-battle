/**
 * Oracle module for validating Star Battle solver rules.
 *
 * Provides brute-force solving and validation utilities to detect
 * false positives and false negatives in rule implementations.
 */

export {
  bruteForce,
  filterCompatibleSolutions,
  isStarInAllSolutions,
  isStarInAnySolution,
  type Solution,
} from "./bruteForce";

export {
  validateDeductions,
  testRule,
  testRuleIteratively,
  fuzzTestRule,
  formatCells,
  formatSolution,
  type RuleFunction,
  type ValidationError,
  type ValidationResult,
} from "./validate";
