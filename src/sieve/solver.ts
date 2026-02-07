import { Board, CellState, SolverResult, TilingResult } from "./helpers/types";
import {
  buildBoardStructure,
  buildBoardAnalysis,
} from "./helpers/boardAnalysis";
import { checkProgress } from "./helpers/checkProgress";
import { isValidBoard } from "./helpers/validateBoard";
import { allRules } from "./rules";

export { RULE_METADATA } from "./rules";

/** Step info passed to trace callback */
export interface StepInfo {
  cycle: number;
  rule: string;
  level: number;
  cells: CellState[][];
}

export interface SolveOptions {
  onStep?: (step: StepInfo) => void;
  timing?: Map<string, number>;
}

/**
 * Attempt to solve a Star Battle puzzle using inference rules.
 * Flows rules through the board until it settles into a final state.
 */
export function solve(
  boardDef: Board,
  options: SolveOptions = {},
): SolverResult | null {
  if (!isValidBoard(boardDef)) return null;

  const size = boardDef.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );

  let cycles = 0;
  let maxLevel = 0;
  const tilingCache = new Map<string, TilingResult>();
  const structure = buildBoardStructure(boardDef);

  while (true) {
    cycles++;

    const analysis = buildBoardAnalysis(structure, cells, tilingCache);
    const status = checkProgress(boardDef, cells, analysis);

    if (status === "solved") return { cells, cycles, maxLevel };
    if (status === "invalid") return null;

    let applied: (typeof allRules)[number] | undefined;
    for (const entry of allRules) {
      let fired: boolean;
      if (options.timing) {
        const t0 = performance.now();
        fired = entry.rule(boardDef, cells, analysis);
        options.timing.set(
          entry.name,
          (options.timing.get(entry.name) ?? 0) + (performance.now() - t0),
        );
      } else {
        fired = entry.rule(boardDef, cells, analysis);
      }
      if (fired) {
        applied = entry;
        break;
      }
    }

    if (!applied) return null;

    maxLevel = Math.max(maxLevel, applied.level);

    if (options.onStep) {
      options.onStep({
        cycle: cycles,
        rule: applied.name,
        level: applied.level,
        cells: cells.map((row) => [...row]),
      });
    }
  }
}
