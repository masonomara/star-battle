import { Board, CellState } from "./types";

export type BoardStatus = "solved" | "valid" | "invalid";

/**
 * Check board state in a single pass. Returns:
 * - "invalid": constraints violated (not enough capacity or adjacent stars)
 * - "solved": all star counts match target
 * - "valid": solvable but not yet complete
 */
export function checkBoardState(
  board: Board,
  cells: CellState[][],
): BoardStatus {
  const size = board.grid.length;

  const starsByRow = new Array(size).fill(0);
  const starsByCol = new Array(size).fill(0);
  const availableByRow = new Array(size).fill(0);
  const availableByCol = new Array(size).fill(0);
  const starsByRegion = new Map<number, number>();
  const availableByRegion = new Map<number, number>();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = cells[row][col];
      const regionId = board.grid[row][col];

      if (cell === "star") {
        starsByRow[row]++;
        starsByCol[col]++;
        starsByRegion.set(regionId, (starsByRegion.get(regionId) ?? 0) + 1);

        // Check adjacency (only right and down to avoid double-checking)
        if (col + 1 < size && cells[row][col + 1] === "star") return "invalid";
        if (row + 1 < size) {
          if (cells[row + 1][col] === "star") return "invalid";
          if (col > 0 && cells[row + 1][col - 1] === "star") return "invalid";
          if (col + 1 < size && cells[row + 1][col + 1] === "star")
            return "invalid";
        }
      }

      if (cell !== "marked") {
        availableByRow[row]++;
        availableByCol[col]++;
        availableByRegion.set(
          regionId,
          (availableByRegion.get(regionId) ?? 0) + 1,
        );
      }
    }
  }

  // Check capacity constraints
  for (let i = 0; i < size; i++) {
    if (availableByRow[i] < board.stars) return "invalid";
    if (availableByCol[i] < board.stars) return "invalid";
  }
  for (const available of availableByRegion.values()) {
    if (available < board.stars) return "invalid";
  }

  // Check if solved
  for (let i = 0; i < size; i++) {
    if (starsByRow[i] !== board.stars) return "valid";
    if (starsByCol[i] !== board.stars) return "valid";
  }
  for (const count of starsByRegion.values()) {
    if (count !== board.stars) return "valid";
  }

  return "solved";
}
