import type { Cell, Grid } from "./types";

/**
 * Cell state in the solving process
 * - empty: unknown state
 * - star: confirmed star placement
 * - eliminated: confirmed no star can be placed here
 */
export type CellState = "empty" | "star" | "eliminated";

export type SolverGrid = {
  grid: Grid;
  starsPerContainer: number; // Number of stars per row/col/region
  board: CellState[][];
  regionMap: number[][]; // Maps cell coordinates to region ID
};

export type SolveResult = {
  solved: boolean;
  board: CellState[][];
  iterations: number;
  rulesApplied: string[];
};

/**
 * Initialize a solver grid from a layout grid
 */
export function initializeSolver(
  grid: Grid,
  starsPerContainer: number
): SolverGrid {
  const { size, regions } = grid;
  const board: CellState[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill("empty"));

  const regionMap: number[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(-1));

  regions.forEach((region, regionId) => {
    region.forEach((cell) => {
      regionMap[cell.row][cell.col] = regionId;
    });
  });

  return { grid, starsPerContainer, board, regionMap };
}

/**
 * Main solver function using production rules
 * Returns solve result with final board state and metadata
 */
export function solve(solverGrid: SolverGrid): SolveResult {
  const rulesApplied: string[] = [];
  let iterations = 0;
  const MAX_ITERATIONS = 10000;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const changed = applyAllRules(solverGrid, rulesApplied);

    if (isSolved(solverGrid)) {
      return {
        solved: true,
        board: solverGrid.board,
        iterations,
        rulesApplied,
      };
    }

    if (!changed) {
      // No rules could make progress - puzzle is unsolvable with current rules
      return {
        solved: false,
        board: solverGrid.board,
        iterations,
        rulesApplied,
      };
    }
  }

  return {
    solved: false,
    board: solverGrid.board,
    iterations,
    rulesApplied,
  };
}

/**
 * Apply all production rules in order
 * Returns true if any rule made changes
 */
function applyAllRules(
  solverGrid: SolverGrid,
  rulesApplied: string[]
): boolean {
  const rules = [
    // BASIC RULES - Easy difficulty
    ruleEliminateAroundStars,
    ruleCompleteFullContainers,
    rulePlaceStarsInForcedCells,

    // COUNTING RULES - Medium difficulty
    ruleRegionWithMinimalCells,
    ruleRowColIntersection,
    rule2x2Maximum,

    // ADVANCED RULES - Hard difficulty
    ruleUndercounting,
    ruleOvercounting,
  ];

  for (const rule of rules) {
    if (rule(solverGrid)) {
      rulesApplied.push(rule.name);
      return true; // Restart from beginning when any rule succeeds
    }
  }

  return false;
}

/**
 * Check if puzzle is completely solved
 */
function isSolved(solverGrid: SolverGrid): boolean {
  const { board, grid, starsPerContainer } = solverGrid;
  const { size } = grid;

  // Count stars in each row
  for (let row = 0; row < size; row++) {
    const stars = board[row].filter((cell) => cell === "star").length;
    if (stars !== starsPerContainer) return false;
  }

  // Count stars in each column
  for (let col = 0; col < size; col++) {
    let stars = 0;
    for (let row = 0; row < size; row++) {
      if (board[row][col] === "star") stars++;
    }
    if (stars !== starsPerContainer) return false;
  }

  // Count stars in each region
  for (const region of grid.regions) {
    const stars = region.filter((cell) => board[cell.row][cell.col] === "star")
      .length;
    if (stars !== starsPerContainer) return false;
  }

  // Verify no empty cells remain
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === "empty") return false;
    }
  }

  return true;
}

// ============================================================================
// PRODUCTION RULES (ordered by difficulty)
// ============================================================================

/**
 * RULE: Eliminate cells adjacent to stars (including diagonals)
 * DIFFICULTY: Easy
 * PATTERN: When a star is placed, mark all 8 surrounding cells as eliminated
 */
function ruleEliminateAroundStars(solverGrid: SolverGrid): boolean {
  const { board, grid } = solverGrid;
  const { size } = grid;
  let changed = false;

  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === "star") {
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (
            newRow >= 0 &&
            newRow < size &&
            newCol >= 0 &&
            newCol < size &&
            board[newRow][newCol] === "empty"
          ) {
            board[newRow][newCol] = "eliminated";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

/**
 * RULE: Complete containers that already have the required number of stars
 * DIFFICULTY: Easy
 * PATTERN: If a row/col/region has N stars, eliminate all remaining empty cells
 */
function ruleCompleteFullContainers(solverGrid: SolverGrid): boolean {
  const { board, grid, regionMap, starsPerContainer } = solverGrid;
  const { size, regions } = grid;
  let changed = false;

  // Check rows
  for (let row = 0; row < size; row++) {
    const stars = board[row].filter((cell) => cell === "star").length;
    if (stars === starsPerContainer) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === "empty") {
          board[row][col] = "eliminated";
          changed = true;
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    let stars = 0;
    for (let row = 0; row < size; row++) {
      if (board[row][col] === "star") stars++;
    }
    if (stars === starsPerContainer) {
      for (let row = 0; row < size; row++) {
        if (board[row][col] === "empty") {
          board[row][col] = "eliminated";
          changed = true;
        }
      }
    }
  }

  // Check regions
  for (const region of regions) {
    const stars = region.filter((cell) => board[cell.row][cell.col] === "star")
      .length;
    if (stars === starsPerContainer) {
      for (const cell of region) {
        if (board[cell.row][cell.col] === "empty") {
          board[cell.row][cell.col] = "eliminated";
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * RULE: Place stars in cells that are the only remaining option in a container
 * DIFFICULTY: Easy
 * PATTERN: If a row/col/region needs N stars and has exactly N empty cells, fill them
 */
function rulePlaceStarsInForcedCells(solverGrid: SolverGrid): boolean {
  const { board, grid, starsPerContainer } = solverGrid;
  const { size, regions } = grid;
  let changed = false;

  // Check rows
  for (let row = 0; row < size; row++) {
    const stars = board[row].filter((cell) => cell === "star").length;
    const empty = board[row].filter((cell) => cell === "empty").length;
    const needed = starsPerContainer - stars;

    if (needed > 0 && empty === needed) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === "empty") {
          board[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    let stars = 0;
    let empty = 0;
    for (let row = 0; row < size; row++) {
      if (board[row][col] === "star") stars++;
      if (board[row][col] === "empty") empty++;
    }
    const needed = starsPerContainer - stars;

    if (needed > 0 && empty === needed) {
      for (let row = 0; row < size; row++) {
        if (board[row][col] === "empty") {
          board[row][col] = "star";
          changed = true;
        }
      }
    }
  }

  // Check regions
  for (const region of regions) {
    const stars = region.filter((cell) => board[cell.row][cell.col] === "star")
      .length;
    const empty = region.filter((cell) => board[cell.row][cell.col] === "empty")
      .length;
    const needed = starsPerContainer - stars;

    if (needed > 0 && empty === needed) {
      for (const cell of region) {
        if (board[cell.row][cell.col] === "empty") {
          board[cell.row][cell.col] = "star";
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * RULE: Handle regions with minimal cells (3 cells for 2-star puzzle, etc.)
 * DIFFICULTY: Medium
 * PATTERN: If region has starsPerContainer + 1 cells, eliminate based on constraints
 */
function ruleRegionWithMinimalCells(solverGrid: SolverGrid): boolean {
  const { board, grid, starsPerContainer } = solverGrid;
  const { regions } = grid;
  let changed = false;

  for (const region of regions) {
    // For 2-star puzzles: if region has 3 cells, middle cell often constrained
    if (region.length === starsPerContainer + 1) {
      const emptyCells = region.filter(
        (cell) => board[cell.row][cell.col] === "empty"
      );
      if (emptyCells.length === starsPerContainer + 1) {
        // Check if any cell would violate 2x2 rule or adjacency
        for (const cell of emptyCells) {
          if (wouldViolate2x2(solverGrid, cell)) {
            board[cell.row][cell.col] = "eliminated";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

/**
 * RULE: Row/Column intersection with regions
 * DIFFICULTY: Medium
 * PATTERN: If all empty cells in a row/col within a region would fill the region's quota,
 * eliminate cells in that region outside the row/col
 */
function ruleRowColIntersection(solverGrid: SolverGrid): boolean {
  const { board, grid, regionMap, starsPerContainer } = solverGrid;
  const { size, regions } = grid;
  let changed = false;

  for (const region of regions) {
    const regionStars = region.filter(
      (cell) => board[cell.row][cell.col] === "star"
    ).length;
    const needed = starsPerContainer - regionStars;

    if (needed === 0) continue;

    // Group region cells by row
    const cellsByRow = new Map<number, Cell[]>();
    for (const cell of region) {
      if (!cellsByRow.has(cell.row)) cellsByRow.set(cell.row, []);
      cellsByRow.get(cell.row)!.push(cell);
    }

    // Check if all needed stars must be in one row
    for (const [row, cells] of cellsByRow) {
      const emptyCells = cells.filter(
        (cell) => board[cell.row][cell.col] === "empty"
      );
      if (emptyCells.length === needed) {
        // All remaining cells in this region must be in this row
        // Eliminate other cells in this region
        for (const cell of region) {
          if (
            cell.row !== row &&
            board[cell.row][cell.col] === "empty"
          ) {
            board[cell.row][cell.col] = "eliminated";
            changed = true;
          }
        }
      }
    }

    // Group region cells by column (same logic)
    const cellsByCol = new Map<number, Cell[]>();
    for (const cell of region) {
      if (!cellsByCol.has(cell.col)) cellsByCol.set(cell.col, []);
      cellsByCol.get(cell.col)!.push(cell);
    }

    for (const [col, cells] of cellsByCol) {
      const emptyCells = cells.filter(
        (cell) => board[cell.row][cell.col] === "empty"
      );
      if (emptyCells.length === needed) {
        for (const cell of region) {
          if (
            cell.col !== col &&
            board[cell.row][cell.col] === "empty"
          ) {
            board[cell.row][cell.col] = "eliminated";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

/**
 * RULE: 2x2 maximum one star
 * DIFFICULTY: Medium
 * PATTERN: If a 2x2 square has 3 cells eliminated, check if 4th must be eliminated too
 */
function rule2x2Maximum(solverGrid: SolverGrid): boolean {
  const { board, grid } = solverGrid;
  const { size } = grid;
  let changed = false;

  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const cells = [
        { r: row, c: col },
        { r: row, c: col + 1 },
        { r: row + 1, c: col },
        { r: row + 1, c: col + 1 },
      ];

      const stars = cells.filter((cell) => board[cell.r][cell.c] === "star")
        .length;

      // If there's already a star, eliminate other cells in this 2x2
      if (stars === 1) {
        for (const cell of cells) {
          if (board[cell.r][cell.c] === "empty") {
            board[cell.r][cell.c] = "eliminated";
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

/**
 * RULE: Undercounting - when N regions fit within N rows/columns
 * DIFFICULTY: Hard
 * PATTERN: If N regions are contained within N rows, mark cells outside those regions
 */
function ruleUndercounting(solverGrid: SolverGrid): boolean {
  // This is a complex pattern - would need significant implementation
  // Placeholder for now
  return false;
}

/**
 * RULE: Overcounting - when N regions contain N rows/columns
 * DIFFICULTY: Hard
 * PATTERN: If N regions fully contain N rows, mark cells outside those rows
 */
function ruleOvercounting(solverGrid: SolverGrid): boolean {
  // This is a complex pattern - would need significant implementation
  // Placeholder for now
  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if placing a star at this cell would violate the 2x2 rule
 */
function wouldViolate2x2(solverGrid: SolverGrid, cell: Cell): boolean {
  const { board, grid } = solverGrid;
  const { size } = grid;
  const { row, col } = cell;

  // Check all 2x2 squares that include this cell
  const squares = [
    [
      [row - 1, col - 1],
      [row - 1, col],
      [row, col - 1],
    ],
    [
      [row - 1, col],
      [row - 1, col + 1],
      [row, col + 1],
    ],
    [
      [row, col - 1],
      [row + 1, col - 1],
      [row + 1, col],
    ],
    [
      [row, col + 1],
      [row + 1, col],
      [row + 1, col + 1],
    ],
  ];

  for (const square of squares) {
    let stars = 0;
    let valid = true;

    for (const [r, c] of square) {
      if (r < 0 || r >= size || c < 0 || c >= size) {
        valid = false;
        break;
      }
      if (board[r][c] === "star") stars++;
    }

    if (valid && stars >= 1) {
      // Adding a star here would create 2+ stars in a 2x2
      return true;
    }
  }

  return false;
}

/**
 * Visualize the solver board state
 */
export function visualizeSolverBoard(solverGrid: SolverGrid): string {
  const { board, grid } = solverGrid;
  const { size } = grid;

  return board
    .map((row) =>
      row
        .map((cell) => {
          if (cell === "star") return "★";
          if (cell === "eliminated") return "·";
          return " ";
        })
        .join(" ")
    )
    .join("\n");
}
