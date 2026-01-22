import { cellKey } from "../../helpers/cellKey";
import { Board, CellState, StripCache, TilingCache } from "../../helpers/types";

export default function oneByNConfinement(
  board: Board,
  cells: CellState[][],
  _tilingCache?: TilingCache,
  stripCache?: StripCache,
): boolean {
  if (!stripCache) return false;
  if (board.grid.length === 0) return false;

  const numRows = board.grid.length;
  const numCols = board.grid[0].length;
  let changed = false;

  type Contrib = { stars: number; cells: Set<string> };
  const rowContribs = new Map<number, Contrib[]>();
  const colContribs = new Map<number, Contrib[]>();

  const isRowConfined = (regionId: number, row: number): boolean => {
    const strips = stripCache.byRegion.get(regionId) ?? [];
    if (strips.length === 0) return false;
    let hasH = false;
    for (const s of strips) {
      if (s.orientation === "horizontal") {
        hasH = true;
        if (s.anchor[0] !== row) return false;
      } else if (s.cells.length > 1) return false;
    }
    return hasH;
  };

  const isColConfined = (regionId: number, col: number): boolean => {
    const strips = stripCache.byRegion.get(regionId) ?? [];
    if (strips.length === 0) return false;
    let hasV = false;
    for (const s of strips) {
      if (s.orientation === "vertical") {
        hasV = true;
        if (s.anchor[1] !== col) return false;
      } else if (s.cells.length > 1) return false;
    }
    return hasV;
  };

  for (const [regionId, strips] of stripCache.byRegion) {
    if (strips.length === 0) continue;
    const needed = strips[0]!.starsNeeded;
    if (needed <= 0) continue;

    const hStrips = strips.filter((s) => s.orientation === "horizontal");
    if (hStrips.length > 0) {
      const rows = new Set(hStrips.map((s) => s.anchor[0]));
      if (rows.size === 1) {
        const row = [...rows][0];
        if (isRowConfined(regionId, row)) {
          if (!rowContribs.has(row)) rowContribs.set(row, []);
          const cs = new Set<string>();
          for (const s of hStrips)
            for (const [r, c] of s.cells) cs.add(cellKey(r, c));
          rowContribs.get(row)!.push({ stars: needed, cells: cs });
        }
      }
    }

    const vStrips = strips.filter((s) => s.orientation === "vertical");
    if (vStrips.length > 0) {
      const cols = new Set(vStrips.map((s) => s.anchor[1]));
      if (cols.size === 1) {
        const col = [...cols][0];
        if (isColConfined(regionId, col)) {
          if (!colContribs.has(col)) colContribs.set(col, []);
          const cs = new Set<string>();
          for (const s of vStrips)
            for (const [r, c] of s.cells) cs.add(cellKey(r, c));
          colContribs.get(col)!.push({ stars: needed, cells: cs });
        }
      }
    }
  }

  for (const [row, contribs] of rowContribs) {
    let stars = 0;
    for (let c = 0; c < numCols; c++) if (cells[row][c] === "star") stars++;
    const quota = board.stars - stars;
    if (quota <= 0) continue;
    const total = contribs.reduce((s, x) => s + x.stars, 0);
    if (total < quota) continue;
    const contributing = new Set<string>();
    for (const x of contribs)
      for (const cell of x.cells) contributing.add(cell);
    for (let c = 0; c < numCols; c++) {
      if (cells[row][c] === "unknown" && !contributing.has(cellKey(row, c))) {
        cells[row][c] = "marked";
        changed = true;
      }
    }
  }

  for (const [col, contribs] of colContribs) {
    let stars = 0;
    for (let r = 0; r < numRows; r++) if (cells[r][col] === "star") stars++;
    const quota = board.stars - stars;
    if (quota <= 0) continue;
    const total = contribs.reduce((s, x) => s + x.stars, 0);
    if (total < quota) continue;
    const contributing = new Set<string>();
    for (const x of contribs)
      for (const cell of x.cells) contributing.add(cell);
    for (let r = 0; r < numRows; r++) {
      if (cells[r][col] === "unknown" && !contributing.has(cellKey(r, col))) {
        cells[r][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}
