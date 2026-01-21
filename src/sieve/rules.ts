import {
  Board,
  CellState,
  Coord,
  StripCache,
  TilingCache,
} from "./helpers/types";
import { findAllMinimalTilings } from "./helpers/tiling";

const key = (r: number, c: number) => `${r},${c}`;

function buildRegions(grid: number[][]) {
  const map = new Map<number, Coord[]>();
  const numRows = grid.length;
  const numCols = grid[0].length;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const id = grid[r][c];
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push([r, c]);
    }
  }
  return map;
}

function markNeighbors(
  cells: CellState[][],
  row: number,
  col: number,
): boolean {
  const numRows = cells.length;
  const numCols = cells[0].length;
  let changed = false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr,
        nc = col + dc;
      if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
        if (cells[nr][nc] === "unknown") {
          cells[nr][nc] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}

function hasAdjacentPair(coords: Coord[]): boolean {
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      if (
        Math.abs(coords[i][0] - coords[j][0]) <= 1 &&
        Math.abs(coords[i][1] - coords[j][1]) <= 1
      )
        return true;
    }
  }
  return false;
}

export function trivialStarMarks(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] === "star")
        changed = markNeighbors(cells, r, c) || changed;
    }
  }
  return changed;
}

export function trivialRowComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let row = 0; row < size; row++) {
    let stars = 0;
    for (let c = 0; c < size; c++) if (cells[row][c] === "star") stars++;
    if (stars === board.stars) {
      for (let c = 0; c < size; c++) {
        if (cells[row][c] === "unknown") {
          cells[row][c] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function trivialColComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  let changed = false;
  for (let col = 0; col < size; col++) {
    let stars = 0;
    for (let r = 0; r < size; r++) if (cells[r][col] === "star") stars++;
    if (stars === board.stars) {
      for (let r = 0; r < size; r++) {
        if (cells[r][col] === "unknown") {
          cells[r][col] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function trivialRegionComplete(
  board: Board,
  cells: CellState[][],
): boolean {
  let changed = false;
  for (const [, coords] of buildRegions(board.grid)) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    if (stars === board.stars) {
      for (const [r, c] of coords) {
        if (cells[r][c] === "unknown") {
          cells[r][c] = "marked";
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function forcedPlacement(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (let c = 0; c < size; c++) {
      if (cells[row][c] === "star") stars++;
      else if (cells[row][c] === "unknown") unknowns.push([row, c]);
    }
    const needed = board.stars - stars;
    if (
      needed > 0 &&
      unknowns.length === needed &&
      !hasAdjacentPair(unknowns)
    ) {
      cells[unknowns[0][0]][unknowns[0][1]] = "star";
      return true;
    }
  }

  for (let col = 0; col < size; col++) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (let r = 0; r < size; r++) {
      if (cells[r][col] === "star") stars++;
      else if (cells[r][col] === "unknown") unknowns.push([r, col]);
    }
    const needed = board.stars - stars;
    if (
      needed > 0 &&
      unknowns.length === needed &&
      !hasAdjacentPair(unknowns)
    ) {
      cells[unknowns[0][0]][unknowns[0][1]] = "star";
      return true;
    }
  }

  for (const [, coords] of buildRegions(board.grid)) {
    let stars = 0;
    const unknowns: Coord[] = [];
    for (const [r, c] of coords) {
      if (cells[r][c] === "star") stars++;
      else if (cells[r][c] === "unknown") unknowns.push([r, c]);
    }
    const needed = board.stars - stars;
    if (
      needed > 0 &&
      unknowns.length === needed &&
      !hasAdjacentPair(unknowns)
    ) {
      cells[unknowns[0][0]][unknowns[0][1]] = "star";
      return true;
    }
  }

  return false;
}

export function twoByTwoTiling(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  _stripCache?: StripCache,
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  for (const [regionId, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;

    const needed = board.stars - stars;
    if (needed <= 0) continue;

    const tiling =
      tilingCache?.byRegion.get(regionId) ??
      findAllMinimalTilings(coords, cells, size);

    if (tiling.allMinimalTilings.length === 0 || tiling.minTileCount !== needed)
      continue;

    for (const [row, col] of coords) {
      if (cells[row][col] !== "unknown") continue;
      const k = key(row, col);

      const isSingle = tiling.allMinimalTilings.every((ts) => {
        const tile = ts.find((t) =>
          t.coveredCells.some((c) => key(c[0], c[1]) === k),
        );
        return tile && tile.coveredCells.length === 1;
      });

      if (isSingle) {
        cells[row][col] = "star";
        return true;
      }
    }
  }
  return false;
}

export function oneByNConfinement(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  stripCache?: StripCache,
): boolean {
  if (!stripCache) return false;

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
    const needed = strips[0].starsNeeded;
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
            for (const [r, c] of s.cells) cs.add(key(r, c));
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
            for (const [r, c] of s.cells) cs.add(key(r, c));
          colContribs.get(col)!.push({ stars: needed, cells: cs });
        }
      }
    }
  }

  if (tilingCache) {
    for (const [regionId, tiling] of tilingCache.byRegion) {
      if (tiling.allMinimalTilings.length === 0) continue;
      const strips = stripCache.byRegion.get(regionId) ?? [];
      if (strips.length === 0) continue;
      const needed = strips[0].starsNeeded;
      if (needed <= 0 || tiling.minTileCount >= needed) continue;

      const remStars = needed - tiling.minTileCount;
      const covered = new Set<string>();
      for (const t of tiling.allMinimalTilings[0])
        for (const c of t.coveredCells) covered.add(key(c[0], c[1]));
      for (let i = 1; i < tiling.allMinimalTilings.length; i++) {
        const tc = new Set<string>();
        for (const t of tiling.allMinimalTilings[i])
          for (const c of t.coveredCells) tc.add(key(c[0], c[1]));
        for (const k of covered) if (!tc.has(k)) covered.delete(k);
      }

      const rem: Coord[] = [];
      for (const s of strips)
        for (const [r, c] of s.cells)
          if (!covered.has(key(r, c))) rem.push([r, c]);
      if (rem.length === 0) continue;

      const remRows = new Set(rem.map(([r]) => r));
      const remCols = new Set(rem.map(([, c]) => c));

      if (remRows.size === 1) {
        const row = [...remRows][0];
        if (!rowContribs.has(row)) rowContribs.set(row, []);
        rowContribs
          .get(row)!
          .push({
            stars: remStars,
            cells: new Set(rem.map(([r, c]) => key(r, c))),
          });
      }
      if (remCols.size === 1) {
        const col = [...remCols][0];
        if (!colContribs.has(col)) colContribs.set(col, []);
        colContribs
          .get(col)!
          .push({
            stars: remStars,
            cells: new Set(rem.map(([r, c]) => key(r, c))),
          });
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
    for (const x of contribs) for (const cell of x.cells) contributing.add(cell);
    for (let c = 0; c < numCols; c++) {
      if (cells[row][c] === "unknown" && !contributing.has(key(row, c))) {
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
    for (const x of contribs) for (const cell of x.cells) contributing.add(cell);
    for (let r = 0; r < numRows; r++) {
      if (cells[r][col] === "unknown" && !contributing.has(key(r, col))) {
        cells[r][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}

export function exclusion(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  _stripCache?: StripCache,
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    regionStars.set(id, stars);
  }

  const tight = new Map<number, { coords: Coord[]; needed: number }>();
  for (const [id, coords] of regions) {
    const needed = board.stars - regionStars.get(id)!;
    if (needed <= 0) continue;
    const tiling =
      tilingCache?.byRegion.get(id) ??
      findAllMinimalTilings(coords, cells, size);
    if (tiling.minTileCount === needed) tight.set(id, { coords, needed });
  }
  if (tight.size === 0) return false;

  const toCheck = new Set<string>();
  for (const [, { coords }] of tight) {
    for (const [r, c] of coords) {
      toCheck.add(key(r, c));
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr,
            nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size)
            toCheck.add(key(nr, nc));
        }
      }
    }
  }

  for (const k of toCheck) {
    const [row, col] = k.split(",").map(Number);
    if (cells[row][col] !== "unknown") continue;

    const temp = cells.map((r) => [...r]);
    temp[row][col] = "star";
    markNeighbors(temp, row, col);

    for (const [regionId, { coords, needed }] of tight) {
      const inRegion = board.grid[row][col] === regionId;
      const rem = inRegion ? needed - 1 : needed;
      if (rem <= 0) continue;
      const t = findAllMinimalTilings(coords, temp, size);
      if (t.minTileCount < rem) {
        cells[row][col] = "marked";
        return true;
      }
    }
  }
  return false;
}

export function pressuredExclusion(
  board: Board,
  cells: CellState[][],
  tilingCache?: TilingCache,
  stripCache?: StripCache,
): boolean {
  if (!stripCache) return false;

  const size = board.grid.length;
  const regions = buildRegions(board.grid);
  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    regionStars.set(id, stars);
  }

  const seen = new Set<string>();
  const candidates: Coord[] = [];
  for (const [regionId, strips] of stripCache.byRegion) {
    if (board.stars - (regionStars.get(regionId) ?? 0) <= 0) continue;
    for (const strip of strips) {
      if (strip.starsNeeded <= 0) continue;
      for (const [r, c] of strip.cells) {
        const k = key(r, c);
        if (cells[r][c] === "unknown" && !seen.has(k)) {
          seen.add(k);
          candidates.push([r, c]);
        }
      }
    }
  }

  for (const [fr, fc] of candidates) {
    const temp = cells.map((row) => [...row]);
    temp[fr][fc] = "star";
    markNeighbors(temp, fr, fc);

    for (const [regionId, coords] of regions) {
      const existing = regionStars.get(regionId) ?? 0;
      const inRegion = board.grid[fr][fc] === regionId;
      const needed = board.stars - existing - (inRegion ? 1 : 0);
      if (needed <= 0) continue;
      const t = findAllMinimalTilings(coords, temp, size);
      if (t.minTileCount < needed) {
        cells[fr][fc] = "marked";
        return true;
      }
    }

    for (const [regionId, coords] of regions) {
      if (board.grid[fr][fc] === regionId) continue;
      const needed = board.stars - (regionStars.get(regionId) ?? 0);
      if (needed <= 0) continue;
      const t = findAllMinimalTilings(coords, temp, size);
      if (t.allMinimalTilings.length === 0) continue;

      const colUsedInAll = t.allMinimalTilings.every((tl) =>
        tl.some((tile) => tile.coveredCells.some(([, c]) => c === fc)),
      );

      if (colUsedInAll) {
        const blocked = temp.map((row) => [...row]);
        for (let r = 0; r < size; r++)
          if (blocked[r][fc] === "unknown") blocked[r][fc] = "marked";

        for (const [otherId, otherCoords] of regions) {
          if (otherId === regionId || board.grid[fr][fc] === otherId) continue;
          const otherNeeded = board.stars - (regionStars.get(otherId) ?? 0);
          if (otherNeeded <= 0) continue;
          const ot = findAllMinimalTilings(otherCoords, blocked, size);
          if (ot.minTileCount < otherNeeded) {
            cells[fr][fc] = "marked";
            return true;
          }
        }
      }
    }
  }
  return false;
}

export function undercounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  const regionRows = new Map<number, Set<number>>();
  const regionCols = new Map<number, Set<number>>();
  const regionStars = new Map<number, number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (!regionRows.has(id)) {
        regionRows.set(id, new Set());
        regionCols.set(id, new Set());
        regionStars.set(id, 0);
      }
      regionRows.get(id)!.add(r);
      regionCols.get(id)!.add(c);
      if (cells[r][c] === "star") regionStars.set(id, regionStars.get(id)! + 1);
    }
  }

  const active = [...regionRows.keys()].filter(
    (id) => regionStars.get(id)! < board.stars,
  );
  const inRows = (id: number, rows: Set<number>) =>
    [...regionRows.get(id)!].every((r) => rows.has(r));
  const inCols = (id: number, cols: Set<number>) =>
    [...regionCols.get(id)!].every((c) => cols.has(c));

  for (const id of active) {
    const rows = regionRows.get(id)!;
    const contained = active.filter((i) => inRows(i, rows));
    if (contained.length === rows.size) {
      const set = new Set(contained);
      for (const row of rows) {
        for (let c = 0; c < size; c++) {
          if (!set.has(board.grid[row][c]) && cells[row][c] === "unknown") {
            cells[row][c] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  if (changed) return true;

  for (const id of active) {
    const cols = regionCols.get(id)!;
    const contained = active.filter((i) => inCols(i, cols));
    if (contained.length === cols.size) {
      const set = new Set(contained);
      for (const col of cols) {
        for (let r = 0; r < size; r++) {
          if (!set.has(board.grid[r][col]) && cells[r][col] === "unknown") {
            cells[r][col] = "marked";
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}

export function overcounting(board: Board, cells: CellState[][]): boolean {
  const size = board.grid.length;
  let changed = false;

  const regions = buildRegions(board.grid);
  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [r, c] of coords) if (cells[r][c] === "star") stars++;
    regionStars.set(id, stars);
  }

  const active = new Set(
    [...regions.keys()].filter((id) => regionStars.get(id)! < board.stars),
  );

  const rowRegions = new Map<number, Set<number>>();
  const colRegions = new Map<number, Set<number>>();
  for (let i = 0; i < size; i++) {
    rowRegions.set(i, new Set());
    colRegions.set(i, new Set());
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = board.grid[r][c];
      if (active.has(id)) {
        rowRegions.get(r)!.add(id);
        colRegions.get(c)!.add(id);
      }
    }
  }

  for (let start = 0; start < size; start++) {
    const rowSet = new Set<number>();
    const regSet = new Set<number>();
    for (let end = start; end < size; end++) {
      rowSet.add(end);
      const prev = regSet.size;
      for (const id of rowRegions.get(end)!) regSet.add(id);
      const added = regSet.size > prev;

      if (regSet.size === rowSet.size) {
        let valid = true;
        for (const row of rowSet) {
          for (let c = 0; c < size && valid; c++)
            if (!regSet.has(board.grid[row][c])) valid = false;
        }
        if (valid) {
          for (const id of regSet) {
            for (const [r, c] of regions.get(id)!) {
              if (!rowSet.has(r) && cells[r][c] === "unknown") {
                cells[r][c] = "marked";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }
      if (end > start && added && regSet.size > rowSet.size) break;
    }
  }

  for (let start = 0; start < size; start++) {
    const colSet = new Set<number>();
    const regSet = new Set<number>();
    for (let end = start; end < size; end++) {
      colSet.add(end);
      const prev = regSet.size;
      for (const id of colRegions.get(end)!) regSet.add(id);
      const added = regSet.size > prev;

      if (regSet.size === colSet.size) {
        let valid = true;
        for (const col of colSet) {
          for (let r = 0; r < size && valid; r++)
            if (!regSet.has(board.grid[r][col])) valid = false;
        }
        if (valid) {
          for (const id of regSet) {
            for (const [r, c] of regions.get(id)!) {
              if (!colSet.has(c) && cells[r][c] === "unknown") {
                cells[r][c] = "marked";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }
      if (end > start && added && regSet.size > colSet.size) break;
    }
  }

  return changed;
}
