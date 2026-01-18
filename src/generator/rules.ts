import { Grid, Cell, CellState } from "./types";

// Rule result
export interface RuleResult {
  applied: boolean;
  name: string;
  tier: number;
  eliminations: Cell[];
  placements: Cell[];
  message?: string;
}

// Helper: get neighbors (8-directional)
function getNeighbors(grid: Grid, cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = cell.row + dr;
      const c = cell.col + dc;
      if (r >= 0 && r < grid.size && c >= 0 && c < grid.size) {
        neighbors.push({ row: r, col: c });
      }
    }
  }
  return neighbors;
}

// Helper: get unmarked cells in a constraint
function getUnmarkedInRow(grid: Grid, row: number): Cell[] {
  const cells: Cell[] = [];
  for (let c = 0; c < grid.size; c++) {
    if (grid.cells[row][c] === CellState.UNKNOWN) {
      cells.push({ row, col: c });
    }
  }
  return cells;
}

function getUnmarkedInCol(grid: Grid, col: number): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < grid.size; r++) {
    if (grid.cells[r][col] === CellState.UNKNOWN) {
      cells.push({ row: r, col });
    }
  }
  return cells;
}

function getUnmarkedInRegion(grid: Grid, regionId: number): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (
        grid.regions[r][c] === regionId &&
        grid.cells[r][c] === CellState.UNKNOWN
      ) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

// Helper: count stars in constraint
function starsInRow(grid: Grid, row: number): number {
  let count = 0;
  for (let c = 0; c < grid.size; c++) {
    if (grid.cells[row][c] === CellState.STAR) count++;
  }
  return count;
}

function starsInCol(grid: Grid, col: number): number {
  let count = 0;
  for (let r = 0; r < grid.size; r++) {
    if (grid.cells[r][col] === CellState.STAR) count++;
  }
  return count;
}

function starsInRegion(grid: Grid, regionId: number): number {
  let count = 0;
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (
        grid.regions[r][c] === regionId &&
        grid.cells[r][c] === CellState.STAR
      )
        count++;
    }
  }
  return count;
}

// ============================================
// TIER 1: Trivial Moves
// ============================================

// R1.1 Eliminate Neighbors - When a star is placed, eliminate all 8 neighbors
export function r1_1_eliminateNeighbors(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.STAR) {
        const neighbors = getNeighbors(grid, { row: r, col: c });
        for (const n of neighbors) {
          if (grid.cells[n.row][n.col] === CellState.UNKNOWN) {
            eliminations.push(n);
          }
        }
      }
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R1.1 Eliminate Neighbors",
    tier: 1,
    eliminations,
    placements: [],
  };
}

// R2.1 Row Complete - When row has S stars, eliminate remaining
export function r2_1_rowComplete(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let r = 0; r < grid.size; r++) {
    if (starsInRow(grid, r) === grid.starsPerRegion) {
      const unmarked = getUnmarkedInRow(grid, r);
      eliminations.push(...unmarked);
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R2.1 Row Complete",
    tier: 1,
    eliminations,
    placements: [],
  };
}

// R2.2 Column Complete - When column has S stars, eliminate remaining
export function r2_2_colComplete(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let c = 0; c < grid.size; c++) {
    if (starsInCol(grid, c) === grid.starsPerRegion) {
      const unmarked = getUnmarkedInCol(grid, c);
      eliminations.push(...unmarked);
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R2.2 Column Complete",
    tier: 1,
    eliminations,
    placements: [],
  };
}

// R2.3 Region Complete - When region has S stars, eliminate remaining
export function r2_3_regionComplete(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let regionId = 0; regionId < grid.regionList.length; regionId++) {
    if (starsInRegion(grid, regionId) === grid.starsPerRegion) {
      const unmarked = getUnmarkedInRegion(grid, regionId);
      eliminations.push(...unmarked);
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R2.3 Region Complete",
    tier: 1,
    eliminations,
    placements: [],
  };
}

// ============================================
// TIER 2: Forced Moves
// ============================================

// R3.1 Row Forced - When unmarked cells = stars needed, place stars
export function r3_1_rowForced(grid: Grid): RuleResult {
  const placements: Cell[] = [];

  for (let r = 0; r < grid.size; r++) {
    const unmarked = getUnmarkedInRow(grid, r);
    const starsNeeded = grid.starsPerRegion - starsInRow(grid, r);

    if (starsNeeded > 0 && unmarked.length === starsNeeded) {
      placements.push(...unmarked);
    }
  }

  return {
    applied: placements.length > 0,
    name: "R3.1 Row Forced",
    tier: 2,
    eliminations: [],
    placements,
  };
}

// R3.2 Column Forced - When unmarked cells = stars needed, place stars
export function r3_2_colForced(grid: Grid): RuleResult {
  const placements: Cell[] = [];

  for (let c = 0; c < grid.size; c++) {
    const unmarked = getUnmarkedInCol(grid, c);
    const starsNeeded = grid.starsPerRegion - starsInCol(grid, c);

    if (starsNeeded > 0 && unmarked.length === starsNeeded) {
      placements.push(...unmarked);
    }
  }

  return {
    applied: placements.length > 0,
    name: "R3.2 Column Forced",
    tier: 2,
    eliminations: [],
    placements,
  };
}

// R3.3 Region Forced - When unmarked cells = stars needed, place stars
export function r3_3_regionForced(grid: Grid): RuleResult {
  const placements: Cell[] = [];

  for (let regionId = 0; regionId < grid.regionList.length; regionId++) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    const starsNeeded = grid.starsPerRegion - starsInRegion(grid, regionId);

    if (starsNeeded > 0 && unmarked.length === starsNeeded) {
      placements.push(...unmarked);
    }
  }

  return {
    applied: placements.length > 0,
    name: "R3.3 Region Forced",
    tier: 2,
    eliminations: [],
    placements,
  };
}

// R4 Constraint Fills Shape - All unmarked in row/col belong to one region
export function r4_constraintFillsShape(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  // Check rows
  for (let r = 0; r < grid.size; r++) {
    const unmarked = getUnmarkedInRow(grid, r);
    if (unmarked.length === 0) continue;

    const starsNeeded = grid.starsPerRegion - starsInRow(grid, r);
    if (starsNeeded <= 0) continue;

    // Check if all unmarked are in same region
    const regionId = grid.regions[unmarked[0].row][unmarked[0].col];
    const allSameRegion = unmarked.every(
      (c) => grid.regions[c.row][c.col] === regionId,
    );

    if (allSameRegion) {
      const regionStarsNeeded =
        grid.starsPerRegion - starsInRegion(grid, regionId);
      if (starsNeeded === regionStarsNeeded) {
        // Eliminate cells in region not in this row
        const regionCells = getUnmarkedInRegion(grid, regionId);
        for (const cell of regionCells) {
          if (cell.row !== r) {
            eliminations.push(cell);
          }
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < grid.size; c++) {
    const unmarked = getUnmarkedInCol(grid, c);
    if (unmarked.length === 0) continue;

    const starsNeeded = grid.starsPerRegion - starsInCol(grid, c);
    if (starsNeeded <= 0) continue;

    const regionId = grid.regions[unmarked[0].row][unmarked[0].col];
    const allSameRegion = unmarked.every(
      (cell) => grid.regions[cell.row][cell.col] === regionId,
    );

    if (allSameRegion) {
      const regionStarsNeeded =
        grid.starsPerRegion - starsInRegion(grid, regionId);
      if (starsNeeded === regionStarsNeeded) {
        const regionCells = getUnmarkedInRegion(grid, regionId);
        for (const cell of regionCells) {
          if (cell.col !== c) {
            eliminations.push(cell);
          }
        }
      }
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R4 Constraint Fills Shape",
    tier: 2,
    eliminations,
    placements: [],
  };
}

// R5 Shape Confined to Constraint - All unmarked in region are in one row/col
export function r5_shapeConfinedToConstraint(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let regionId = 0; regionId < grid.regionList.length; regionId++) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    if (unmarked.length === 0) continue;

    const regionStarsNeeded =
      grid.starsPerRegion - starsInRegion(grid, regionId);
    if (regionStarsNeeded <= 0) continue;

    // Check if all in same row
    const allSameRow = unmarked.every((c) => c.row === unmarked[0].row);
    if (allSameRow) {
      const row = unmarked[0].row;
      const rowStarsNeeded = grid.starsPerRegion - starsInRow(grid, row);
      if (regionStarsNeeded === rowStarsNeeded) {
        // Eliminate cells in row not in this region
        const rowCells = getUnmarkedInRow(grid, row);
        for (const cell of rowCells) {
          if (grid.regions[cell.row][cell.col] !== regionId) {
            eliminations.push(cell);
          }
        }
      }
    }

    // Check if all in same column
    const allSameCol = unmarked.every((c) => c.col === unmarked[0].col);
    if (allSameCol) {
      const col = unmarked[0].col;
      const colStarsNeeded = grid.starsPerRegion - starsInCol(grid, col);
      if (regionStarsNeeded === colStarsNeeded) {
        const colCells = getUnmarkedInCol(grid, col);
        for (const cell of colCells) {
          if (grid.regions[cell.row][cell.col] !== regionId) {
            eliminations.push(cell);
          }
        }
      }
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R5 Shape Confined to Constraint",
    tier: 2,
    eliminations,
    placements: [],
  };
}

// ============================================
// TIER 3: Counting
// ============================================

// Helper: get shapes that have unmarked cells in given rows
function getShapesInRows(grid: Grid, rows: number[]): Set<number> {
  const shapes = new Set<number>();
  for (const r of rows) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.UNKNOWN) {
        shapes.add(grid.regions[r][c]);
      }
    }
  }
  return shapes;
}

// Helper: get shapes that have unmarked cells in given columns
function getShapesInCols(grid: Grid, cols: number[]): Set<number> {
  const shapes = new Set<number>();
  for (const c of cols) {
    for (let r = 0; r < grid.size; r++) {
      if (grid.cells[r][c] === CellState.UNKNOWN) {
        shapes.add(grid.regions[r][c]);
      }
    }
  }
  return shapes;
}

// Helper: check if all unmarked cells of shapes are within rows
function shapesContainedInRows(
  grid: Grid,
  shapes: Set<number>,
  rows: number[],
): boolean {
  const rowSet = new Set(rows);
  for (const regionId of shapes) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    for (const cell of unmarked) {
      if (!rowSet.has(cell.row)) return false;
    }
  }
  return true;
}

// Helper: check if all unmarked cells of shapes are within columns
function shapesContainedInCols(
  grid: Grid,
  shapes: Set<number>,
  cols: number[],
): boolean {
  const colSet = new Set(cols);
  for (const regionId of shapes) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    for (const cell of unmarked) {
      if (!colSet.has(cell.col)) return false;
    }
  }
  return true;
}

// R6.1 Undercounting Rows - Q shapes contained in Q rows
export function r6_1_undercountingRows(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  // Try combinations of shapes
  for (let q = 2; q <= grid.size - 1; q++) {
    const regionIds = Array.from(
      { length: grid.regionList.length },
      (_, i) => i,
    );
    const shapeCombos = combinations(regionIds, q);

    for (const shapeSet of shapeCombos) {
      // Find rows that contain these shapes' unmarked cells
      const rows = new Set<number>();
      for (const regionId of shapeSet) {
        const unmarked = getUnmarkedInRegion(grid, regionId);
        for (const cell of unmarked) {
          rows.add(cell.row);
        }
      }

      // If Q shapes are in exactly Q rows
      if (rows.size === q) {
        // Eliminate cells in those rows not in these shapes
        for (const row of rows) {
          const rowCells = getUnmarkedInRow(grid, row);
          for (const cell of rowCells) {
            if (!shapeSet.includes(grid.regions[cell.row][cell.col])) {
              eliminations.push(cell);
            }
          }
        }
      }
    }

    if (eliminations.length > 0) break;
  }

  return {
    applied: eliminations.length > 0,
    name: "R6.1 Undercounting Rows",
    tier: 3,
    eliminations,
    placements: [],
  };
}

// R6.2 Undercounting Columns - Q shapes contained in Q columns
export function r6_2_undercountingCols(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let q = 2; q <= grid.size - 1; q++) {
    const regionIds = Array.from(
      { length: grid.regionList.length },
      (_, i) => i,
    );
    const shapeCombos = combinations(regionIds, q);

    for (const shapeSet of shapeCombos) {
      const cols = new Set<number>();
      for (const regionId of shapeSet) {
        const unmarked = getUnmarkedInRegion(grid, regionId);
        for (const cell of unmarked) {
          cols.add(cell.col);
        }
      }

      if (cols.size === q) {
        for (const col of cols) {
          const colCells = getUnmarkedInCol(grid, col);
          for (const cell of colCells) {
            if (!shapeSet.includes(grid.regions[cell.row][cell.col])) {
              eliminations.push(cell);
            }
          }
        }
      }
    }

    if (eliminations.length > 0) break;
  }

  return {
    applied: eliminations.length > 0,
    name: "R6.2 Undercounting Columns",
    tier: 3,
    eliminations,
    placements: [],
  };
}

// R7.1 Overcounting Rows - Q rows contained in Q shapes
export function r7_1_overcountingRows(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let q = 2; q <= grid.size - 1; q++) {
    const rowIndices = Array.from({ length: grid.size }, (_, i) => i);
    const rowCombos = combinations(rowIndices, q);

    for (const rowSet of rowCombos) {
      const shapes = getShapesInRows(grid, rowSet);

      if (shapes.size === q && shapesContainedInRows(grid, shapes, rowSet)) {
        // Actually need to check: all unmarked in these rows are in these shapes
        let allInShapes = true;
        for (const row of rowSet) {
          const rowCells = getUnmarkedInRow(grid, row);
          for (const cell of rowCells) {
            if (!shapes.has(grid.regions[cell.row][cell.col])) {
              allInShapes = false;
              break;
            }
          }
          if (!allInShapes) break;
        }

        if (allInShapes) {
          // Eliminate cells in these shapes not in these rows
          for (const regionId of shapes) {
            const regionCells = getUnmarkedInRegion(grid, regionId);
            for (const cell of regionCells) {
              if (!rowSet.includes(cell.row)) {
                eliminations.push(cell);
              }
            }
          }
        }
      }
    }

    if (eliminations.length > 0) break;
  }

  return {
    applied: eliminations.length > 0,
    name: "R7.1 Overcounting Rows",
    tier: 3,
    eliminations,
    placements: [],
  };
}

// R7.2 Overcounting Columns - Q columns contained in Q shapes
export function r7_2_overcountingCols(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (let q = 2; q <= grid.size - 1; q++) {
    const colIndices = Array.from({ length: grid.size }, (_, i) => i);
    const colCombos = combinations(colIndices, q);

    for (const colSet of colCombos) {
      const shapes = getShapesInCols(grid, colSet);

      if (shapes.size === q && shapesContainedInCols(grid, shapes, colSet)) {
        let allInShapes = true;
        for (const col of colSet) {
          const colCells = getUnmarkedInCol(grid, col);
          for (const cell of colCells) {
            if (!shapes.has(grid.regions[cell.row][cell.col])) {
              allInShapes = false;
              break;
            }
          }
          if (!allInShapes) break;
        }

        if (allInShapes) {
          for (const regionId of shapes) {
            const regionCells = getUnmarkedInRegion(grid, regionId);
            for (const cell of regionCells) {
              if (!colSet.includes(cell.col)) {
                eliminations.push(cell);
              }
            }
          }
        }
      }
    }

    if (eliminations.length > 0) break;
  }

  return {
    applied: eliminations.length > 0,
    name: "R7.2 Overcounting Columns",
    tier: 3,
    eliminations,
    placements: [],
  };
}

// ============================================
// TIER 4: Tiling
// ============================================

// MinTiles algorithm - greedy approximation
export function minTiles(cells: Cell[]): number {
  if (cells.length === 0) return 0;

  const uncovered = new Set(cells.map((c) => `${c.row},${c.col}`));
  let tileCount = 0;

  while (uncovered.size > 0) {
    // Try 2x2 first
    let best2x2: string[] | null = null;
    let best2x2Count = 0;

    for (const cellKey of uncovered) {
      const [r, c] = cellKey.split(",").map(Number);
      const positions = [
        [`${r},${c}`, `${r},${c + 1}`, `${r + 1},${c}`, `${r + 1},${c + 1}`],
        [`${r},${c}`, `${r},${c - 1}`, `${r + 1},${c}`, `${r + 1},${c - 1}`],
        [`${r},${c}`, `${r},${c + 1}`, `${r - 1},${c}`, `${r - 1},${c + 1}`],
        [`${r},${c}`, `${r},${c - 1}`, `${r - 1},${c}`, `${r - 1},${c - 1}`],
      ];

      for (const pos of positions) {
        const covered = pos.filter((p) => uncovered.has(p));
        if (covered.length >= 2 && covered.length > best2x2Count) {
          best2x2 = covered;
          best2x2Count = covered.length;
        }
      }
    }

    if (best2x2 && best2x2Count >= 2) {
      for (const p of best2x2) uncovered.delete(p);
      tileCount++;
      continue;
    }

    // Try 1x3 or 3x1
    let best1x3: string[] | null = null;
    let best1x3Count = 0;

    for (const cellKey of uncovered) {
      const [r, c] = cellKey.split(",").map(Number);
      const positions = [
        [`${r},${c}`, `${r},${c + 1}`, `${r},${c + 2}`],
        [`${r},${c}`, `${r},${c - 1}`, `${r},${c - 2}`],
        [`${r},${c}`, `${r + 1},${c}`, `${r + 2},${c}`],
        [`${r},${c}`, `${r - 1},${c}`, `${r - 2},${c}`],
      ];

      for (const pos of positions) {
        const covered = pos.filter((p) => uncovered.has(p));
        if (covered.length >= 2 && covered.length > best1x3Count) {
          best1x3 = covered;
          best1x3Count = covered.length;
        }
      }
    }

    if (best1x3 && best1x3Count >= 2) {
      for (const p of best1x3) uncovered.delete(p);
      tileCount++;
      continue;
    }

    // Try 1x2 or 2x1
    let best1x2: string[] | null = null;

    for (const cellKey of uncovered) {
      const [r, c] = cellKey.split(",").map(Number);
      const positions = [
        [`${r},${c}`, `${r},${c + 1}`],
        [`${r},${c}`, `${r + 1},${c}`],
      ];

      for (const pos of positions) {
        if (pos.every((p) => uncovered.has(p))) {
          best1x2 = pos;
          break;
        }
      }
      if (best1x2) break;
    }

    if (best1x2) {
      for (const p of best1x2) uncovered.delete(p);
      tileCount++;
      continue;
    }

    // Remaining singles
    tileCount += uncovered.size;
    break;
  }

  return tileCount;
}

// Track targeted shapes
const targetedShapes = new Set<number>();

// R8.1 Greedy Tiling - Identify targeted shapes
export function r8_1_greedyTiling(grid: Grid): RuleResult {
  targetedShapes.clear();

  for (let regionId = 0; regionId < grid.regionList.length; regionId++) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    const starsNeeded = grid.starsPerRegion - starsInRegion(grid, regionId);

    if (starsNeeded > 0 && unmarked.length > 0) {
      const tiles = minTiles(unmarked);
      if (tiles === starsNeeded) {
        targetedShapes.add(regionId);
      }
    }
  }

  return {
    applied: false, // This rule just marks shapes, doesn't eliminate
    name: "R8.1 Greedy Tiling",
    tier: 4,
    eliminations: [],
    placements: [],
    message: `Targeted shapes: ${Array.from(targetedShapes).join(", ")}`,
  };
}

// R9.1 Internal Exclusion - Test placing star in targeted shape
export function r9_1_internalExclusion(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (const regionId of targetedShapes) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    const starsNeeded = grid.starsPerRegion - starsInRegion(grid, regionId);

    for (const cell of unmarked) {
      // Simulate placing a star
      const remaining = unmarked.filter((c) => {
        // Remove this cell and its neighbors
        if (c.row === cell.row && c.col === cell.col) return false;
        const dr = Math.abs(c.row - cell.row);
        const dc = Math.abs(c.col - cell.col);
        if (dr <= 1 && dc <= 1) return false;
        return true;
      });

      const tilesAfter = minTiles(remaining);
      if (tilesAfter < starsNeeded - 1) {
        eliminations.push(cell);
      }
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R9.1 Internal Exclusion",
    tier: 4,
    eliminations,
    placements: [],
  };
}

// R9.2 External Exclusion - Test placing star adjacent to targeted shape
export function r9_2_externalExclusion(grid: Grid): RuleResult {
  const eliminations: Cell[] = [];

  for (const regionId of targetedShapes) {
    const unmarked = getUnmarkedInRegion(grid, regionId);
    const starsNeeded = grid.starsPerRegion - starsInRegion(grid, regionId);

    // Find cells adjacent to this shape
    const adjacentCells = new Set<string>();
    for (const cell of unmarked) {
      const neighbors = getNeighbors(grid, cell);
      for (const n of neighbors) {
        if (
          grid.regions[n.row][n.col] !== regionId &&
          grid.cells[n.row][n.col] === CellState.UNKNOWN
        ) {
          adjacentCells.add(`${n.row},${n.col}`);
        }
      }
    }

    for (const adjKey of adjacentCells) {
      const [ar, ac] = adjKey.split(",").map(Number);

      // Simulate placing star at adjacent cell
      const remaining = unmarked.filter((c) => {
        const dr = Math.abs(c.row - ar);
        const dc = Math.abs(c.col - ac);
        return !(dr <= 1 && dc <= 1);
      });

      const tilesAfter = minTiles(remaining);
      if (tilesAfter < starsNeeded) {
        eliminations.push({ row: ar, col: ac });
      }
    }
  }

  return {
    applied: eliminations.length > 0,
    name: "R9.2 External Exclusion",
    tier: 4,
    eliminations,
    placements: [],
  };
}

// Exhaustive minTiles - find maximum independent set (true max stars)
function exhaustiveMinTiles(cells: Cell[]): number {
  if (cells.length === 0) return 0;

  function areAdjacent(c1: Cell, c2: Cell): boolean {
    const dr = Math.abs(c1.row - c2.row);
    const dc = Math.abs(c1.col - c2.col);
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
  }

  // Build adjacency matrix
  const adj: boolean[][] = [];
  for (let i = 0; i < cells.length; i++) {
    adj[i] = [];
    for (let j = 0; j < cells.length; j++) {
      adj[i][j] = areAdjacent(cells[i], cells[j]);
    }
  }

  // Find maximum independent set via backtracking
  let maxSize = 0;

  function backtrack(
    index: number,
    currentSize: number,
    excluded: boolean[],
  ): void {
    // Pruning: can't beat current max
    if (currentSize + (cells.length - index) <= maxSize) return;

    if (index === cells.length) {
      maxSize = Math.max(maxSize, currentSize);
      return;
    }

    // Skip if excluded
    if (excluded[index]) {
      backtrack(index + 1, currentSize, excluded);
      return;
    }

    // Try including this cell
    const newExcluded = [...excluded];
    for (let j = index + 1; j < cells.length; j++) {
      if (adj[index][j]) newExcluded[j] = true;
    }
    backtrack(index + 1, currentSize + 1, newExcluded);

    // Try not including this cell
    backtrack(index + 1, currentSize, excluded);
  }

  backtrack(0, 0, new Array(cells.length).fill(false));
  return maxSize;
}

// R10.1 Exhaustive Tiling - Find true minimum tiles via exhaustive search
export function r10_1_exhaustiveTiling(grid: Grid): RuleResult {
  // Check shapes that weren't marked as targeted by greedy
  for (let regionId = 0; regionId < grid.regionList.length; regionId++) {
    if (targetedShapes.has(regionId)) continue;

    const unmarked = getUnmarkedInRegion(grid, regionId);
    const starsNeeded = grid.starsPerRegion - starsInRegion(grid, regionId);

    if (starsNeeded <= 0 || unmarked.length === 0) continue;

    // Only run exhaustive on small shapes (K ≤ S×4)
    if (unmarked.length > grid.starsPerRegion * 4) continue;

    const trueMinTiles = exhaustiveMinTiles(unmarked);

    if (trueMinTiles === starsNeeded) {
      // Mark as targeted and signal to restart rules
      targetedShapes.add(regionId);
      return {
        applied: true,
        name: "R10.1 Exhaustive Tiling",
        tier: 4,
        eliminations: [],
        placements: [],
        message: `Shape ${String.fromCharCode(65 + regionId)} is now targeted (exhaustive minTiles=${trueMinTiles})`,
      };
    } else if (trueMinTiles < starsNeeded) {
      // Puzzle is unsolvable - this shape can't hold enough stars
      return {
        applied: false,
        name: "R10.1 Exhaustive Tiling",
        tier: 4,
        eliminations: [],
        placements: [],
        message: `Shape ${String.fromCharCode(65 + regionId)} unsolvable (minTiles=${trueMinTiles} < needed=${starsNeeded})`,
      };
    }
    // trueMinTiles > starsNeeded: shape remains untargeted, continue checking
  }

  return {
    applied: false,
    name: "R10.1 Exhaustive Tiling",
    tier: 4,
    eliminations: [],
    placements: [],
  };
}

// Helper: generate combinations
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];

  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

// ============================================
// Rule Registry
// ============================================

export type Rule = (grid: Grid) => RuleResult;

export const tier1Rules: Rule[] = [
  r1_1_eliminateNeighbors,
  r2_1_rowComplete,
  r2_2_colComplete,
  r2_3_regionComplete,
];

export const tier2Rules: Rule[] = [
  r3_1_rowForced,
  r3_2_colForced,
  r3_3_regionForced,
  r4_constraintFillsShape,
  r5_shapeConfinedToConstraint,
];

export const tier3Rules: Rule[] = [
  r6_1_undercountingRows,
  r6_2_undercountingCols,
  r7_1_overcountingRows,
  r7_2_overcountingCols,
];

export const tier4Rules: Rule[] = [
  r8_1_greedyTiling,
  r9_1_internalExclusion,
  r9_2_externalExclusion,
  r10_1_exhaustiveTiling,
];

export const allRules: Rule[] = [
  ...tier1Rules,
  ...tier2Rules,
  ...tier3Rules,
  ...tier4Rules,
];
