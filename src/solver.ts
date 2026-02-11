import { Board, CellState, Progress, SolverResult, TilingResult } from "./helpers/types";
import {
  buildBoardStructure,
  buildBoardAnalysis,
  BoardAnalysis,
} from "./helpers/boardAnalysis";
import { computeTiling } from "./helpers/tiling";
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
  timing?: Map<string, number>;
}

function isValidBoard(board: Board): boolean {
  const size = board.grid.length;
  const stars = board.stars;
  const minRegionSize = stars > 1 ? stars * 2 - 1 : 1;

  const regionCells = new Map<number, [number, number][]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!regionCells.has(id)) regionCells.set(id, []);
      regionCells.get(id)!.push([r, c]);
    }
  }

  if (regionCells.size !== size) return false;

  for (const coords of regionCells.values()) {
    if (coords.length < minRegionSize) return false;
  }

  for (let i = 0; i < size; i++) {
    const rowCoords: [number, number][] = [];
    const colCoords: [number, number][] = [];
    for (let j = 0; j < size; j++) {
      rowCoords.push([i, j]);
      colCoords.push([j, i]);
    }
    if (computeTiling(rowCoords, size).capacity < stars) return false;
    if (computeTiling(colCoords, size).capacity < stars) return false;
  }

  for (const coords of regionCells.values()) {
    if (computeTiling(coords, size).capacity < stars) return false;
  }

  return true;
}

function checkProgress(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): Progress {
  const { size, rowStars, colStars, regions } = analysis;
  const stars = board.stars;
  let solved = true;

  for (let i = 0; i < size; i++) {
    let rowUnknowns = 0;
    let colUnknowns = 0;
    for (let j = 0; j < size; j++) {
      if (cells[i][j] === "unknown") rowUnknowns++;
      if (cells[j][i] === "unknown") colUnknowns++;
      if (cells[i][j] === "star") {
        for (const [nr, nc] of neighbors(i, j, size)) {
          if (cells[nr][nc] === "star") return "invalid";
        }
      }
    }
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
