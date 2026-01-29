/**
 * Star Battle Format (SBF) v1.0
 *
 * A compact, URL-safe format for sharing Star Battle puzzles with metadata.
 *
 * Format: <header>.<regions>[.<metadata>]
 *
 * Header:   {size}x{stars}        e.g., "10x2"
 * Regions:  Base36 region IDs     e.g., "0011223344..." (size² characters)
 * Metadata: Key-value tokens      e.g., "s42d7l4c12"
 *
 * Metadata keys:
 *   s{int} - seed
 *   d{int} - difficulty (1-10)
 *   l{int} - maxLevel (highest rule level used)
 *   c{int} - cycles (solver iterations)
 *   v{int} - format version (default 1)
 *
 * Example: "10x2.0000111122000111222200111222330011223333...s42d7l4c12"
 */

import { Board, Puzzle, Solution } from "./types";

const BASE36_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
const MAX_REGIONS = 36;
const FORMAT_VERSION = 1;

export type SBFMetadata = {
  seed?: number;
  difficulty?: number;
  maxLevel?: number;
  cycles?: number;
  version?: number;
};

export type SBFData = {
  board: Board;
  metadata: SBFMetadata;
};

/**
 * Encode a Board to SBF format.
 * Optionally include metadata from a Solution or Puzzle.
 */
export function encodeSBF(board: Board, metadata?: SBFMetadata): string {
  const size = board.grid.length;

  // Validate grid is square
  for (const row of board.grid) {
    if (row.length !== size) {
      throw new Error(
        `Grid is not square: row has ${row.length} cells, expected ${size}`,
      );
    }
  }

  // Validate region IDs are in range
  const regionIds = new Set<number>();
  for (const row of board.grid) {
    for (const id of row) {
      if (id < 0 || id >= MAX_REGIONS) {
        throw new Error(`Region ID ${id} out of range (0-${MAX_REGIONS - 1})`);
      }
      regionIds.add(id);
    }
  }

  // Header
  const header = `${size}x${board.stars}`;

  // Regions: flatten grid row-major, convert to base36
  const regions = board.grid
    .flatMap((row) => row.map((id) => BASE36_CHARS[id]))
    .join("");

  // Metadata
  const metaParts: string[] = [];
  if (metadata) {
    if (metadata.seed !== undefined) metaParts.push(`s${metadata.seed}`);
    if (metadata.difficulty !== undefined)
      metaParts.push(`d${metadata.difficulty}`);
    if (metadata.maxLevel !== undefined)
      metaParts.push(`l${metadata.maxLevel}`);
    if (metadata.cycles !== undefined) metaParts.push(`c${metadata.cycles}`);
    if (metadata.version !== undefined && metadata.version !== FORMAT_VERSION) {
      metaParts.push(`v${metadata.version}`);
    }
  }

  const metaString = metaParts.join("");

  if (metaString) {
    return `${header}.${regions}.${metaString}`;
  }
  return `${header}.${regions}`;
}

/**
 * Encode a Solution (Board + seed + solver stats) to SBF.
 */
export function encodeSolution(solution: Solution): string {
  return encodeSBF(solution.board, {
    seed: solution.seed,
    maxLevel: solution.maxLevel,
    cycles: solution.cycles,
  });
}

/**
 * Encode a Puzzle (Solution + difficulty) to SBF.
 */
export function encodePuzzle(puzzle: Puzzle): string {
  return encodeSBF(puzzle.board, {
    seed: puzzle.seed,
    difficulty: puzzle.difficulty,
    maxLevel: puzzle.maxLevel,
    cycles: puzzle.cycles,
  });
}

/**
 * Decode an SBF string to a Board and metadata.
 */
export function decodeSBF(sbf: string): SBFData {
  const parts = sbf.split(".");

  if (parts.length < 2 || parts.length > 3) {
    throw new Error(
      `Invalid SBF format: expected 2-3 dot-separated parts, got ${parts.length}`,
    );
  }

  const [header, regions, metaString] = parts;

  // Parse header
  const headerMatch = header.match(/^(\d+)x(\d+)$/);
  if (!headerMatch) {
    throw new Error(`Invalid header format: "${header}" (expected NxM)`);
  }

  const size = parseInt(headerMatch[1], 10);
  const stars = parseInt(headerMatch[2], 10);

  if (size < 1 || size > MAX_REGIONS) {
    throw new Error(`Invalid grid size: ${size} (must be 1-${MAX_REGIONS})`);
  }
  if (stars < 1) {
    throw new Error(`Invalid star count: ${stars} (must be >= 1)`);
  }

  // Parse regions
  const expectedLength = size * size;
  if (regions.length !== expectedLength) {
    throw new Error(
      `Invalid regions length: ${regions.length} (expected ${expectedLength} for ${size}x${size} grid)`,
    );
  }

  const grid: number[][] = [];
  for (let row = 0; row < size; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < size; col++) {
      const char = regions[row * size + col];
      const regionId = BASE36_CHARS.indexOf(char.toLowerCase());
      if (regionId === -1) {
        throw new Error(
          `Invalid region character: "${char}" at position ${row * size + col}`,
        );
      }
      rowData.push(regionId);
    }
    grid.push(rowData);
  }

  // Validate region count matches grid size
  const regionIds = new Set(grid.flat());
  if (regionIds.size !== size) {
    throw new Error(
      `Invalid puzzle: found ${regionIds.size} regions, expected ${size}`,
    );
  }

  // Parse metadata
  const metadata: SBFMetadata = { version: FORMAT_VERSION };
  if (metaString) {
    const metaPattern = /([sdlcv])(\d+)/g;
    let match;
    while ((match = metaPattern.exec(metaString)) !== null) {
      const [, key, value] = match;
      const numValue = parseInt(value, 10);
      switch (key) {
        case "s":
          metadata.seed = numValue;
          break;
        case "d":
          metadata.difficulty = numValue;
          break;
        case "l":
          metadata.maxLevel = numValue;
          break;
        case "c":
          metadata.cycles = numValue;
          break;
        case "v":
          metadata.version = numValue;
          break;
      }
    }
  }

  return {
    board: { grid, stars },
    metadata,
  };
}

/**
 * Validate an SBF string without fully parsing.
 */
export function isValidSBF(sbf: string): boolean {
  try {
    decodeSBF(sbf);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract just the Board from an SBF string.
 */
export function boardFromSBF(sbf: string): Board {
  return decodeSBF(sbf).board;
}
