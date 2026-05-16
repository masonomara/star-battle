import { createRequire } from 'node:module';
import { CellState, Coord, Tile } from './types';

const _req = createRequire(import.meta.url);
const wasmEnum = _req('../../pkg/dlx.js') as {
  collect_valid_star_cells(
    tilingsFlat: Int32Array, insideKeys: Int32Array,
    cellStates:  Int32Array, size: number,
  ): Int32Array;
  find_forced_overhang(
    tilingsFlat: Int32Array, insideKeys: Int32Array, size: number,
  ): Int32Array;
};

// ── Encoding helpers ──────────────────────────────────────────────────────────

function encodeTilings(tilings: Tile[][]): Int32Array {
  let total = 1;
  for (const tiling of tilings) {
    total += 1;
    for (const tile of tiling) total += 3 + tile.coveredCells.length * 2;
  }
  const flat = new Int32Array(total);
  let i = 0;
  flat[i++] = tilings.length;
  for (const tiling of tilings) {
    flat[i++] = tiling.length;
    for (const tile of tiling) {
      flat[i++] = tile.cells[0][0]; // ar
      flat[i++] = tile.cells[0][1]; // ac
      flat[i++] = tile.coveredCells.length;
      for (const [r, c] of tile.coveredCells) { flat[i++] = r; flat[i++] = c; }
    }
  }
  return flat;
}

function encodeCellStates(cells: CellState[][], size: number): Int32Array {
  const flat = new Int32Array(size * size); // 0 = unknown
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if      (cells[r][c] === 'star')   flat[r * size + c] = 1;
      else if (cells[r][c] === 'marked') flat[r * size + c] = 2;
    }
  return flat;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function collectValidStarCells(
  allTilings: Tile[][],
  insideSet:  Set<number>,
  cells:      CellState[][],
  size:       number,
): Set<number> {
  if (allTilings.length === 0) return new Set();
  const flat = wasmEnum.collect_valid_star_cells(
    encodeTilings(allTilings),
    Int32Array.from(insideSet),
    encodeCellStates(cells, size),
    size,
  );
  return new Set(flat);
}

export function filterActiveTilings(
  allTilings: Tile[][],
  insideSet:  Set<number>,
  cells:      CellState[][],
  size:       number,
): Tile[][] {
  return allTilings.filter((tiling) => {
    for (const tile of tiling)
      for (const [r, c] of tile.cells)
        if (!insideSet.has(r * size + c) && cells[r][c] === 'unknown') return true;
    return false;
  });
}

export function findForcedOverhangCells(
  activeTilings: Tile[][],
  insideSet:     Set<number>,
  size:          number,
): Coord[] {
  if (activeTilings.length === 0) return [];
  const flat = wasmEnum.find_forced_overhang(
    encodeTilings(activeTilings),
    Int32Array.from(insideSet),
    size,
  );
  const out: Coord[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
}
