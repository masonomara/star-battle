import { createRequire } from 'node:module';
import { Board, GeneratorError } from "./helpers/types";

const _req = createRequire(import.meta.url);
const wasmGen = _req('../pkg/dlx.js') as {
  layout_with_seed(size: number, stars: number, seed: number): Int32Array;
  layout_inverse(size: number, stars: number, seed: number): Int32Array;
};

export function layoutInverse(size: number, stars: number, seed: number): Board {
  const flat = wasmGen.layout_inverse(size, stars, seed);
  if (flat.length === 0) throw new GeneratorError("Inverse layout generation stuck", "generator_stuck");
  const grid: number[][] = [];
  for (let r = 0; r < size; r++) {
    grid.push(Array.from(flat.subarray(r * size, (r + 1) * size)));
  }
  return { grid, stars };
}

export type GenerateOptions = {
  maxAttempts?: number;
};

export type GenerateResult = {
  board: Board;
  seed: number;
};

export function layoutWithSeed(size: number, stars: number, seed: number): Board {
  const flat = wasmGen.layout_with_seed(size, stars, seed);
  if (flat.length === 0) throw new GeneratorError("Layout generation stuck", "generator_stuck");
  const grid: number[][] = [];
  for (let r = 0; r < size; r++) {
    grid.push(Array.from(flat.subarray(r * size, (r + 1) * size)));
  }
  return { grid, stars };
}

export function generate(
  size: number,
  stars: number,
  options: GenerateOptions = {},
): GenerateResult {
  validateInputs(size, stars);

  const maxAttempts = options.maxAttempts ?? 100000;
  const baseSeed = Date.now() ^ (Math.random() * 0x100000000);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = (baseSeed + attempt) | 0;
    try {
      return { board: layoutWithSeed(size, stars, seed), seed };
    } catch (e) {
      if (e instanceof GeneratorError) continue;
      throw e;
    }
  }

  throw new GeneratorError(
    `Failed to generate ${size}x${size} ${stars}-star layout after ${maxAttempts} attempts`,
    "generator_stuck",
  );
}

function validateInputs(size: number, stars: number): void {
  if (!Number.isInteger(size) || size < 4 || size > 25)
    throw new Error(`size must be an integer between 4 and 25, got ${size}`);
  if (!Number.isInteger(stars) || stars < 1 || stars > 6)
    throw new Error(`stars must be an integer between 1 and 6, got ${stars}`);
  if (stars > Math.floor(size / 2))
    throw new Error(`stars (${stars}) cannot exceed size/2 (${Math.floor(size / 2)})`);
}
