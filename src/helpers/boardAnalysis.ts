import { Board, CellState, Coord, TilingResult } from "./types";
import { computeTiling } from "./tiling";
import { computeCountingFlow, CountingFlowInput, CountingFlowResult } from "./counting";

type RegionStructure = {
  coords: Coord[];
};

export type BoardStructure = {
  size: number;
  stars: number;
  regions: Map<number, RegionStructure>;
  cellRegionIndex: Int32Array;
};

export type RegionMeta = {
  unknownCoords: Coord[];
  starsPlaced: number;
  starsNeeded: number;
  unknownRows: Set<number>;
  unknownCols: Set<number>;
};

type BoardState = {
  size: number;
  stars: number;
  regions: Map<number, RegionMeta>;
  rowStars: number[];
  colStars: number[];
  rowUnknowns: Coord[][];
  colUnknowns: Coord[][];
};

export type BoardAnalysis = BoardState & {
  getTiling: (cells: Coord[]) => TilingResult;
  getCountingFlow: (axis: "row" | "col") => CountingFlowResult;
  applyDelta: (cells: CellState[][], changed: Coord[]) => void;
};

export function buildBoardStructure(board: Board): BoardStructure {
  const size = board.grid.length;
  const cellRegionIndex = new Int32Array(size * size);
  const coordsByRegion = new Map<number, Coord[]>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      cellRegionIndex[r * size + c] = id;
      if (!coordsByRegion.has(id)) coordsByRegion.set(id, []);
      coordsByRegion.get(id)!.push([r, c]);
    }
  }

  const regions = new Map<number, RegionStructure>();
  for (const [id, coords] of coordsByRegion) {
    regions.set(id, { coords });
  }

  return { size, stars: board.stars, regions, cellRegionIndex };
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
      unknownCoords,
      starsPlaced,
      starsNeeded: stars - starsPlaced,
      unknownRows,
      unknownCols,
    });
  }

  return { size, stars, regions, rowStars, colStars, rowUnknowns, colUnknowns };
}

function removeFromArr(arr: Coord[], r: number, c: number): void {
  const i = arr.findIndex(([rr, cc]) => rr === r && cc === c);
  if (i !== -1) arr.splice(i, 1);
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
    const keys = new Int32Array(coords.length);
    for (let i = 0; i < coords.length; i++) keys[i] = coords[i][0] * size + coords[i][1];
    keys.sort();
    const key = keys.join(",");
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

  function applyDelta(cells: CellState[][], changed: Coord[]): void {
    if (changed.length === 0) return;
    flowCache.clear();
    for (const [r, c] of changed) {
      const isStar = cells[r][c] === "star";
      if (isStar) {
        state.rowStars[r]++;
        state.colStars[c]++;
      }
      removeFromArr(state.rowUnknowns[r], r, c);
      removeFromArr(state.colUnknowns[c], r, c);
      const regionId = structure.cellRegionIndex[r * size + c];
      const region = state.regions.get(regionId)!;
      if (isStar) {
        region.starsPlaced++;
        region.starsNeeded--;
      }
      removeFromArr(region.unknownCoords, r, c);
      if (!region.unknownCoords.some(([rr]) => rr === r)) region.unknownRows.delete(r);
      if (!region.unknownCoords.some(([, cc]) => cc === c)) region.unknownCols.delete(c);
    }
  }

  return { ...state, getTiling, getCountingFlow, applyDelta };
}
