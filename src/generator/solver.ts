import { Grid, Cell, CellState, SolveResult, Solution } from './types';
import {
  allRules,
  tier1Rules,
  tier2Rules,
  tier3Rules,
  tier4Rules,
  RuleResult,
} from './rules';

export interface SolverOptions {
  verbose?: boolean;
  maxTier?: number; // Limit rules to certain tier for difficulty testing
  maxCycles?: number;
}

// Deep clone a grid
function cloneGrid(grid: Grid): Grid {
  return {
    ...grid,
    cells: grid.cells.map(row => [...row]),
    regions: grid.regions.map(row => [...row]),
    regionList: grid.regionList.map(r => ({
      ...r,
      cells: r.cells.map(c => ({ ...c })),
    })),
  };
}

// Apply eliminations and placements to grid
function applyResult(grid: Grid, result: RuleResult): void {
  for (const cell of result.eliminations) {
    if (grid.cells[cell.row][cell.col] === CellState.UNKNOWN) {
      grid.cells[cell.row][cell.col] = CellState.EMPTY;
    }
  }
  for (const cell of result.placements) {
    if (grid.cells[cell.row][cell.col] === CellState.UNKNOWN) {
      grid.cells[cell.row][cell.col] = CellState.STAR;
    }
  }
}

// Check if puzzle is solved
function isSolved(grid: Grid): boolean {
  const starsPerRow = new Array(grid.size).fill(0);
  const starsPerCol = new Array(grid.size).fill(0);
  const starsPerRegion = new Array(grid.regionList.length).fill(0);

  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.STAR) {
        starsPerRow[r]++;
        starsPerCol[c]++;
        starsPerRegion[grid.regions[r][c]]++;
      }
    }
  }

  // Check all constraints met
  for (let i = 0; i < grid.size; i++) {
    if (starsPerRow[i] !== grid.starsPerRegion) return false;
    if (starsPerCol[i] !== grid.starsPerRegion) return false;
  }
  for (let i = 0; i < grid.regionList.length; i++) {
    if (starsPerRegion[i] !== grid.starsPerRegion) return false;
  }

  return true;
}

// Check if puzzle is in invalid state
function isInvalid(grid: Grid): boolean {
  // Check for adjacent stars
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.STAR) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < grid.size && nc >= 0 && nc < grid.size) {
              if (grid.cells[nr][nc] === CellState.STAR) {
                return true; // Adjacent stars
              }
            }
          }
        }
      }
    }
  }

  // Check for over-constrained rows/cols/regions
  const starsPerRow = new Array(grid.size).fill(0);
  const starsPerCol = new Array(grid.size).fill(0);
  const starsPerRegion = new Array(grid.regionList.length).fill(0);
  const unknownPerRow = new Array(grid.size).fill(0);
  const unknownPerCol = new Array(grid.size).fill(0);
  const unknownPerRegion = new Array(grid.regionList.length).fill(0);

  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      const regionId = grid.regions[r][c];
      if (grid.cells[r][c] === CellState.STAR) {
        starsPerRow[r]++;
        starsPerCol[c]++;
        starsPerRegion[regionId]++;
      } else if (grid.cells[r][c] === CellState.UNKNOWN) {
        unknownPerRow[r]++;
        unknownPerCol[c]++;
        unknownPerRegion[regionId]++;
      }
    }
  }

  // Too many stars
  for (let i = 0; i < grid.size; i++) {
    if (starsPerRow[i] > grid.starsPerRegion) return true;
    if (starsPerCol[i] > grid.starsPerRegion) return true;
  }
  for (let i = 0; i < grid.regionList.length; i++) {
    if (starsPerRegion[i] > grid.starsPerRegion) return true;
  }

  // Not enough possible stars
  for (let i = 0; i < grid.size; i++) {
    if (starsPerRow[i] + unknownPerRow[i] < grid.starsPerRegion) return true;
    if (starsPerCol[i] + unknownPerCol[i] < grid.starsPerRegion) return true;
  }
  for (let i = 0; i < grid.regionList.length; i++) {
    if (starsPerRegion[i] + unknownPerRegion[i] < grid.starsPerRegion) return true;
  }

  return false;
}

// Get applicable rules based on max tier
function getRulesForTier(maxTier: number) {
  const rules = [...tier1Rules];
  if (maxTier >= 2) rules.push(...tier2Rules);
  if (maxTier >= 3) rules.push(...tier3Rules);
  if (maxTier >= 4) rules.push(...tier4Rules);
  return rules;
}

// Extract solution from solved grid
function extractSolution(grid: Grid): Solution {
  const stars: Cell[] = [];
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.STAR) {
        stars.push({ row: r, col: c });
      }
    }
  }
  return { stars };
}

// Main solver function
export function solve(inputGrid: Grid, options: SolverOptions = {}): SolveResult {
  const { verbose = false, maxTier = 4, maxCycles = 1000 } = options;

  const grid = cloneGrid(inputGrid);
  const rulesApplied: string[] = [];
  let cycles = 0;
  let maxRuleTierUsed = 0;

  const rules = getRulesForTier(maxTier);

  const log = (msg: string) => {
    if (verbose) console.log(msg);
  };

  log(`\n${'='.repeat(60)}`);
  log(`SOLVER START`);
  log(`Grid: ${grid.size}x${grid.size}, ${grid.starsPerRegion} stars per constraint`);
  log(`Rules loaded: ${rules.length} (max tier: ${maxTier})`);
  log(`${'='.repeat(60)}\n`);

  if (verbose) {
    log('Initial grid:');
    log(formatGrid(grid));
    log('');
  }

  while (cycles < maxCycles) {
    cycles++;
    let progress = false;

    log(`${'─'.repeat(40)}`);
    log(`CYCLE ${cycles}`);
    log(`${'─'.repeat(40)}`);

    // Check validity
    if (isInvalid(grid)) {
      log(`❌ Invalid state detected - puzzle broken`);
      return {
        solved: false,
        grid,
        rulesApplied,
        cycles,
        maxRuleTier: maxRuleTierUsed,
      };
    }

    // Check if solved
    if (isSolved(grid)) {
      log(`✅ PUZZLE SOLVED!`);
      log(`\nFinal grid:`);
      log(formatGrid(grid));
      return {
        solved: true,
        grid,
        solution: extractSolution(grid),
        rulesApplied,
        cycles,
        maxRuleTier: maxRuleTierUsed,
      };
    }

    // Show current state
    if (verbose) {
      const stars = countStars(grid);
      const unknown = countUnknown(grid);
      log(`State: ${stars} stars placed, ${unknown} cells unknown`);
      log('');
    }

    // Try each rule
    for (const rule of rules) {
      const result = rule(grid);

      log(`  [Tier ${result.tier}] ${result.name}`);

      if (result.applied) {
        progress = true;
        rulesApplied.push(result.name);
        maxRuleTierUsed = Math.max(maxRuleTierUsed, result.tier);

        log(`    → APPLIED`);
        if (result.eliminations.length > 0) {
          log(`    → Eliminated ${result.eliminations.length} cell(s): ${result.eliminations.map(c => `(${c.row},${c.col})`).join(', ')}`);
        }
        if (result.placements.length > 0) {
          log(`    → Placed ${result.placements.length} star(s): ${result.placements.map(c => `(${c.row},${c.col})`).join(', ')}`);
        }
        if (result.message) {
          log(`    → ${result.message}`);
        }

        applyResult(grid, result);

        log('');
        log('Grid after rule:');
        log(formatGrid(grid));
        log('');

        break; // Restart rule loop
      } else {
        log(`    → no match`);
      }
    }

    if (!progress) {
      log(`\n⚠️  No rules matched - puzzle unsolvable with current rules`);
      log(`\nFinal grid:`);
      log(formatGrid(grid));
      break;
    }
  }

  return {
    solved: false,
    grid,
    rulesApplied,
    cycles,
    maxRuleTier: maxRuleTierUsed,
  };
}

// Count helpers for verbose output
function countStars(grid: Grid): number {
  let count = 0;
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.STAR) count++;
    }
  }
  return count;
}

function countUnknown(grid: Grid): number {
  let count = 0;
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c] === CellState.UNKNOWN) count++;
    }
  }
  return count;
}

// Solve with verbose output
export function solveVerbose(grid: Grid, maxTier = 4): SolveResult {
  return solve(grid, { verbose: true, maxTier });
}

// Test if solvable with specific tier
export function isSolvableWithTier(grid: Grid, tier: number): boolean {
  const result = solve(grid, { maxTier: tier });
  return result.solved;
}

// Format grid for display
export function formatGrid(grid: Grid): string {
  const lines: string[] = [];

  for (let r = 0; r < grid.size; r++) {
    let line = '';
    for (let c = 0; c < grid.size; c++) {
      const state = grid.cells[r][c];
      const region = grid.regions[r][c];
      const regionChar = String.fromCharCode(65 + region); // A, B, C...

      if (state === CellState.STAR) {
        line += '★ ';
      } else if (state === CellState.EMPTY) {
        line += '· ';
      } else {
        line += regionChar + ' ';
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}
