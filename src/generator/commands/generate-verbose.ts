#!/usr/bin/env tsx

import { generate, formatGrid, formatRegions, parseCustomPuzzle } from '../index';

const args = process.argv.slice(2);
const size = parseInt(args[0]) || 5;
const seed = args[1] ? parseInt(args[1]) : undefined;

console.log(`=== VERBOSE PUZZLE GENERATION ===`);
console.log(`Size: ${size}x${size}`);
console.log(`Seed: ${seed ?? 'random'}`);
console.log();

const result = generate({ size, seed, maxAttempts: 100, verbose: true });

console.log();
console.log('=== FINAL RESULT ===');

if (result.success && result.puzzle) {
  // Reconstruct grid for display
  const grid = parseCustomPuzzle({
    size,
    starsPerRegion: result.puzzle.starsPerRegion,
    regions: result.puzzle.regions,
  });

  // Mark stars
  for (const star of result.puzzle.solution) {
    grid.cells[star.row][star.col] = 2; // STAR
  }

  console.log('Puzzle Layout:');
  console.log(formatRegions(grid));
  console.log();

  console.log('Solution:');
  console.log(formatGrid(grid));
  console.log();

  console.log('Puzzle Definition (JSON):');
  console.log(JSON.stringify(result.puzzle, null, 2));
} else {
  console.log(`Generation failed after ${result.attempts} attempts`);
  console.log(`Error: ${result.error}`);
}
