#!/usr/bin/env tsx

import { solveCustom, CustomPuzzleInput } from '../index';

// Parse command line or use example
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npx ts-node solve-custom.ts <regions>');
  console.log('');
  console.log('Example: npx ts-node solve-custom.ts "AABBC,AABCC,DDBCC,DDEEE,DDEEE"');
  console.log('');
  console.log('Running with example 5x5 puzzle...\n');

  // Example puzzle
  const examplePuzzle: CustomPuzzleInput = {
    size: 5,
    starsPerRegion: 1,
    regions: [
      'AABBC',
      'AABCC',
      'DDBCC',
      'DDEEE',
      'DDEEE',
    ],
  };

  solveCustom(examplePuzzle, true);
} else {
  // Parse input
  const regionString = args[0];
  const rows = regionString.split(',');
  const size = rows.length;

  // Validate
  if (rows.some(r => r.length !== size)) {
    console.error('Error: All rows must have same length as number of rows');
    process.exit(1);
  }

  const verbose = args.includes('-v') || args.includes('--verbose');

  const puzzle: CustomPuzzleInput = {
    size,
    regions: rows,
  };

  solveCustom(puzzle, verbose);
}
