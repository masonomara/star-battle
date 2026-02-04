import { Board, CellState, SolverResult } from "./helpers/types";
import { buildBoardAnalysis } from "./helpers/boardAnalysis";
import { checkBoardState } from "./helpers/boardState";
import { isValidLayout } from "./helpers/boardValidation";
import { allRules, RULE_METADATA } from "./rules";

// Re-export for backwards compatibility
export { checkBoardState, BoardStatus } from "./helpers/boardState";
export { isValidLayout } from "./helpers/boardValidation";
export { RULE_METADATA } from "./rules";

const MAX_CYCLES = 1000;

/** Step info passed to trace callback */
export interface StepInfo {
  cycle: number;
  rule: string;
  level: number;
  cells: CellState[][];
}

export interface SolveOptions {
  onStep?: (step: StepInfo) => void;
}

/**
 * Attempt to solve a Star Battle puzzle using inference rules.
 * Flows rules through the board until it settles into a final state.
 */
export function solve(
  board: Board,
  options: SolveOptions = {},
): SolverResult | null {
  const size = board.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );

  if (!isValidLayout(board)) {
    return null;
  }

  let cycles = 0;
  let maxLevel = 0;

  while (cycles < MAX_CYCLES) {
    cycles++;

    const status = checkBoardState(board, cells);
    if (status === "solved") return { cells, cycles, maxLevel };
    if (status === "invalid") return null;

    const analysis = buildBoardAnalysis(board, cells);

    let progress = false;

    for (const { rule, level, name } of allRules) {
      const result = rule(board, cells, analysis);

      if (result) {
        maxLevel = Math.max(maxLevel, level);
        progress = true;

        if (options.onStep) {
          options.onStep({
            cycle: cycles,
            rule: name,
            level,
            cells: cells.map((row) => [...row]),
          });
        }

        break;
      }
    }

    if (!progress) {
      return null;
    }
  }

  return null;
}
