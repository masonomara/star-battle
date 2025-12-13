// Cell state in the puzzle grid
export enum CellState {
  UNKNOWN = 0,   // Not yet determined
  EMPTY = 1,     // Confirmed empty (X)
  STAR = 2,      // Confirmed star
}

// A cell position
export interface Cell {
  row: number;
  col: number;
}

// A region (shape) in the puzzle
export interface Region {
  id: number;
  cells: Cell[];
}

// The puzzle grid
export interface Grid {
  size: number;                    // N for NxN grid
  starsPerRegion: number;          // Usually 1 for 5x5, 2 for 10x10
  cells: CellState[][];            // Cell states
  regions: number[][];             // Region ID for each cell
  regionList: Region[];            // All regions
}

// Solution with star positions
export interface Solution {
  stars: Cell[];
}

// Result from solver
export interface SolveResult {
  solved: boolean;
  grid: Grid;
  solution?: Solution;
  rulesApplied: string[];          // Log of rules used
  cycles: number;                  // Deduction cycles needed
  maxRuleTier: number;             // Highest tier rule used (difficulty)
}

// Result from layout generator
export interface LayoutResult {
  grid: Grid;
  regionCount: number;
}

// Puzzle definition for storage
export interface PuzzleDefinition {
  size: number;
  starsPerRegion: number;
  regions: number[][];             // Region IDs
  solution: Cell[];                // Star positions
  difficulty: {
    cycles: number;
    maxRuleTier: number;
  };
}

// Custom puzzle input format
export interface CustomPuzzleInput {
  size: number;
  starsPerRegion?: number;         // Defaults to 1 for 5x5, 2 for 10x10
  regions: string[] | number[][];  // String rows like "AABBC" or numeric grid
}
