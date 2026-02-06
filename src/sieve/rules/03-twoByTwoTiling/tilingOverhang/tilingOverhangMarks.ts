import { BoardAnalysis } from "../../../helpers/boardAnalysis";
import { Board, CellState, Coord, Tile } from "../../../helpers/types";

/**
 * Rule 8d: Tiling Overhang Marks
 *
 * When capacity === starsNeeded, each tile contains exactly one star.
 * Non-region cells covered by tiles in ALL minimal tilings cannot have stars
 * (the tile's star must be in the region portion).
 *
 * Tilings whose overhang is already fully marked are filtered out -
 * they impose no new constraint.
 */
export default function tilingOverhangMarks(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  let changed = false;

  for (const [, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const tiling = analysis.getTiling(meta.unknownCoords);
    if (tiling.capacity !== meta.starsNeeded) continue;

    // Filter out tilings whose overhang is already fully marked
    const activeTilings = filterActiveTilings(tiling.tilings, cells);
    if (activeTilings.length === 0) continue;

    const forcedNonRegion = findForcedNonRegionCells(activeTilings);
    for (const [row, col] of forcedNonRegion) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Filter out tilings whose overhang cells are all already marked.
 * These tilings are "free" - they impose no new constraint.
 */
function filterActiveTilings(
  allTilings: Tile[][],
  cells: CellState[][],
): Tile[][] {
  return allTilings.filter((tiling) => {
    // Get all overhang cells for this tiling
    for (const tile of tiling) {
      const coveredKeys = new Set(
        tile.coveredCells.map((c) => `${c[0]},${c[1]}`),
      );
      for (const cell of tile.cells) {
        if (!coveredKeys.has(`${cell[0]},${cell[1]}`)) {
          const [row, col] = cell;
          // If any overhang cell is unknown, this tiling is active
          if (cells[row][col] === "unknown") {
            return true;
          }
        }
      }
    }
    // All overhang cells are marked - this tiling is free
    return false;
  });
}

/**
 * Find non-region cells that appear in ALL minimal tilings.
 */
function findForcedNonRegionCells(allMinimalTilings: Tile[][]): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  const nonRegionSets: Set<string>[] = allMinimalTilings.map((tiling) => {
    const nonRegion = new Set<string>();
    for (const tile of tiling) {
      const coveredKeys = new Set(
        tile.coveredCells.map((c) => `${c[0]},${c[1]}`),
      );
      for (const cell of tile.cells) {
        const key = `${cell[0]},${cell[1]}`;
        if (!coveredKeys.has(key)) {
          nonRegion.add(key);
        }
      }
    }
    return nonRegion;
  });

  const intersection = [...nonRegionSets[0]].filter((key) =>
    nonRegionSets.every((set) => set.has(key)),
  );

  return intersection.map((key) => {
    const [row, col] = key.split(",").map(Number);
    return [row, col] as Coord;
  });
}
