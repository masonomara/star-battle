import { Board, CellState, Coord } from "./types";
import buildRegions from "./regions";

/** Pre-computed region metadata for solver rules */
export type RegionMeta = {
  id: number;
  coords: Coord[];
  unknownCoords: Coord[];
  starsPlaced: number;
  starsNeeded: number;
  allRows: Set<number>;
  allCols: Set<number>;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
};

/** Pre-computed board analysis for counting-based rules */
export type BoardAnalysis = {
  size: number;

  // Core region data
  regions: Map<number, Coord[]>;
  regionMetas: Map<number, RegionMeta>;

  // Star counts
  regionStars: Map<number, number>;
  rowStars: number[];
  colStars: number[];

  // Active regions (starsPlaced < board.stars)
  activeRegionIds: Set<number>;
  activeRegions: RegionMeta[];

  // Active regions with unknowns (for finned counts)
  activeRegionsWithUnknowns: RegionMeta[];

  // Line-to-region mappings (active regions with unknowns in that line)
  rowToActiveRegions: Map<number, Set<number>>;
  colToActiveRegions: Map<number, Set<number>>;

  // Line-to-region mappings (active regions with ANY cell in that line)
  rowToActiveRegionsAll: Map<number, Set<number>>;
  colToActiveRegionsAll: Map<number, Set<number>>;

  // Region row/col spans (all cells)
  regionRows: Map<number, Set<number>>;
  regionCols: Map<number, Set<number>>;

  // Region unknown row/col spans
  regionUnknownRows: Map<number, Set<number>>;
  regionUnknownCols: Map<number, Set<number>>;
};

export function buildBoardAnalysis(
  board: Board,
  cells: CellState[][],
): BoardAnalysis {
  const size = board.grid.length;
  const numRows = board.grid.length;
  const numCols = board.grid[0]?.length ?? 0;
  const regions = buildRegions(board.grid);

  const regionMetas = new Map<number, RegionMeta>();
  const regionStars = new Map<number, number>();
  const rowStars = new Array(numRows).fill(0);
  const colStars = new Array(numCols).fill(0);
  const regionRows = new Map<number, Set<number>>();
  const regionCols = new Map<number, Set<number>>();
  const regionUnknownRows = new Map<number, Set<number>>();
  const regionUnknownCols = new Map<number, Set<number>>();
  const rowToActiveRegions = new Map<number, Set<number>>();
  const colToActiveRegions = new Map<number, Set<number>>();
  const rowToActiveRegionsAll = new Map<number, Set<number>>();
  const colToActiveRegionsAll = new Map<number, Set<number>>();

  for (let i = 0; i < numRows; i++) {
    rowToActiveRegions.set(i, new Set());
    rowToActiveRegionsAll.set(i, new Set());
  }
  for (let i = 0; i < numCols; i++) {
    colToActiveRegions.set(i, new Set());
    colToActiveRegionsAll.set(i, new Set());
  }

  // Single pass: build all region metadata
  for (const [id, coords] of regions) {
    const unknownCoords: Coord[] = [];
    const allRows = new Set<number>();
    const allCols = new Set<number>();
    const unknownRows = new Set<number>();
    const unknownCols = new Set<number>();
    let starsPlaced = 0;

    for (const [row, col] of coords) {
      allRows.add(row);
      allCols.add(col);

      if (cells[row][col] === "unknown") {
        unknownCoords.push([row, col]);
        unknownRows.add(row);
        unknownCols.add(col);
      } else if (cells[row][col] === "star") {
        starsPlaced++;
        rowStars[row]++;
        colStars[col]++;
      }
    }

    const starsNeeded = board.stars - starsPlaced;

    regionMetas.set(id, {
      id,
      coords,
      unknownCoords,
      starsPlaced,
      starsNeeded,
      allRows,
      allCols,
      unknownRows,
      unknownCols,
    });
    regionStars.set(id, starsPlaced);
    regionRows.set(id, allRows);
    regionCols.set(id, allCols);
    regionUnknownRows.set(id, unknownRows);
    regionUnknownCols.set(id, unknownCols);
  }

  // Build active region lists
  const activeRegionIds = new Set<number>();
  const activeRegions: RegionMeta[] = [];
  const activeRegionsWithUnknowns: RegionMeta[] = [];

  for (const [id, meta] of regionMetas) {
    if (meta.starsNeeded > 0) {
      activeRegionIds.add(id);
      activeRegions.push(meta);

      // Populate all-cells mappings for active regions
      for (const row of meta.allRows) {
        rowToActiveRegionsAll.get(row)!.add(id);
      }
      for (const col of meta.allCols) {
        colToActiveRegionsAll.get(col)!.add(id);
      }

      if (meta.unknownCoords.length > 0) {
        activeRegionsWithUnknowns.push(meta);

        for (const row of meta.unknownRows) {
          rowToActiveRegions.get(row)!.add(id);
        }
        for (const col of meta.unknownCols) {
          colToActiveRegions.get(col)!.add(id);
        }
      }
    }
  }

  return {
    size,
    regions,
    regionMetas,
    regionStars,
    rowStars,
    colStars,
    activeRegionIds,
    activeRegions,
    activeRegionsWithUnknowns,
    rowToActiveRegions,
    colToActiveRegions,
    rowToActiveRegionsAll,
    colToActiveRegionsAll,
    regionRows,
    regionCols,
    regionUnknownRows,
    regionUnknownCols,
  };
}
