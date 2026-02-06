/**
 * Rule: Reserved Area Column (Level 6 — Confinement + Enumeration)
 *
 * Generalizes undercounting: for a set of columns, find all cages overlapping
 * those columns. Try excluding each cage — if the remaining cages' demand minus
 * outside capacity >= column supply, the excluded cage's cells in those columns
 * get 0 stars and can be marked.
 */

import { Board, CellState, Coord } from "../../../helpers/types";
import { BoardAnalysis } from "../../../helpers/boardAnalysis";

function* combinations(n: number, k: number): Generator<number[]> {
  const indices = Array.from({ length: k }, (_, i) => i);

  while (true) {
    yield indices.slice();

    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) i--;
    if (i < 0) return;

    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }
}

export default function reservedAreaColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, colStars, colToRegions } = analysis;
  if (size === 0) return false;

  for (let k = 1; k <= 3 && k <= size; k++) {
    for (const colIndices of combinations(size, k)) {
      const colSet = new Set(colIndices);

      // Line supply: total stars these columns can still accept
      let lineSupply = 0;
      for (const col of colIndices) {
        lineSupply += board.stars - colStars[col];
      }
      if (lineSupply <= 0) continue;

      // Overlapping cages: all regions with unknown cells in selected columns
      const overlapping = new Set<number>();
      for (const col of colIndices) {
        const regionIds = colToRegions.get(col);
        if (regionIds) {
          for (const id of regionIds) overlapping.add(id);
        }
      }
      if (overlapping.size < 2) continue;

      // Try excluding each overlapping cage
      for (const excludedId of overlapping) {
        const excludedRegion = regions.get(excludedId)!;
        if (excludedRegion.starsNeeded <= 0) continue;

        // Check excluded cage has unknown cells in selected columns
        const excludedCellsInCols: Coord[] = [];
        for (const [r, c] of excludedRegion.unknownCoords) {
          if (cells[r][c] === "unknown" && colSet.has(c)) {
            excludedCellsInCols.push([r, c]);
          }
        }
        if (excludedCellsInCols.length === 0) continue;

        // Remaining cages demand and outside cells
        let cageDemand = 0;
        const outsideCells = new Set<string>();

        for (const regionId of overlapping) {
          if (regionId === excludedId) continue;
          const region = regions.get(regionId)!;
          if (region.starsNeeded <= 0) continue;

          cageDemand += region.starsNeeded;

          for (const [r, c] of region.unknownCoords) {
            if (cells[r][c] === "unknown" && !colSet.has(c)) {
              outsideCells.add(`${r},${c}`);
            }
          }
        }

        if (cageDemand === 0) continue;

        // Outside capacity via tiling
        const outsideCoords: Coord[] = [...outsideCells].map((key) => {
          const [r, c] = key.split(",").map(Number);
          return [r, c] as Coord;
        });

        const outsideCapacity =
          outsideCoords.length === 0
            ? 0
            : analysis.getTiling(outsideCoords).capacity;

        const minFromInside = cageDemand - outsideCapacity;

        if (minFromInside >= lineSupply) {
          // Excluded cage gets 0 stars in these columns — mark them
          let changed = false;
          for (const [r, c] of excludedCellsInCols) {
            if (cells[r][c] === "unknown") {
              cells[r][c] = "marked";
              changed = true;
            }
          }
          if (changed) return true;
        }
      }
    }
  }

  return false;
}
