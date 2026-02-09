import { Board, CellState, Coord, TilingResult } from "./types";
import { computeTiling } from "./tiling";
import { computeCountingFlow, CountingFlowInput, CountingFlowResult } from "./countingFlow";

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

type BoardState = {
  size: number;
  regions: Map<number, RegionMeta>;
  rowStars: number[];
  colStars: number[];
  rowUnknowns: Coord[][];
  colUnknowns: Coord[][];
  rowToRegions: Map<number, Set<number>>;
  colToRegions: Map<number, Set<number>>;
};

export type BoardAnalysis = BoardState & {
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

function buildBoardState(
  structure: BoardStructure,
  cells: CellState[][],
): BoardState {
  const { size, stars, regions: structRegions } = structure;

  const regions = new Map<number, RegionMeta>();
  const rowStars = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);
  const rowUnknowns: Coord[][] = Array.from({ length: size }, () => []);
  const colUnknowns: Coord[][] = Array.from({ length: size }, () => []);

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
        rowUnknowns[row].push([row, col]);
        colUnknowns[col].push([row, col]);
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

  return {
    size,
    regions,
    rowStars,
    colStars,
    rowUnknowns,
    colUnknowns,
    rowToRegions,
    colToRegions,
  };
}

export function buildBoardAnalysis(
  structure: BoardStructure,
  cells: CellState[][],
  tilingCache?: Map<string, TilingResult>,
): BoardAnalysis {
  const state = buildBoardState(structure, cells);
  const cache = tilingCache ?? new Map<string, TilingResult>();
  const { size, stars } = structure;

  const getTiling = (coords: Coord[]): TilingResult => {
    if (coords.length === 0) return { capacity: 0, tilings: [[]], forcedCells: [] };
    const key = coords.map(([r, c]) => r * size + c).sort((a, b) => a - b).join("|");
    let result = cache.get(key);
    if (!result) { result = computeTiling(coords, size); cache.set(key, result); }
    return result;
  };

  const flowCache = new Map<string, CountingFlowResult>();
  const getCountingFlow = (axis: "row" | "col"): CountingFlowResult => {
    let result = flowCache.get(axis);
    if (result) return result;
    const axisStars = axis === "row" ? state.rowStars : state.colStars;
    const axisNeeded = new Array(size);
    for (let i = 0; i < size; i++) axisNeeded[i] = stars - axisStars[i];
    const regionInfos: CountingFlowInput["regionInfos"] = [];
    for (const region of state.regions.values()) {
      if (region.starsNeeded <= 0) continue;
      const unknownsByAxis = new Array(size).fill(0);
      for (const [r, c] of region.unknownCoords) { unknownsByAxis[axis === "row" ? r : c]++; }
      regionInfos.push({ starsNeeded: region.starsNeeded, unknownsByAxis, unknownCoords: region.unknownCoords });
    }
    result = computeCountingFlow({ size, axisNeeded, regionInfos });
    flowCache.set(axis, result);
    return result;
  };

  return { ...state, getTiling, getCountingFlow };
}
