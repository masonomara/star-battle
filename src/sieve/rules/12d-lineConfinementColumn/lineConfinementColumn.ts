/**
 * Rule 12d: Line Confinement (Column)
 *
 * Marks cells where placing a hypothetical star would cause columns
 * to need more stars than the regions they're confined to can provide.
 *
 * "These columns can only get stars from these regions. Can the regions supply them?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, capacity } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/cellKey";

type AdjustedRegion = {
  id: number;
  starsNeeded: number;
  unknownCols: Set<number>;
  unknownCoords: Coord[];
};

type PrecomputedData = {
  baseAdjustedById: Map<number, AdjustedRegion>;
};

function checkViolation(
  board: Board,
  analysis: BoardAnalysis,
  starRow: number,
  starCol: number,
  cells: CellState[][],
  precomputed: PrecomputedData,
): boolean {
  const { size, regions, rowStars, colStars } = analysis;
  const { baseAdjustedById } = precomputed;
  const starRegion = board.grid[starRow][starCol];

  // Build set of cells that would be marked (star + 8 neighbors)
  const marked = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = starRow + dr;
      const nc = starCol + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        marked.add(cellKey(nr, nc));
      }
    }
  }

  // Adjusted star counts (base + 1 for the hypothetical star)
  const adjRowStars = [...rowStars];
  const adjColStars = [...colStars];
  adjRowStars[starRow]++;
  adjColStars[starCol]++;

  // Build adjusted region data
  const adjusted: AdjustedRegion[] = [];
  const adjustedById = new Map<number, AdjustedRegion>();
  const adjRegionStars = new Map<number, number>();

  // Track which regions are affected by the marked cells
  const affectedRegions = new Set<number>();
  affectedRegions.add(starRegion);
  for (const key of marked) {
    const [rStr, cStr] = key.split(",");
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    affectedRegions.add(board.grid[r][c]);
  }

  for (const [id, meta] of regions) {
    const starsPlaced = meta.starsPlaced + (id === starRegion ? 1 : 0);
    adjRegionStars.set(id, starsPlaced);
    const starsNeeded = board.stars - starsPlaced;

    if (starsNeeded <= 0) continue;

    const baseRegion = baseAdjustedById.get(id);

    if (baseRegion && !affectedRegions.has(id)) {
      if (id === starRegion) {
        const adjRegion: AdjustedRegion = {
          id,
          starsNeeded,
          unknownCols: baseRegion.unknownCols,
          unknownCoords: baseRegion.unknownCoords,
        };
        adjusted.push(adjRegion);
        adjustedById.set(id, adjRegion);
      } else {
        adjusted.push(baseRegion);
        adjustedById.set(id, baseRegion);
      }
    } else {
      const remainingUnknowns = meta.unknownCoords.filter(
        ([r, c]) => !marked.has(cellKey(r, c)),
      );

      if (remainingUnknowns.length === 0) {
        return true;
      }

      const adjRegion: AdjustedRegion = {
        id,
        starsNeeded,
        unknownCols: new Set(remainingUnknowns.map(([, c]) => c)),
        unknownCoords: remainingUnknowns,
      };
      adjusted.push(adjRegion);
      adjustedById.set(id, adjRegion);
    }
  }

  // Build col -> regions mapping
  const colToRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    colToRegions.set(i, new Set());
  }

  for (const region of adjusted) {
    for (const col of region.unknownCols) {
      colToRegions.get(col)!.add(region.id);
    }
  }

  // Active columns that still need stars
  const activeCols = [...colToRegions.keys()].filter(
    (col) => adjColStars[col] < board.stars && colToRegions.get(col)!.size > 0,
  );

  // Line confinement: columns confined to regions
  for (const startCol of activeCols) {
    const colSet = new Set<number>();
    const regSet = new Set<number>();

    for (const col of activeCols) {
      if (col < startCol) continue;

      colSet.add(col);
      for (const id of colToRegions.get(col)!) {
        regSet.add(id);
      }

      // Check if all unknowns in these columns are in these regions
      let fullyContained = true;
      for (const c of colSet) {
        for (let row = 0; row < size && fullyContained; row++) {
          if (cells[row][c] === "unknown" && !marked.has(cellKey(row, c))) {
            if (!regSet.has(board.grid[row][c])) {
              fullyContained = false;
            }
          }
        }
      }

      if (fullyContained) {
        let starsNeeded = 0;
        for (const col of colSet) {
          starsNeeded += board.stars - adjColStars[col];
        }

        let starsAvailable = 0;
        for (const rid of regSet) {
          const region = adjustedById.get(rid);
          if (!region) {
            starsAvailable += board.stars - adjRegionStars.get(rid)!;
            continue;
          }

          const cellsInRange: Coord[] = region.unknownCoords.filter(
            ([r, c]) => colSet.has(c) && adjRowStars[r] < board.stars,
          );

          const maxContribution = Math.min(
            region.starsNeeded,
            capacity(cellsInRange, analysis),
          );
          starsAvailable += maxContribution;
        }

        if (starsNeeded > starsAvailable) {
          return true;
        }
      }
    }
  }

  return false;
}

export default function lineConfinementColumn(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions } = analysis;
  if (size === 0) return false;

  // Build base adjusted regions (without any hypothetical star)
  const baseAdjustedById = new Map<number, AdjustedRegion>();

  for (const [id, meta] of regions) {
    const starsNeeded = board.stars - meta.starsPlaced;
    if (starsNeeded <= 0) continue;

    baseAdjustedById.set(id, {
      id,
      starsNeeded,
      unknownCols: new Set(meta.unknownCoords.map(([, c]) => c)),
      unknownCoords: meta.unknownCoords,
    });
  }

  const precomputed: PrecomputedData = { baseAdjustedById };

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      if (checkViolation(board, analysis, row, col, cells, precomputed)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
