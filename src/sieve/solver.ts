import { Board, CellState, SolverResult } from "./helpers/types";
import {
  BoardAnalysis,
  buildBoardAnalysis,
} from "./helpers/boardAnalysis";
import starNeighbors from "./rules/01-starNeighbors/starNeighbors";
import rowComplete from "./rules/02-rowComplete/rowComplete";
import columnComplete from "./rules/03-columnComplete/columnComplete";
import regionComplete from "./rules/04-regionComplete/regionComplete";
import forcedPlacement from "./rules/05-forcedPlacement/forcedPlacement";
import tilingForcedStars from "./rules/08a-tilingForcedStars/tilingForcedStars";
import tilingOverhangMarks from "./rules/08b-tilingOverhangMarks/tilingOverhangMarks";
import tilingAdjacencyMarks from "./rules/08c-tilingAdjacencyMarks/tilingAdjacencyMarks";
import oneByNConfinement from "./rules/09-oneByNConfinement/oneByNConfinement";
import finnedCounts from "./rules/12-finnedCounts/finnedCounts";
import reservedAreaExclusions from "./rules/14-reservedAreaExclusions/reservedAreaExclusions";
import adjacentLineAnalysis from "./rules/15-adjacentLineAnalysis/adjacentLineAnalysis";

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

type Rule = (
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
) => boolean;

type RuleEntry = {
  rule: Rule;
  level: number;
  name: string;
};

const allRules: RuleEntry[] = [
  { rule: starNeighbors, level: 1, name: "Star Neighbors" },
  { rule: rowComplete, level: 1, name: "Row Complete" },
  { rule: columnComplete, level: 1, name: "Column Complete" },
  { rule: regionComplete, level: 1, name: "Region Complete" },
  { rule: forcedPlacement, level: 1, name: "Forced Placement" },
  { rule: tilingForcedStars, level: 2, name: "Tiling Forced Stars" },
  { rule: tilingOverhangMarks, level: 2, name: "Tiling Overhang Marks" },
  { rule: tilingAdjacencyMarks, level: 2, name: "Tiling Adjacency Marks" },
  { rule: oneByNConfinement, level: 2, name: "1×n Confinement" },
  { rule: finnedCounts, level: 2, name: "Finned Counts" },
  { rule: reservedAreaExclusions, level: 2, name: "Reserved Area Exclusions" },
  { rule: adjacentLineAnalysis, level: 2, name: "Adjacent Line Analysis" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({ name, level }));

const MAX_CYCLES = 1000;

export type BoardStatus = "solved" | "valid" | "invalid";

/**
 * Check board state in a single pass. Returns:
 * - "invalid": constraints violated (not enough capacity or adjacent stars)
 * - "solved": all star counts match target
 * - "valid": solvable but not yet complete
 */
export function checkBoardState(
  board: Board,
  cells: CellState[][],
): BoardStatus {
  const size = board.grid.length;

  const starsByRow = new Array(size).fill(0);
  const starsByCol = new Array(size).fill(0);
  const availableByRow = new Array(size).fill(0);
  const availableByCol = new Array(size).fill(0);
  const starsByRegion = new Map<number, number>();
  const availableByRegion = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = cells[row][col];
      const regionId = board.grid[row][col];

      if (cell === "star") {
        starsByRow[row]++;
        starsByCol[col]++;
        starsByRegion.set(regionId, (starsByRegion.get(regionId) ?? 0) + 1);

        // Check adjacency (only right and down to avoid double-checking)
        if (col + 1 < size && cells[row][col + 1] === "star") return "invalid";
        if (row + 1 < size) {
          if (cells[row + 1][col] === "star") return "invalid";
          if (col > 0 && cells[row + 1][col - 1] === "star") return "invalid";
          if (col + 1 < size && cells[row + 1][col + 1] === "star")
            return "invalid";
        }
      }

      if (cell !== "marked") {
        availableByRow[row]++;
        availableByCol[col]++;
        availableByRegion.set(
          regionId,
          (availableByRegion.get(regionId) ?? 0) + 1,
        );
      }
    }
  }

  // Check capacity constraints
  for (let i = 0; i < size; i++) {
    if (availableByRow[i] < board.stars) return "invalid";
    if (availableByCol[i] < board.stars) return "invalid";
  }
  for (const available of availableByRegion.values()) {
    if (available < board.stars) return "invalid";
  }

  // Check if solved
  for (let i = 0; i < size; i++) {
    if (starsByRow[i] !== board.stars) return "valid";
    if (starsByCol[i] !== board.stars) return "valid";
  }
  for (const count of starsByRegion.values()) {
    if (count !== board.stars) return "valid";
  }

  return "solved";
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

    const status = checkBoardState(board, cells);
    if (status === "solved") return { cells, cycles, maxLevel };
    if (status === "invalid") return null;

    // Build analysis once per cycle
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

    // No rule made progress - stuck
    if (!progress) {
      return null;
    }
  }

  // Exceeded max cycles
  return null;
}
