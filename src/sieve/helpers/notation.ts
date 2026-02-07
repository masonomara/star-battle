/**
 * Puzzle String Format
 *
 * A compact format for sharing Star Battle puzzles with metadata.
 * Region encoding uses uppercase letters (A-Z) matching krazydad notation.
 *
 * Format: <header>.<layout>[.<metadata>]
 *
 * Header:   {size}x{stars}        e.g., "10x2"
 * Layout:   Uppercase letters     e.g., "AAAABBBBBCAAD..." (size² characters)
 * Metadata: Key-value tokens      e.g., "s42d7l4c12"
 *
 * Metadata keys:
 *   s{int} - seed
 *   d{int} - difficulty (1-10)
 *   l{int} - maxLevel (highest rule level used)
 *   c{int} - cycles (solver iterations)
 *   v{int} - format version (default 1)
 *
 * Example: "10x2.AAAABBBBBCAADABBBBBCADDAEEEECCADD...s42d7l4c12"
 */

import { Board, Coord, Puzzle, Solution } from "./types";

const REGION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_REGIONS = 26;
const FORMAT_VERSION = 1;

export type PuzzleStringMetadata = {
  seed?: number;
  difficulty?: number;
  maxLevel?: number;
  cycles?: number;
  version?: number;
};

export type PuzzleStringData = {
  board: Board;
  metadata: PuzzleStringMetadata;
};

/**
 * Encode a Board to puzzle string format.
 */
export function encodePuzzleString(
  board: Board,
  metadata?: PuzzleStringMetadata,
): string {
  const size = board.grid.length;

  for (const row of board.grid) {
    if (row.length !== size) {
      throw new Error(
        `Grid is not square: row has ${row.length} cells, expected ${size}`,
      );
    }
  }

  const regionIds = new Set<number>();
  for (const row of board.grid) {
    for (const id of row) {
      if (id < 0 || id >= MAX_REGIONS) {
        throw new Error(`Region ID ${id} out of range (0-${MAX_REGIONS - 1})`);
      }
      regionIds.add(id);
    }
  }

  const header = `${size}x${board.stars}`;

  const layout = board.grid
    .flatMap((row) => row.map((id) => REGION_LETTERS[id]))
    .join("");

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
    return `${header}.${layout}.${metaString}`;
  }
  return `${header}.${layout}`;
}

/**
 * Encode a Solution (Board + seed + solver stats).
 */
export function encodeSolution(solution: Solution): string {
  return encodePuzzleString(solution.board, {
    seed: solution.seed,
    maxLevel: solution.maxLevel,
    cycles: solution.cycles,
  });
}

/**
 * Encode a Puzzle (Solution + difficulty).
 */
export function encodePuzzle(puzzle: Puzzle): string {
  return encodePuzzleString(puzzle.board, {
    seed: puzzle.seed,
    difficulty: puzzle.difficulty,
    maxLevel: puzzle.maxLevel,
    cycles: puzzle.cycles,
  });
}

/**
 * Decode a puzzle string to a Board and metadata.
 */
export function decodePuzzleString(str: string): PuzzleStringData {
  const parts = str.split(".");

  if (parts.length < 2 || parts.length > 3) {
    throw new Error(
      `Invalid puzzle string: expected 2-3 dot-separated parts, got ${parts.length}`,
    );
  }

  const [header, layout, metaString] = parts;

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

  const expectedLength = size * size;
  if (layout.length !== expectedLength) {
    throw new Error(
      `Invalid layout length: ${layout.length} (expected ${expectedLength} for ${size}x${size} grid)`,
    );
  }

  const grid: number[][] = [];
  for (let row = 0; row < size; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < size; col++) {
      const char = layout[row * size + col];
      const regionId = REGION_LETTERS.indexOf(char.toUpperCase());
      if (regionId === -1) {
        throw new Error(
          `Invalid region character: "${char}" at position ${row * size + col}`,
        );
      }
      rowData.push(regionId);
    }
    grid.push(rowData);
  }

  const regionIds = new Set(grid.flat());
  if (regionIds.size !== size) {
    throw new Error(
      `Invalid puzzle: found ${regionIds.size} regions, expected ${size}`,
    );
  }

  const metadata: PuzzleStringMetadata = { version: FORMAT_VERSION };
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
 * Validate a puzzle string without fully parsing.
 */
export function isValidPuzzleString(str: string): boolean {
  try {
    decodePuzzleString(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract just the Board from a puzzle string.
 */
export function boardFromPuzzleString(str: string): Board {
  return decodePuzzleString(str).board;
}

// ---------------------------------------------------------------------------
// Display notation helpers (see NOTATION.md)
// ---------------------------------------------------------------------------

/**
 * Convert a solver coordinate to cell notation.
 * (0, 0) → "A1", (9, 9) → "J10"
 */
export function coordToCell(coord: Coord): string {
  const [row, col] = coord;
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

/**
 * Parse cell notation to a solver coordinate.
 * "A1" → [0, 0], "J10" → [9, 9]
 */
export function cellToCoord(cell: string): Coord {
  const col = cell.charCodeAt(0) - 65;
  const row = parseInt(cell.slice(1), 10) - 1;
  return [row, col];
}

/**
 * Row display name: 0 → "Row-1", 9 → "Row-10"
 */
export function rowName(index: number): string {
  return `Row-${index + 1}`;
}

/**
 * Column display name: 0 → "Col-a", 9 → "Col-j"
 */
export function colName(index: number): string {
  return `Col-${String.fromCharCode(97 + index)}`;
}

/**
 * Region display name: 0 → "Cage-1", 9 → "Cage-10"
 */
export function regionName(id: number): string {
  return `Cage-${id + 1}`;
}
