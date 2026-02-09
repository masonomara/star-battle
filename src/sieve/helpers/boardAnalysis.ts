import { Board, CellState, Coord, TilingResult } from "./types";
import { computeTiling } from "./tiling";
import {
  computeCountingFlow,
  CountingFlowResult,
  CountingFlowInput,
} from "./countingFlow";

type RegionStructure = {
  id: number;
  coords: Coord[];
  rows: Set<number>;
  cols: Set<number>;
};

export type BoardStructure = {
  size: number;
  stars: number;
  regions: Map<number, RegionStructure>;
};

export type RegionMeta = {
  id: number;
  unknownCoords: Coord[];
  starsPlaced: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
};

export type BoardAnalysis = {
  size: number;
  regions: Map<number, RegionMeta>;
  rowStars: number[];
  colStars: number[];
  rowToRegions: Map<number, Set<number>>;
  colToRegions: Map<number, Set<number>>;
  getTiling: (cells: Coord[]) => TilingResult;
  getCountingFlow: (axis: "row" | "col") => CountingFlowResult;
};

export function buildBoardStructure(board: Board): BoardStructure {
  const size = board.grid.length;
  const coordsByRegion = new Map<number, Coord[]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!coordsByRegion.has(id)) coordsByRegion.set(id, []);
      coordsByRegion.get(id)!.push([r, c]);
    }
  }

  const regions = new Map<number, RegionStructure>();
  for (const [id, coords] of coordsByRegion) {
    const rows = new Set<number>();
    const cols = new Set<number>();
    for (const [row, col] of coords) {
      rows.add(row);
      cols.add(col);
    }
    regions.set(id, { id, coords, rows, cols });
  }

  return { size, stars: board.stars, regions };
}

export function buildBoardAnalysis(
  structure: BoardStructure,
  cells: CellState[][],
  tilingCache: Map<string, TilingResult> = new Map(),
): BoardAnalysis {
  const { size, stars, regions: structRegions } = structure;

  const regions = new Map<number, RegionMeta>();
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);

  for (const [id, sr] of structRegions) {
    const unknownCoords: Coord[] = [];
    const unknownRows = new Set<number>();
    const unknownCols = new Set<number>();
    let starsPlaced = 0;

    for (const [row, col] of sr.coords) {
      const cell = cells[row][col];
      if (cell === "unknown") {
        unknownCoords.push([row, col]);
        unknownRows.add(row);
        unknownCols.add(col);
      } else if (cell === "star") {
        starsPlaced++;
        rowStars[row]++;
        colStars[col]++;
      }
    }

    regions.set(id, {
      id,
      unknownCoords,
      starsPlaced,
      starsNeeded: stars - starsPlaced,
      unknownRows,
      unknownCols,
    });
  }

  const rowToRegions = new Map<number, Set<number>>();
  const colToRegions = new Map<number, Set<number>>();

  for (let i = 0; i < size; i++) {
    rowToRegions.set(i, new Set());
  }
  for (let i = 0; i < size; i++) {
    colToRegions.set(i, new Set());
  }

  for (const [id, meta] of regions) {
    for (const row of meta.unknownRows) {
      rowToRegions.get(row)!.add(id);
    }
    for (const col of meta.unknownCols) {
      colToRegions.get(col)!.add(id);
    }
  }

  const getTiling = (coords: Coord[]): TilingResult => {
    if (coords.length === 0) {
      return { capacity: 0, tilings: [[]], forcedCells: [] };
    }

    const key = coords
      .map(([r, c]) => `${r},${c}`)
      .sort()
      .join("|");

    let result = tilingCache.get(key);
    if (!result) {
      result = computeTiling(coords, size);
      tilingCache.set(key, result);
    }
    return result;
  };

  const countingFlowCache = new Map<string, CountingFlowResult>();

  const getCountingFlow = (axis: "row" | "col"): CountingFlowResult => {
    let result = countingFlowCache.get(axis);
    if (result) return result;

    const axisStars = axis === "row" ? rowStars : colStars;
    const axisNeeded = new Array(size);
    for (let i = 0; i < size; i++) {
      axisNeeded[i] = stars - axisStars[i];
    }

    const regionInfos: CountingFlowInput["regionInfos"] = [];
    for (const region of regions.values()) {
      if (region.starsNeeded <= 0) continue;
      const unknownsByAxis = new Array(size).fill(0);
      for (const [r, c] of region.unknownCoords) {
        const idx = axis === "row" ? r : c;
        unknownsByAxis[idx]++;
      }
      regionInfos.push({
        starsNeeded: region.starsNeeded,
        unknownsByAxis,
        unknownCoords: region.unknownCoords as Coord[],
      });
    }

    result = computeCountingFlow({ size, axisNeeded, regionInfos });
    countingFlowCache.set(axis, result);
    return result;
  };

  return {
    size,
    regions,
    rowStars,
    colStars,
    rowToRegions,
    colToRegions,
    getTiling,
    getCountingFlow,
  };
}
