import { createRequire } from 'node:module';
import { Board, CellState, SolverResult } from "./helpers/types";

const _req = createRequire(import.meta.url);
const wasmSolver = _req('../pkg/dlx.js') as {
  solve_board(gridFlat: Int32Array, size: number, stars: number): Int32Array;
};

export function solve(boardDef: Board): SolverResult | null {
  const size = boardDef.grid.length;
  const gridFlat = new Int32Array(size * size);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      gridFlat[r * size + c] = boardDef.grid[r][c];
  const flat = wasmSolver.solve_board(gridFlat, size, boardDef.stars);
  if (flat[0] === 0) return null;
  const cells: CellState[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const v = flat[3 + r * size + c];
      return v === 1 ? 'star' : v === 2 ? 'marked' : 'unknown';
    })
  );
  return { cells, cycles: flat[2], maxLevel: flat[1] };
}
