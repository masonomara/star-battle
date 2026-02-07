import { Board } from "./types";

const REGION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_REGIONS = 26;
const FORMAT_VERSION = 1;

type PuzzleStringMetadata = {
  seed?: number;
  difficulty?: number;
  maxLevel?: number;
  cycles?: number;
  version?: number;
};

export function decodePuzzleString(str: string): { board: Board; metadata: PuzzleStringMetadata } {
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
