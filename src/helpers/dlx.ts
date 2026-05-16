import { createRequire } from 'node:module';

// wasm-pack --target nodejs generates CJS that reads dlx_bg.wasm synchronously
// via fs.readFileSync relative to its own __dirname — no async init needed.
// Each worker thread gets its own module instance (workers have isolated registries).
const _req = createRequire(import.meta.url);
const wasmDlx = _req('../../pkg/dlx.js') as {
  dlx_solve(
    numPrimary:   number,
    numSecondary: number,
    rowsFlat:     Int32Array,
    rowOffsets:   Int32Array,
  ): Int32Array;
};

export function dlxSolve(
  numPrimary:   number,
  numSecondary: number,
  rows:         number[][],
): number[][] {
  if (numPrimary === 0) return [[]];

  // Flatten rows: number[][] → Int32Array + offsets
  let totalEntries = 0;
  for (const row of rows) totalEntries += row.length;

  const rowsFlat   = new Int32Array(totalEntries);
  const rowOffsets = new Int32Array(rows.length + 1);
  let pos = 0;
  for (let i = 0; i < rows.length; i++) {
    rowOffsets[i] = pos;
    for (const col of rows[i]) rowsFlat[pos++] = col;
  }
  rowOffsets[rows.length] = pos;

  const flat = wasmDlx.dlx_solve(numPrimary, numSecondary, rowsFlat, rowOffsets);
  if (flat.length === 0) return [];

  // Decode sentinel-delimited solutions
  const solutions: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < flat.length; i++) {
    const v = flat[i];
    if (v === -1) { solutions.push(current); current = []; }
    else current.push(v);
  }
  return solutions;
}
