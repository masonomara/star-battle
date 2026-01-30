import { Board, CellState, SolverResult } from "./helpers/types";
import starNeighbors from "./rules/01-starNeighbors/starNeighbors";
import rowComplete from "./rules/02-rowComplete/rowComplete";
import columnComplete from "./rules/03-columnComplete/columnComplete";
import regionComplete from "./rules/04-regionComplete/regionComplete";
import forcedPlacement from "./rules/05-forcedPlacement/forcedPlacement";
import undercounting from "./rules/06-undercounting/undercounting";
import overcounting from "./rules/07-overcounting/overcounting";
import twoByTwoTiling from "./rules/08-twoByTwoTiling/twoByTwoTiling";
import oneByNConfinement from "./rules/09-oneByNConfinement/oneByNConfinement";
import exclusion from "./rules/10-exclusion/exclusion";
import pressuredExclusion from "./rules/11-pressuredExclusion/pressuredExclusion";
import finnedCounts from "./rules/12-finnedCounts/finnedCounts";
import squeeze from "./rules/13-squeeze/squeeze";
import compositeRegions from "./rules/14-compositeRegions/compositeRegions";

/**
 * Check if a board layout is valid before attempting to solve.
 * Validates:
 * - Exactly `size` distinct regions exist
 * - For multi-star puzzles (stars > 1), each region has at least
 *   (stars * 2) - 1 cells to fit the required stars without touching.
 */
export function isValidLayout(board: Board): boolean {
  const size = board.grid.length;
  const minRegionSize = board.stars > 1 ? board.stars * 2 - 1 : 1;
  const regionSizes = new Map<number, number>();

  for (const row of board.grid) {
    for (const regionId of row) {
      regionSizes.set(regionId, (regionSizes.get(regionId) ?? 0) + 1);
    }
  }

  // Must have exactly `size` regions
  if (regionSizes.size !== size) return false;

  // Each region must meet minimum size requirement
  for (const regionSize of regionSizes.values()) {
    if (regionSize < minRegionSize) return false;
  }

  return true;
}

type Rule = (board: Board, cells: CellState[][]) => boolean;

const allRules: { rule: Rule; level: number; name: string }[] = [
  { rule: starNeighbors, level: 1, name: "Star Neighbors" },
  { rule: rowComplete, level: 1, name: "Row Complete" },
  { rule: columnComplete, level: 1, name: "Column Complete" },
  { rule: regionComplete, level: 1, name: "Region Complete" },
  { rule: forcedPlacement, level: 1, name: "Forced Placement" },
  { rule: undercounting, level: 2, name: "Undercounting" },
  { rule: overcounting, level: 2, name: "Overcounting" },
  { rule: twoByTwoTiling, level: 3, name: "2×2 Tiling" },
  { rule: oneByNConfinement, level: 4, name: "1×n Confinement" },
  { rule: exclusion, level: 4, name: "Exclusion" },
  { rule: pressuredExclusion, level: 5, name: "Pressured Exclusion" },
  { rule: finnedCounts, level: 5, name: "Finned Counts" },
  { rule: squeeze, level: 5, name: "The Squeeze" },
  { rule: compositeRegions, level: 6, name: "Composite Regions" },
];

const MAX_CYCLES = 1000;

/**
 * Check if the puzzle is completely solved.
 * Verifies star counts per row, column, and region match the target.
 * Does not check adjacency—rules enforce that invariant during solving.
 */
export function isSolved(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  const starsByRow = new Array(size).fill(0);
  const starsByCol = new Array(size).fill(0);
  const starsByRegion = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] === "star") {
        starsByRow[row]++;
        starsByCol[col]++;
        const regionId = board.grid[row][col];
        starsByRegion.set(regionId, (starsByRegion.get(regionId) ?? 0) + 1);
      }
    }
  }

  for (let i = 0; i < size; i++) {
    if (starsByRow[i] !== board.stars) return false;
    if (starsByCol[i] !== board.stars) return false;
  }

  for (const count of starsByRegion.values()) {
    if (count !== board.stars) return false;
  }

  return true;
}

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
 * Accepts optional onStep callback for tracing.
 */
export function solve(
  board: Board,
  options: SolveOptions = {},
): SolverResult | null {
  const size = board.grid.length;
  const cells: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );

  // Early rejection for invalid layouts
  if (!isValidLayout(board)) {
    return null;
  }

  let cycles = 0;
  let maxLevel = 0;

  while (cycles < MAX_CYCLES) {
    cycles++;

    if (isSolved(board, cells)) {
      return { cells, cycles, maxLevel };
    }

    let progress = false;

    for (const { rule, level, name } of allRules) {
      if (rule(board, cells)) {
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

    // No rule made progress - stuck
    if (!progress) {
      return null;
    }
  }

  // Exceeded max cycles
  return null;
}
