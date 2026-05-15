import { Board, CellState, Coord, Progress, SolverResult, TilingResult } from "./helpers/types";
import {
  buildBoardStructure,
  buildBoardAnalysis,
  BoardAnalysis,
} from "./helpers/boardAnalysis";
import { neighbors } from "./helpers/neighbors";
import { allRules } from "./rules";

export { RULE_METADATA } from "./rules";

export interface StepInfo {
  cycle: number;
  rule: string;
  level: number;
  cells: CellState[][];
}

export interface SolveOptions {
  onStep?: (step: StepInfo) => void;
  tilingCache?: Map<string, TilingResult>;
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

function diffCells(cells: CellState[][], snapshot: Uint8Array, size: number): Coord[] {
  const changed: Coord[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cur = cells[r][c] === "star" ? 1 : cells[r][c] === "marked" ? 2 : 0;
      const idx = r * size + c;
      if (cur !== snapshot[idx]) {
        snapshot[idx] = cur;
        changed.push([r, c]);
      }
    }
  }
  return changed;
}

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
  const tilingCache = options.tilingCache ?? new Map<string, TilingResult>();
  const structure = buildBoardStructure(boardDef);
  const analysis = buildBoardAnalysis(structure, cells, tilingCache);
  const snapshot = new Uint8Array(size * size);

  while (true) {
    cycles++;

    const status = getSolveStatus(cells, analysis);
    if (status === "solved") return { cells, cycles, maxLevel };
    if (status === "invalid") return null;

    let applied: (typeof allRules)[number] | undefined;
    for (const entry of allRules) {
      if (entry.rule(boardDef, cells, analysis)) {
        applied = entry;
        break;
      }
    }

    if (!applied) return null;

    maxLevel = Math.max(maxLevel, applied.level);
    analysis.applyDelta(cells, diffCells(cells, snapshot, size));

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
