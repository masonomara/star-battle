import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord, Tile } from "../../helpers/types";

/**
 * Tiling Overhang Marks
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
  const size = board.grid.length;
  let changed = false;

  for (const [, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const tiling = analysis.getTiling(meta.unknownCoords);
    if (tiling.capacity !== meta.starsNeeded) continue;

    const activeTilings = filterActiveTilings(tiling.tilings, cells, size);
    if (activeTilings.length === 0) continue;

    const forcedNonRegion = findForcedNonRegionCells(activeTilings, size);
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
 */
function filterActiveTilings(
  allTilings: Tile[][],
  cells: CellState[][],
  size: number,
): Tile[][] {
  return allTilings.filter((tiling) => {
    for (const tile of tiling) {
      const coveredKeys = new Set<number>();
      for (const [r, c] of tile.coveredCells) {
        coveredKeys.add(r * size + c);
      }
      for (const [r, c] of tile.cells) {
        if (!coveredKeys.has(r * size + c) && cells[r][c] === "unknown") {
          return true;
        }
      }
    }
    return false;
  });
}

/**
 * Find non-region cells that appear in ALL minimal tilings.
 */
function findForcedNonRegionCells(allMinimalTilings: Tile[][], size: number): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  const nonRegionSets: Set<number>[] = allMinimalTilings.map((tiling) => {
    const nonRegion = new Set<number>();
    for (const tile of tiling) {
      const coveredKeys = new Set<number>();
      for (const [r, c] of tile.coveredCells) {
        coveredKeys.add(r * size + c);
      }
      for (const [r, c] of tile.cells) {
        const key = r * size + c;
        if (!coveredKeys.has(key)) {
          nonRegion.add(key);
        }
      }
    }
    return nonRegion;
  });

  const result: Coord[] = [];
  for (const key of nonRegionSets[0]) {
    if (nonRegionSets.every((set) => set.has(key))) {
      const r = Math.floor(key / size);
      const c = key % size;
      result.push([r, c]);
    }
  }

  return result;
}
