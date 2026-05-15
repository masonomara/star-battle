import { Board, CellState, Progress, SolverResult, TilingResult } from "./helpers/types";
import {
  buildBoardStructure,
  buildBoardAnalysis,
  BoardAnalysis,
} from "./helpers/boardAnalysis";
import { neighbors } from "./helpers/neighbors";
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
}

function isValidBoard(board: Board): boolean {
  const { grid, stars } = board;
  const size = grid.length;
  const minRegionSize = stars > 1 ? stars * 2 - 1 : 1;

  const regionSizes = new Map<number, number>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = grid[r][c];
      regionSizes.set(id, (regionSizes.get(id) ?? 0) + 1);
    }
  }

  if (regionSizes.size !== size) return false;
  for (const sz of regionSizes.values()) {
    if (sz < minRegionSize) return false;
  }
  return true;
}

function getSolveStatus(cells: CellState[][], analysis: BoardAnalysis): Progress {
  const { size, stars, rowStars, colStars, regions } = analysis;
  let solved = true;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (cells[i][j] === "star") {
        for (const [nr, nc] of neighbors(i, j, size)) {
          if (cells[nr][nc] === "star") return "invalid";
        }
      }
    }
    const rowUnknowns = analysis.rowUnknowns[i].length;
    const colUnknowns = analysis.colUnknowns[i].length;
    if (rowStars[i] + rowUnknowns < stars || colStars[i] + colUnknowns < stars) {
      return "invalid";
    }
    if (rowStars[i] !== stars || colStars[i] !== stars) {
      solved = false;
    }
  }

  for (const region of regions.values()) {
    if (region.starsPlaced + region.unknownCoords.length < stars) {
      return "invalid";
    }
    if (region.starsPlaced !== stars) {
      solved = false;
    }
  }

  return solved ? "solved" : "valid";
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
    const status = getSolveStatus(cells, analysis);

    if (status === "solved") return { cells, cycles, maxLevel };
    if (status === "invalid") return null;

    let applied: (typeof allRules)[number] | undefined;
    for (const entry of allRules) {
      const fired = entry.rule(boardDef, cells, analysis);
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
