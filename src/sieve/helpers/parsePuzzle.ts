import { Board } from "./types";

export function parsePuzzle(input: string, stars: number = 1): Board {
  const lines = input
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Empty puzzle input");
  }

  const rows: string[][] = lines.map((line) => {
    if (line.includes(" ")) {
      return line.split(/\s+/).filter((t) => t.length > 0);
    }
    return line.split("");
  });

  const size = rows.length;

  for (let i = 0; i < size; i++) {
    if (rows[i].length !== size) {
      throw new Error(
        `Row ${i} has ${rows[i].length} cells, expected ${size}`,
      );
    }
  }

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

  if (symbolToId.size !== size) {
    throw new Error(
      `Found ${symbolToId.size} regions, expected ${size} for a ${size}x${size} puzzle`,
    );
  }

  return { grid, stars };
}
