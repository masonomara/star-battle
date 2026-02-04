/**
 * Rule 12a: Region Confinement
 *
 * Marks cells where placing a hypothetical star would cause regions
 * to need more stars than the rows/columns they're confined to can provide.
 *
 * "These regions can only reach these rows. Can the rows hold them?"
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { cellKey } from "../../helpers/cellKey";

type AdjustedRegion = {
  id: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
  unknownCoords: Coord[];
};

type PrecomputedData = {
  baseAdjusted: AdjustedRegion[];
  baseAdjustedById: Map<number, AdjustedRegion>;
};

function checkViolation(
  board: Board,
  analysis: BoardAnalysis,
  starRow: number,
  starCol: number,
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
    const starsNeeded = board.stars - starsPlaced;

    if (starsNeeded <= 0) continue;

    const baseRegion = baseAdjustedById.get(id);

    if (baseRegion && !affectedRegions.has(id)) {
      if (id === starRegion) {
        const adjRegion: AdjustedRegion = {
          id,
          starsNeeded,
          unknownRows: baseRegion.unknownRows,
          unknownCols: baseRegion.unknownCols,
          unknownCoords: baseRegion.unknownCoords,
        };
        adjusted.push(adjRegion);
      } else {
        adjusted.push(baseRegion);
      }
    } else {
      const remainingUnknowns = meta.unknownCoords.filter(
        ([r, c]) => !marked.has(cellKey(r, c)),
      );

      if (remainingUnknowns.length === 0) {
        return true;
      }

      const unknownRows = new Set(remainingUnknowns.map(([r]) => r));
      const unknownCols = new Set(remainingUnknowns.map(([, c]) => c));

      const adjRegion: AdjustedRegion = {
        id,
        starsNeeded,
        unknownRows,
        unknownCols,
        unknownCoords: remainingUnknowns,
      };
      adjusted.push(adjRegion);
    }
  }

  // Region confinement: regions confined to rows
  for (const region of adjusted) {
    const rows = region.unknownRows;

    const contained = adjusted.filter((r) =>
      [...r.unknownRows].every((row) => rows.has(row)),
    );

    let starsNeeded = 0;
    for (const r of contained) {
      starsNeeded += r.starsNeeded;
    }

    let starsAvailable = 0;
    for (const row of rows) {
      starsAvailable += board.stars - adjRowStars[row];
    }

    if (starsNeeded > starsAvailable) {
      return true;
    }
  }

  // Region confinement: regions confined to columns
  for (const region of adjusted) {
    const cols = region.unknownCols;

    const contained = adjusted.filter((r) =>
      [...r.unknownCols].every((col) => cols.has(col)),
    );

    let starsNeeded = 0;
    for (const r of contained) {
      starsNeeded += r.starsNeeded;
    }

    let starsAvailable = 0;
    for (const col of cols) {
      starsAvailable += board.stars - adjColStars[col];
    }

    if (starsNeeded > starsAvailable) {
      return true;
    }
  }

  return false;
}

export default function regionConfinement(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { size, regions } = analysis;
  if (size === 0) return false;

  // Build base adjusted regions (without any hypothetical star)
  const baseAdjusted: AdjustedRegion[] = [];
  const baseAdjustedById = new Map<number, AdjustedRegion>();

  for (const [id, meta] of regions) {
    const starsNeeded = board.stars - meta.starsPlaced;
    if (starsNeeded <= 0) continue;

    const unknownRows = new Set(meta.unknownCoords.map(([r]) => r));
    const unknownCols = new Set(meta.unknownCoords.map(([, c]) => c));

    const region: AdjustedRegion = {
      id,
      starsNeeded,
      unknownRows,
      unknownCols,
      unknownCoords: meta.unknownCoords,
    };
    baseAdjusted.push(region);
    baseAdjustedById.set(id, region);
  }

  const precomputed: PrecomputedData = {
    baseAdjusted,
    baseAdjustedById,
  };

  let changed = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[row][col] !== "unknown") continue;

      if (checkViolation(board, analysis, row, col, precomputed)) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
