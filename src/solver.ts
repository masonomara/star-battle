import { createRequire } from 'node:module';
import { Board, CellState, Coord, SolverResult } from "./helpers/types";

const _req = createRequire(import.meta.url);
const wasmSolver = _req('../pkg/dlx.js') as {
  solve_board(gridFlat: Int32Array, size: number, stars: number): Int32Array;
  solve_board_steps(gridFlat: Int32Array, size: number, stars: number): Int32Array;
  has_unique_solution(gridFlat: Int32Array, size: number, stars: number): boolean;
};

export type SolveStep = {
  ruleId: number;
  rule: string;
  level: number;
  placements: Coord[];
  marks: Coord[];
};

export type SolverResultWithSteps = SolverResult & { steps: SolveStep[] };

const RULE_NAMES: Record<number, string> = {
  1:  "Star Neighbors",
  2:  "Forced Row",
  3:  "Forced Column",
  4:  "Forced Region",
  5:  "Trivial Row Marks",
  6:  "Trivial Column Marks",
  7:  "Trivial Region Marks",
  8:  "Tiling Forced Row",
  9:  "Tiling Forced Column",
  10: "Tiling Forced Region",
  11: "Tiling Adjacency",
  12: "Tiling Overhang",
  13: "Counting Marks Row",
  14: "Counting Marks Column",
  15: "Tiling Pairs Forced Row",
  16: "Tiling Pairs Forced Column",
  17: "Tiling Pairs Adjacency Row",
  18: "Tiling Pairs Adjacency Column",
  19: "Tiling Pairs Overhang Row",
  20: "Tiling Pairs Overhang Column",
  21: "Tiling Counting Marks Row",
  22: "Tiling Counting Marks Column",
  23: "Tiling Counting Forced Row",
  24: "Tiling Counting Forced Column",
  25: "Grouped Tiling Counting Marks Row",
  26: "Grouped Tiling Counting Marks Column",
  27: "Hypothetical Row Count",
  28: "Hypothetical Column Count",
  29: "Hypothetical Region Count",
  30: "Hypothetical Row Capacity",
  31: "Hypothetical Column Capacity",
  32: "Hypothetical Region Capacity",
  33: "Hypothetical Counting Row",
  34: "Hypothetical Counting Column",
  35: "Propagated Row Count",
  36: "Propagated Column Count",
  37: "Propagated Region Count",
  38: "Propagated Row Capacity",
  39: "Propagated Column Capacity",
  40: "Propagated Region Capacity",
  41: "Propagated Counting Row",
  42: "Propagated Counting Column",
};

function makeGridFlat(board: Board): Int32Array {
  const size = board.grid.length;
  const gridFlat = new Int32Array(size * size);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      gridFlat[r * size + c] = board.grid[r][c];
  return gridFlat;
}

export function solve(boardDef: Board): SolverResult | null {
  const size = boardDef.grid.length;
  const flat = wasmSolver.solve_board(makeGridFlat(boardDef), size, boardDef.stars);
  if (flat[0] === 0) return null;
  const cells: CellState[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const v = flat[3 + r * size + c];
      return v === 1 ? 'star' : v === 2 ? 'marked' : 'unknown';
    })
  );
  return { cells, cycles: flat[2], maxLevel: flat[1] };
}

export function solveWithSteps(boardDef: Board): SolverResultWithSteps | null {
  const size = boardDef.grid.length;
  const flat = wasmSolver.solve_board_steps(makeGridFlat(boardDef), size, boardDef.stars);
  if (flat[0] === 0) return null;

  const maxLevel = flat[1];
  const cycles   = flat[2];
  const numSteps = flat[3];
  const steps: SolveStep[] = [];
  let i = 4;

  for (let s = 0; s < numSteps; s++) {
    const ruleId = flat[i++];
    const level  = flat[i++];
    const nPlacements = flat[i++];
    const placements: Coord[] = [];
    for (let p = 0; p < nPlacements; p++) {
      placements.push([flat[i], flat[i + 1]]);
      i += 2;
    }
    const nMarks = flat[i++];
    const marks: Coord[] = [];
    for (let m = 0; m < nMarks; m++) {
      marks.push([flat[i], flat[i + 1]]);
      i += 2;
    }
    steps.push({ ruleId, rule: RULE_NAMES[ruleId] ?? `Rule ${ruleId}`, level, placements, marks });
  }

  const cells: CellState[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const v = flat[i + r * size + c];
      return v === 1 ? 'star' : v === 2 ? 'marked' : 'unknown';
    })
  );

  return { cells, cycles, maxLevel, steps };
}

export function hasUniqueSolution(board: Board): boolean {
  const size = board.grid.length;
  return wasmSolver.has_unique_solution(makeGridFlat(board), size, board.stars);
}

