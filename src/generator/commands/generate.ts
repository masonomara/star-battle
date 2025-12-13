#!/usr/bin/env tsx

import { generate, formatGrid, formatRegions } from '../index';

const args = process.argv.slice(2);
const size = parseInt(args[0]) || 5;
const seed = args[1] ? parseInt(args[1]) : undefined;

console.log(`Generating ${size}x${size} Star Battle puzzle...\n`);

const result = generate({ size, seed, maxAttempts: 500 });

if (result.success && result.puzzle) {
  console.log('Regions:');
  const regionGrid = {
    size,
    starsPerRegion: result.puzzle.starsPerRegion,
    cells: [],
    regions: result.puzzle.regions,
    regionList: [],
  };
  console.log(formatRegions(regionGrid as any));
  console.log();

  console.log('Solution:');
  console.log(result.puzzle.solution.map(s => `(${s.row},${s.col})`).join(', '));
  console.log();

  console.log('Stats:');
  console.log(`  Attempts: ${result.attempts}`);
  console.log(`  Difficulty: Tier ${result.puzzle.difficulty.maxRuleTier}`);
  console.log(`  Cycles: ${result.puzzle.difficulty.cycles}`);
} else {
  console.log(`Failed: ${result.error}`);
  console.log(`Attempts: ${result.attempts}`);
}
