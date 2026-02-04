import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord, Tile } from "../../helpers/types";
import { coordKey } from "../../helpers/cellKey";

/**
 * Rule 8d: Tiling Overhang Marks
 *
 * When capacity === starsNeeded, each tile contains exactly one star.
 * Non-region cells covered by tiles in ALL minimal tilings cannot have stars
 * (the tile's star must be in the region portion).
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

    const forcedNonRegion = findForcedNonRegionCells(tiling.tilings);
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
 * Find non-region cells that appear in ALL minimal tilings.
 */
function findForcedNonRegionCells(allMinimalTilings: Tile[][]): Coord[] {
  if (allMinimalTilings.length === 0) return [];

  const nonRegionSets: Set<string>[] = allMinimalTilings.map((tiling) => {
    const nonRegion = new Set<string>();
    for (const tile of tiling) {
      const coveredKeys = new Set(tile.coveredCells.map(coordKey));
      for (const cell of tile.cells) {
        const key = coordKey(cell);
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
