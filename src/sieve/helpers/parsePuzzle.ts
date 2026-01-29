import { Board } from "./types";

/**
 * Parse a puzzle string into a Board.
 *
 * Format: Each row on its own line, cells separated by spaces or nothing.
 * Regions can be letters (A-Z) or numbers (0-9).
 *
 * Examples:
 *
 * Letters (recommended for readability):
 *   `A A B B C
 *    A A B C C
 *    D D B C C
 *    D D E E E
 *    D D E E E`
 *
 * Numbers:
 *   `0 0 1 1 2
 *    0 0 1 2 2
 *    3 3 1 2 2
 *    3 3 4 4 4
 *    3 3 4 4 4`
 *
 * Compact (no spaces):
 *   `AABBC
 *    AABCC
 *    DDBCC
 *    DDEEE
 *    DDEEE`
 */
export function parsePuzzle(input: string, stars: number = 1): Board {
  const lines = input
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Empty puzzle input");
  }

  // Parse each line into characters/tokens
  const rows: string[][] = lines.map((line) => {
    // If line contains spaces, split by whitespace
    if (line.includes(" ")) {
      return line.split(/\s+/).filter((t) => t.length > 0);
    }
    // Otherwise, each character is a cell
    return line.split("");
  });

  const size = rows.length;

  // Validate all rows have same length
  for (let i = 0; i < size; i++) {
    if (rows[i].length !== size) {
      throw new Error(
        `Row ${i} has ${rows[i].length} cells, expected ${size}`,
      );
    }
  }

  // Map region symbols to numeric IDs
  const symbolToId = new Map<string, number>();
  let nextId = 0;

  const grid: number[][] = rows.map((row) =>
    row.map((symbol) => {
      if (!symbolToId.has(symbol)) {
        symbolToId.set(symbol, nextId++);
      }
      return symbolToId.get(symbol)!;
    }),
  );

  // Validate region count
  if (symbolToId.size !== size) {
    throw new Error(
      `Found ${symbolToId.size} regions, expected ${size} for a ${size}x${size} puzzle`,
    );
  }

  return { grid, stars };
}

/**
 * Convert a Board back to a string representation using letters.
 */
export function boardToString(board: Board): string {
  const idToLetter = (id: number) => String.fromCharCode(65 + id); // A, B, C...
  return board.grid.map((row) => row.map(idToLetter).join(" ")).join("\n");
}
