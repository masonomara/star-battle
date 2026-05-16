import { createRequire } from 'node:module';
import { Coord, Tile, TilingResult } from './types';

const _req = createRequire(import.meta.url);
const wasmTiling = _req('../../pkg/dlx.js') as {
  compute_tiling(coordsFlat: Int32Array, gridSize: number): Int32Array;
};

export function computeTiling(cells: Coord[], gridSize: number): TilingResult {
  if (cells.length === 0) return { capacity: 0, tilings: [[]], forcedCells: [] };
  if (cells.length === 1) return { capacity: 1, tilings: [], forcedCells: [cells[0]] };

  const coordsFlat = new Int32Array(cells.length * 2);
  for (let i = 0; i < cells.length; i++) {
    coordsFlat[i * 2]     = cells[i][0];
    coordsFlat[i * 2 + 1] = cells[i][1];
  }

  const flat = wasmTiling.compute_tiling(coordsFlat, gridSize);
  return parseFlat(flat);
}

function parseFlat(flat: Int32Array): TilingResult {
  let i = 0;
  const capacity   = flat[i++];
  const numTimings = flat[i++];

  const tilings: Tile[][] = [];
  for (let t = 0; t < numTimings; t++) {
    const numTiles = flat[i++];
    const tiling: Tile[] = [];
    for (let ti = 0; ti < numTiles; ti++) {
      const ar         = flat[i++];
      const ac         = flat[i++];
      const numCovered = flat[i++];
      const coveredCells: Coord[] = [];
      for (let k = 0; k < numCovered; k++) coveredCells.push([flat[i++], flat[i++]]);
      const cells: Coord[] = [[ar, ac], [ar, ac + 1], [ar + 1, ac], [ar + 1, ac + 1]];
      tiling.push({ cells, coveredCells });
    }
    tilings.push(tiling);
  }

  const numForced = flat[i++];
  const forcedCells: Coord[] = [];
  for (let k = 0; k < numForced; k++) forcedCells.push([flat[i++], flat[i++]]);

  return { capacity, tilings, forcedCells };
}
