import type {
  Cell,
  OneByNMarker,
  SolverGrid,
  TilingResult,
  Rule,
} from "./types";

// =============================================================================
// UTILITIES (not rule logic - just basic operations)
// =============================================================================

const K = 1000; // key multiplier, must exceed max grid size

const key = (r: number, c: number) => r * K + c;
const cellKey = (cell: Cell) => cell.row * K + cell.col;

function* subsetsOfSize<T>(arr: T[], size: number): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  if (size > arr.length) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => arr[i]);
    let i = size - 1;
    while (i >= 0 && idx[i] === arr.length - size + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1] + 1;
  }
}

function computeTiling(
  cells: Cell[],
  gridSize: number,
  cache: Map<string, TilingResult>
): TilingResult {
  if (cells.length === 0) return { maxStars: 0, tiles: [], uncoveredCells: [] };

  const cacheKey = cells
    .map(cellKey)
    .sort((a, b) => a - b)
    .join("|");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const remaining = new Set(cells.map(cellKey));
  const tiles: Cell[][] = [];

  let minR = gridSize,
    maxR = 0,
    minC = gridSize,
    maxC = 0;
  for (const c of cells) {
    minR = Math.min(minR, c.row);
    maxR = Math.max(maxR, c.row);
    minC = Math.min(minC, c.col);
    maxC = Math.max(maxC, c.col);
  }

  while (remaining.size > 0) {
    let best: Cell[] | null = null,
      bestCov = 0;
    for (let r = Math.max(0, minR - 1); r <= maxR && r < gridSize - 1; r++) {
      for (let c = Math.max(0, minC - 1); c <= maxC && c < gridSize - 1; c++) {
        const tile = [
          { row: r, col: c },
          { row: r, col: c + 1 },
          { row: r + 1, col: c },
          { row: r + 1, col: c + 1 },
        ];
        const cov = tile.filter((t) => remaining.has(cellKey(t))).length;
        if (cov > bestCov) {
          bestCov = cov;
          best = tile;
        }
      }
    }
    if (best && bestCov > 0) {
      tiles.push(best);
      for (const t of best) remaining.delete(cellKey(t));
    } else break;
  }

  const result = {
    maxStars: tiles.length + remaining.size,
    tiles,
    uncoveredCells: cells.filter((c) => remaining.has(cellKey(c))),
  };
  cache.set(cacheKey, result);
  return result;
}

type Region = { cells: Cell[]; threads: Cell[] };

function findIsolatedRegions(g: SolverGrid): Region[] {
  const { size } = g.grid;
  const visited = new Set<number>();
  const regions: Region[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (visited.has(key(row, col)) || g.board[row][col] !== "empty") continue;

      // BFS for orthogonally connected component
      const comp: Cell[] = [];
      const queue: Cell[] = [{ row, col }];
      visited.add(key(row, col));

      while (queue.length) {
        const cur = queue.shift()!;
        comp.push(cur);
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const nr = cur.row + dr,
            nc = cur.col + dc;
          if (
            nr >= 0 &&
            nr < size &&
            nc >= 0 &&
            nc < size &&
            !visited.has(key(nr, nc)) &&
            g.board[nr][nc] === "empty"
          ) {
            visited.add(key(nr, nc));
            queue.push({ row: nr, col: nc });
          }
        }
      }

      // Find diagonal threads (cells touching component but not in it)
      const compSet = new Set(comp.map(cellKey));
      const threads: Cell[] = [];
      const threadSet = new Set<number>();

      for (const c of comp) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = c.row + dr,
              nc = c.col + dc;
            const nk = key(nr, nc);
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              !compSet.has(nk) &&
              !threadSet.has(nk) &&
              g.board[nr][nc] === "empty"
            ) {
              threads.push({ row: nr, col: nc });
              threadSet.add(nk);
            }
          }
        }
      }
      regions.push({ cells: comp, threads });
    }
  }
  return regions;
}

function findValidConfigs(
  cells: Cell[],
  numStars: number,
  limit = 11
): Cell[][] {
  const configs: Cell[][] = [];
  for (const combo of subsetsOfSize(cells, numStars)) {
    let valid = true;
    outer: for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        if (
          Math.abs(combo[i].row - combo[j].row) <= 1 &&
          Math.abs(combo[i].col - combo[j].col) <= 1
        ) {
          valid = false;
          break outer;
        }
      }
    }
    if (valid) {
      configs.push(combo);
      if (configs.length >= limit) break;
    }
  }
  return configs;
}

// =============================================================================
// TIER 1: TRIVIAL
// =============================================================================

const r1_1: Rule = {
  name: "R1.1 Star Adjacency",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    let changed = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (g.board[r][c] !== "star") continue;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr,
              nc = c + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              g.board[nr][nc] === "empty"
            ) {
              g.board[nr][nc] = "eliminated";
              changed = true;
            }
          }
        }
      }
    }
    return changed;
  },
};

const r1_2: Rule = {
  name: "R1.2 Row Complete",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    for (let row = 0; row < size; row++) {
      let stars = 0,
        hasEmpty = false;
      for (let col = 0; col < size; col++) {
        if (g.board[row][col] === "star") stars++;
        else if (g.board[row][col] === "empty") hasEmpty = true;
      }
      if (stars === g.starsPerContainer && hasEmpty) {
        for (let col = 0; col < size; col++) {
          if (g.board[row][col] === "empty") g.board[row][col] = "eliminated";
        }
        return true;
      }
    }
    return false;
  },
};

const r1_3: Rule = {
  name: "R1.3 Column Complete",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    for (let col = 0; col < size; col++) {
      let stars = 0,
        hasEmpty = false;
      for (let row = 0; row < size; row++) {
        if (g.board[row][col] === "star") stars++;
        else if (g.board[row][col] === "empty") hasEmpty = true;
      }
      if (stars === g.starsPerContainer && hasEmpty) {
        for (let row = 0; row < size; row++) {
          if (g.board[row][col] === "empty") g.board[row][col] = "eliminated";
        }
        return true;
      }
    }
    return false;
  },
};

const r1_4: Rule = {
  name: "R1.4 Shape Complete",
  difficulty: "easy",
  apply: (g) => {
    for (const shape of g.grid.shapes) {
      let stars = 0,
        hasEmpty = false;
      for (const c of shape) {
        if (g.board[c.row][c.col] === "star") stars++;
        else if (g.board[c.row][c.col] === "empty") hasEmpty = true;
      }
      if (stars === g.starsPerContainer && hasEmpty) {
        for (const c of shape) {
          if (g.board[c.row][c.col] === "empty")
            g.board[c.row][c.col] = "eliminated";
        }
        return true;
      }
    }
    return false;
  },
};

const r1_5: Rule = {
  name: "R1.5 Row Forced",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    for (let row = 0; row < size; row++) {
      let stars = 0;
      const empty: Cell[] = [];
      for (let col = 0; col < size; col++) {
        if (g.board[row][col] === "star") stars++;
        else if (g.board[row][col] === "empty") empty.push({ row, col });
      }
      const needed = g.starsPerContainer - stars;
      if (needed > 0 && empty.length === needed) {
        for (const c of empty) g.board[c.row][c.col] = "star";
        return true;
      }
    }
    return false;
  },
};

const r1_6: Rule = {
  name: "R1.6 Column Forced",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    for (let col = 0; col < size; col++) {
      let stars = 0;
      const empty: Cell[] = [];
      for (let row = 0; row < size; row++) {
        if (g.board[row][col] === "star") stars++;
        else if (g.board[row][col] === "empty") empty.push({ row, col });
      }
      const needed = g.starsPerContainer - stars;
      if (needed > 0 && empty.length === needed) {
        for (const c of empty) g.board[c.row][c.col] = "star";
        return true;
      }
    }
    return false;
  },
};

const r1_7: Rule = {
  name: "R1.7 Shape Forced",
  difficulty: "easy",
  apply: (g) => {
    for (const shape of g.grid.shapes) {
      let stars = 0;
      const empty: Cell[] = [];
      for (const c of shape) {
        if (g.board[c.row][c.col] === "star") stars++;
        else if (g.board[c.row][c.col] === "empty")
          empty.push({ row: c.row, col: c.col });
      }
      const needed = g.starsPerContainer - stars;
      if (needed > 0 && empty.length === needed) {
        for (const c of empty) g.board[c.row][c.col] = "star";
        return true;
      }
    }
    return false;
  },
};

// =============================================================================
// TIER 2: BOUND PROPAGATION
// =============================================================================

const r2_1: Rule = {
  name: "R2.1 2x2 Maximum",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const quad = [
          g.board[r][c],
          g.board[r][c + 1],
          g.board[r + 1][c],
          g.board[r + 1][c + 1],
        ];
        if (quad.includes("star") && quad.includes("empty")) {
          if (g.board[r][c] === "empty") g.board[r][c] = "eliminated";
          if (g.board[r][c + 1] === "empty") g.board[r][c + 1] = "eliminated";
          if (g.board[r + 1][c] === "empty") g.board[r + 1][c] = "eliminated";
          if (g.board[r + 1][c + 1] === "empty")
            g.board[r + 1][c + 1] = "eliminated";
          return true;
        }
      }
    }
    return false;
  },
};

const r2_2: Rule = {
  name: "R2.2 Exact Tiling",
  difficulty: "easy",
  apply: (g) => {
    const { size, shapes } = g.grid;
    const S = g.starsPerContainer;
    const star2x2s = (g.starContaining2x2s ??= []);
    let changed = false;

    for (const shape of shapes) {
      let stars = 0;
      const empty: Cell[] = [];
      for (const c of shape) {
        if (g.board[c.row][c.col] === "star") stars++;
        else if (g.board[c.row][c.col] === "empty")
          empty.push({ row: c.row, col: c.col });
      }
      const needed = S - stars;
      if (needed <= 0 || empty.length === 0) continue;

      const tiling = computeTiling(empty, size, g.tilingCache);
      if (
        tiling.tiles.length === needed &&
        tiling.uncoveredCells.length === 0
      ) {
        for (const tile of tiling.tiles) {
          const tk = tile
            .map(cellKey)
            .sort((a, b) => a - b)
            .join("|");
          const exists = star2x2s.some(
            (t) =>
              t
                .map(cellKey)
                .sort((a, b) => a - b)
                .join("|") === tk
          );
          if (!exists) {
            star2x2s.push(tile);
            changed = true;
          }
        }
      }
    }
    return changed;
  },
};

const r2_3: Rule = {
  name: "R2.3 1xn Identification",
  difficulty: "easy",
  apply: (g) => {
    const { size, shapes } = g.grid;
    const S = g.starsPerContainer;
    const oneByNs = (g.oneByNs ??= []);
    let changed = false;

    for (const shape of shapes) {
      let stars = 0;
      const empty: Cell[] = [];
      for (const c of shape) {
        if (g.board[c.row][c.col] === "star") stars++;
        else if (g.board[c.row][c.col] === "empty")
          empty.push({ row: c.row, col: c.col });
      }
      const needed = S - stars;
      if (needed <= 0 || empty.length === 0) continue;

      const tiling = computeTiling(empty, size, g.tilingCache);
      const uc = tiling.uncoveredCells;
      if (uc.length === 0) continue;

      const sameRow = uc.every((c) => c.row === uc[0].row);
      const sameCol = uc.every((c) => c.col === uc[0].col);
      if (!sameRow && !sameCol) continue;

      const markerKey = uc
        .map(cellKey)
        .sort((a, b) => a - b)
        .join("|");
      const exists = oneByNs.some(
        (m) =>
          m.cells
            .map(cellKey)
            .sort((a, b) => a - b)
            .join("|") === markerKey
      );
      if (!exists) {
        oneByNs.push({
          cells: uc,
          row: sameRow ? uc[0].row : null,
          col: sameCol ? uc[0].col : null,
          min: 1,
          max: tiling.tiles.length === needed - 1 ? 1 : uc.length,
        });
        changed = true;
      }
    }
    return changed;
  },
};

const r2_4: Rule = {
  name: "R2.4 1xn Line Completion",
  difficulty: "easy",
  apply: (g) => {
    const { size } = g.grid;
    const S = g.starsPerContainer;
    const oneByNs = (g.oneByNs ??= []);

    // Check rows
    for (let row = 0; row < size; row++) {
      const markers = oneByNs.filter((m) => m.row === row);
      if (markers.length === 0) continue;

      const sumMin = markers.reduce((s, m) => s + m.min, 0);
      if (sumMin < S) continue;

      const markerCells = new Set(markers.flatMap((m) => m.cells.map(cellKey)));
      let changed = false;
      for (let col = 0; col < size; col++) {
        if (!markerCells.has(key(row, col)) && g.board[row][col] === "empty") {
          g.board[row][col] = "eliminated";
          changed = true;
        }
      }
      if (changed) return true;
      if (sumMin === S) markers.forEach((m) => (m.max = 1));
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      const markers = oneByNs.filter((m) => m.col === col);
      if (markers.length === 0) continue;

      const sumMin = markers.reduce((s, m) => s + m.min, 0);
      if (sumMin < S) continue;

      const markerCells = new Set(markers.flatMap((m) => m.cells.map(cellKey)));
      let changed = false;
      for (let row = 0; row < size; row++) {
        if (!markerCells.has(key(row, col)) && g.board[row][col] === "empty") {
          g.board[row][col] = "eliminated";
          changed = true;
        }
      }
      if (changed) return true;
      if (sumMin === S) markers.forEach((m) => (m.max = 1));
    }

    return false;
  },
};

// =============================================================================
// TIER 3: EXCLUSION
// =============================================================================

function applyExclusion(g: SolverGrid, cells: Cell[], needed: number): boolean {
  const { size } = g.grid;
  const empty = cells.filter((c) => g.board[c.row][c.col] === "empty");
  if (needed <= 0 || empty.length > 20) return false;

  for (const cell of empty) {
    // Hypothetically place star and eliminate neighbors
    const hypo = g.board.map((r) => [...r]);
    hypo[cell.row][cell.col] = "star";
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = cell.row + dr,
          nc = cell.col + dc;
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          hypo[nr][nc] === "empty"
        ) {
          hypo[nr][nc] = "eliminated";
        }
      }
    }

    // Check if remaining cells can support needed-1 more stars
    const remaining = cells.filter(
      (c) =>
        hypo[c.row][c.col] === "empty" &&
        !(c.row === cell.row && c.col === cell.col)
    );

    const maxMore =
      remaining.length === 0
        ? 0
        : computeTiling(remaining, size, g.tilingCache).maxStars;

    if (maxMore < needed - 1) {
      g.board[cell.row][cell.col] = "eliminated";
      return true;
    }
  }
  return false;
}

const r3_1: Rule = {
  name: "R3.1 Shape Exclusion",
  difficulty: "medium",
  apply: (g) => {
    for (const shape of g.grid.shapes) {
      const cells = shape.map((c) => ({ row: c.row, col: c.col }));
      const stars = cells.filter(
        (c) => g.board[c.row][c.col] === "star"
      ).length;
      if (applyExclusion(g, cells, g.starsPerContainer - stars)) return true;
    }
    return false;
  },
};

const r3_2: Rule = {
  name: "R3.2 Row Exclusion",
  difficulty: "medium",
  apply: (g) => {
    const { size } = g.grid;
    for (let row = 0; row < size; row++) {
      const cells: Cell[] = [];
      let stars = 0;
      for (let col = 0; col < size; col++) {
        cells.push({ row, col });
        if (g.board[row][col] === "star") stars++;
      }
      if (applyExclusion(g, cells, g.starsPerContainer - stars)) return true;
    }
    return false;
  },
};

const r3_3: Rule = {
  name: "R3.3 Column Exclusion",
  difficulty: "medium",
  apply: (g) => {
    const { size } = g.grid;
    for (let col = 0; col < size; col++) {
      const cells: Cell[] = [];
      let stars = 0;
      for (let row = 0; row < size; row++) {
        cells.push({ row, col });
        if (g.board[row][col] === "star") stars++;
      }
      if (applyExclusion(g, cells, g.starsPerContainer - stars)) return true;
    }
    return false;
  },
};

const r3_4: Rule = {
  name: "R3.4 2x2 Exclusion",
  difficulty: "medium",
  apply: (g) => {
    const { size } = g.grid;
    const S = g.starsPerContainer;
    const star2x2s = (g.starContaining2x2s ??= []);
    const oneByNs = (g.oneByNs ??= []);

    for (const tile of star2x2s) {
      const empty = tile.filter((c) => g.board[c.row][c.col] === "empty");
      if (empty.length !== 2) continue;

      const [A, B] = empty;
      const sameRow = A.row === B.row;
      const sameCol = A.col === B.col;

      for (const cell of [A, B]) {
        // Check if placing star here would overflow a line
        const checkLine = (lineIdx: number, dir: "row" | "col") => {
          let lineStars = 0;
          for (let i = 0; i < size; i++) {
            const r = dir === "row" ? lineIdx : i;
            const c = dir === "row" ? i : lineIdx;
            if (g.board[r][c] === "star") lineStars++;
          }
          const markers = oneByNs.filter((m) => m[dir] === lineIdx);
          const committed = markers.reduce((s, m) => s + m.min, 0);
          return lineStars + committed + 1 > S;
        };

        if (!sameRow && !sameCol) {
          if (checkLine(cell.row, "row") || checkLine(cell.col, "col")) {
            g.board[cell.row][cell.col] = "eliminated";
            return true;
          }
        } else if (sameRow && checkLine(cell.col, "col")) {
          g.board[cell.row][cell.col] = "eliminated";
          return true;
        } else if (sameCol && checkLine(cell.row, "row")) {
          g.board[cell.row][cell.col] = "eliminated";
          return true;
        }
      }
    }
    return false;
  },
};

// =============================================================================
// TIER 4: COUNTING
// =============================================================================

function getShapeCells(g: SolverGrid, id: number): Set<number> {
  if (!g.shapeCellSets) g.shapeCellSets = new Map();
  let cached = g.shapeCellSets.get(id);
  if (!cached) {
    cached = new Set(g.grid.shapes[id].map(cellKey));
    g.shapeCellSets.set(id, cached);
  }
  return cached;
}

function unionShapes(g: SolverGrid, ids: number[]): Set<number> {
  const union = new Set<number>();
  for (const id of ids) {
    for (const k of getShapeCells(g, id)) union.add(k);
  }
  return union;
}

function* candidateSubsets(g: SolverGrid, maxSize: number) {
  const n = g.grid.shapes.length;

  // Size 1
  for (let i = 0; i < n; i++) {
    const m = g.shapeMeta[i];
    if (m.rowCount <= 1 || m.colCount <= 1) {
      yield {
        ids: [i],
        rows: m.rowCount <= 1 ? m.rows : null,
        cols: m.colCount <= 1 ? m.cols : null,
      };
    }
  }

  if (maxSize < 2) return;

  // Size 2
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const rows = new Set([...g.shapeMeta[i].rows, ...g.shapeMeta[j].rows]);
      const cols = new Set([...g.shapeMeta[i].cols, ...g.shapeMeta[j].cols]);
      if (rows.size <= 2 || cols.size <= 2) {
        yield {
          ids: [i, j],
          rows: rows.size <= 2 ? rows : null,
          cols: cols.size <= 2 ? cols : null,
        };
      }
    }
  }

  if (maxSize < 3) return;

  // Size 3
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const rows = new Set([
          ...g.shapeMeta[i].rows,
          ...g.shapeMeta[j].rows,
          ...g.shapeMeta[k].rows,
        ]);
        const cols = new Set([
          ...g.shapeMeta[i].cols,
          ...g.shapeMeta[j].cols,
          ...g.shapeMeta[k].cols,
        ]);
        if (rows.size <= 3 || cols.size <= 3) {
          yield {
            ids: [i, j, k],
            rows: rows.size <= 3 ? rows : null,
            cols: cols.size <= 3 ? cols : null,
          };
        }
      }
    }
  }
}

const r4_1: Rule = {
  name: "R4.1 Undercounting",
  difficulty: "hard",
  apply: (g) => {
    const { size } = g.grid;
    const maxSub = Math.min(Math.floor(size / 2), 3);

    for (const { ids, rows, cols } of candidateSubsets(g, maxSub)) {
      const k = ids.length;
      const scs = unionShapes(g, ids);

      // If k shapes fit in k rows, eliminate non-shape cells in those rows
      if (rows && rows.size === k) {
        let allInRows = true;
        for (const ck of scs) {
          if (!rows.has(Math.floor(ck / K))) {
            allInRows = false;
            break;
          }
        }
        if (allInRows) {
          let changed = false;
          for (const row of rows) {
            for (let col = 0; col < size; col++) {
              if (!scs.has(key(row, col)) && g.board[row][col] === "empty") {
                g.board[row][col] = "eliminated";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }

      // Same for columns
      if (cols && cols.size === k) {
        let allInCols = true;
        for (const ck of scs) {
          if (!cols.has(ck % K)) {
            allInCols = false;
            break;
          }
        }
        if (allInCols) {
          let changed = false;
          for (const col of cols) {
            for (let row = 0; row < size; row++) {
              if (!scs.has(key(row, col)) && g.board[row][col] === "empty") {
                g.board[row][col] = "eliminated";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }
    }
    return false;
  },
};

const r4_2: Rule = {
  name: "R4.2 Overcounting",
  difficulty: "hard",
  apply: (g) => {
    const { size, shapes } = g.grid;
    const maxSub = Math.min(Math.floor(size / 2), 3);

    for (const { ids } of candidateSubsets(g, maxSub)) {
      const k = ids.length;
      const scs = unionShapes(g, ids);

      // Find rows completely covered by these shapes
      const fullRows: number[] = [];
      for (let r = 0; r < size; r++) {
        let full = true;
        for (let c = 0; c < size; c++) {
          if (!scs.has(key(r, c))) {
            full = false;
            break;
          }
        }
        if (full) fullRows.push(r);
      }

      if (fullRows.length === k) {
        const rowSet = new Set(fullRows);
        let changed = false;
        for (const id of ids) {
          for (const c of shapes[id]) {
            if (!rowSet.has(c.row) && g.board[c.row][c.col] === "empty") {
              g.board[c.row][c.col] = "eliminated";
              changed = true;
            }
          }
        }
        if (changed) return true;
      }

      // Same for columns
      const fullCols: number[] = [];
      for (let c = 0; c < size; c++) {
        let full = true;
        for (let r = 0; r < size; r++) {
          if (!scs.has(key(r, c))) {
            full = false;
            break;
          }
        }
        if (full) fullCols.push(c);
      }

      if (fullCols.length === k) {
        const colSet = new Set(fullCols);
        let changed = false;
        for (const id of ids) {
          for (const c of shapes[id]) {
            if (!colSet.has(c.col) && g.board[c.row][c.col] === "empty") {
              g.board[c.row][c.col] = "eliminated";
              changed = true;
            }
          }
        }
        if (changed) return true;
      }
    }
    return false;
  },
};

const r4_3: Rule = {
  name: "R4.3 Finned Undercounting",
  difficulty: "hard",
  apply: (g) => {
    const { size } = g.grid;
    const maxSub = Math.min(Math.floor(size / 2), 3);

    for (const { ids } of candidateSubsets(g, maxSub)) {
      const k = ids.length;

      // Check if shapes span exactly k+1 rows/cols (one "fin")
      const allRows = new Set<number>();
      const allCols = new Set<number>();
      for (const id of ids) {
        for (const r of g.shapeMeta[id].rows) allRows.add(r);
        for (const c of g.shapeMeta[id].cols) allCols.add(c);
      }

      const scs = unionShapes(g, ids);

      // Row fin check
      if (allRows.size === k + 1) {
        const rowCounts = new Map<number, number>();
        for (const ck of scs) {
          const r = Math.floor(ck / K);
          rowCounts.set(r, (rowCounts.get(r) || 0) + 1);
        }

        for (const [finRow, count] of rowCounts) {
          if (count === 1) {
            for (const ck of scs) {
              if (
                Math.floor(ck / K) === finRow &&
                g.board[finRow][ck % K] === "empty"
              ) {
                const remaining = new Set(rowCounts.keys());
                remaining.delete(finRow);
                if (remaining.size === k) {
                  g.board[finRow][ck % K] = "eliminated";
                  return true;
                }
              }
            }
          }
        }
      }

      // Column fin check
      if (allCols.size === k + 1) {
        const colCounts = new Map<number, number>();
        for (const ck of scs) {
          const c = ck % K;
          colCounts.set(c, (colCounts.get(c) || 0) + 1);
        }

        for (const [finCol, count] of colCounts) {
          if (count === 1) {
            for (const ck of scs) {
              if (ck % K === finCol) {
                const r = Math.floor(ck / K);
                if (g.board[r][finCol] === "empty") {
                  const remaining = new Set(colCounts.keys());
                  remaining.delete(finCol);
                  if (remaining.size === k) {
                    g.board[r][finCol] = "eliminated";
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
    return false;
  },
};

const r4_4: Rule = {
  name: "R4.4 Finned Overcounting",
  difficulty: "hard",
  apply: (g) => {
    const { size, shapes } = g.grid;
    const maxSub = Math.min(Math.floor(size / 2), 3);

    for (const { ids } of candidateSubsets(g, maxSub)) {
      const k = ids.length;
      const scs = unionShapes(g, ids);

      // Check rows: k-1 complete + 1 near-complete
      const rowMissing = new Map<number, Cell[]>();
      for (let r = 0; r < size; r++) {
        const missing: Cell[] = [];
        for (let c = 0; c < size; c++) {
          if (!scs.has(key(r, c))) missing.push({ row: r, col: c });
        }
        rowMissing.set(r, missing);
      }

      const completeRows = [...rowMissing.entries()]
        .filter(([, m]) => m.length === 0)
        .map(([r]) => r);
      const nearRows = [...rowMissing.entries()]
        .filter(([, m]) => m.length === 1)
        .map(([r]) => r);

      if (completeRows.length === k - 1 && nearRows.length >= 1) {
        for (const ncRow of nearRows) {
          const missing = rowMissing.get(ncRow)![0];
          if (scs.has(cellKey(missing))) continue;

          const validRows = new Set([...completeRows, ncRow]);
          for (const id of ids) {
            for (const c of shapes[id]) {
              if (!validRows.has(c.row) && g.board[c.row][c.col] === "empty") {
                g.board[c.row][c.col] = "eliminated";
                return true;
              }
            }
          }
        }
      }

      // Same for columns
      const colMissing = new Map<number, Cell[]>();
      for (let c = 0; c < size; c++) {
        const missing: Cell[] = [];
        for (let r = 0; r < size; r++) {
          if (!scs.has(key(r, c))) missing.push({ row: r, col: c });
        }
        colMissing.set(c, missing);
      }

      const completeCols = [...colMissing.entries()]
        .filter(([, m]) => m.length === 0)
        .map(([c]) => c);
      const nearCols = [...colMissing.entries()]
        .filter(([, m]) => m.length === 1)
        .map(([c]) => c);

      if (completeCols.length === k - 1 && nearCols.length >= 1) {
        for (const ncCol of nearCols) {
          const missing = colMissing.get(ncCol)![0];
          if (scs.has(cellKey(missing))) continue;

          const validCols = new Set([...completeCols, ncCol]);
          for (const id of ids) {
            for (const c of shapes[id]) {
              if (!validCols.has(c.col) && g.board[c.row][c.col] === "empty") {
                g.board[c.row][c.col] = "eliminated";
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  },
};

const r4_5: Rule = {
  name: "R4.5 Squeeze",
  difficulty: "hard",
  apply: (g) => {
    const { size } = g.grid;
    const S = g.starsPerContainer;
    const star2x2s = (g.starContaining2x2s ??= []);
    let changed = false;

    for (let i = 0; i < size - 1; i++) {
      // Adjacent rows
      const rowCells: Cell[] = [];
      for (let col = 0; col < size; col++) {
        rowCells.push({ row: i, col }, { row: i + 1, col });
      }
      const rowEmpty = rowCells.filter(
        (c) => g.board[c.row][c.col] === "empty"
      );

      if (rowEmpty.length > 0) {
        const tiling = computeTiling(rowEmpty, size, g.tilingCache);
        if (
          tiling.tiles.length === 2 * S &&
          tiling.uncoveredCells.length === 0
        ) {
          for (const tile of tiling.tiles) {
            const tk = tile
              .map(cellKey)
              .sort((a, b) => a - b)
              .join("|");
            if (
              !star2x2s.some(
                (t) =>
                  t
                    .map(cellKey)
                    .sort((a, b) => a - b)
                    .join("|") === tk
              )
            ) {
              star2x2s.push(tile);
              changed = true;
            }
          }
        }
      }

      // Adjacent columns
      const colCells: Cell[] = [];
      for (let row = 0; row < size; row++) {
        colCells.push({ row, col: i }, { row, col: i + 1 });
      }
      const colEmpty = colCells.filter(
        (c) => g.board[c.row][c.col] === "empty"
      );

      if (colEmpty.length > 0) {
        const tiling = computeTiling(colEmpty, size, g.tilingCache);
        if (
          tiling.tiles.length === 2 * S &&
          tiling.uncoveredCells.length === 0
        ) {
          for (const tile of tiling.tiles) {
            const tk = tile
              .map(cellKey)
              .sort((a, b) => a - b)
              .join("|");
            if (
              !star2x2s.some(
                (t) =>
                  t
                    .map(cellKey)
                    .sort((a, b) => a - b)
                    .join("|") === tk
              )
            ) {
              star2x2s.push(tile);
              changed = true;
            }
          }
        }
      }
    }
    return changed;
  },
};

// =============================================================================
// TIER 5: GEOMETRIC PATTERNS
// =============================================================================

const r5_1: Rule = {
  name: "R5.1 Kissing Ls",
  difficulty: "expert",
  apply: (g) => {
    const { size } = g.grid;
    const S = g.starsPerContainer;
    const star2x2s = (g.starContaining2x2s ??= []);
    const oneByNs = (g.oneByNs ??= []);

    for (let i = 0; i < star2x2s.length; i++) {
      for (let j = i + 1; j < star2x2s.length; j++) {
        const [A, B] = [star2x2s[i], star2x2s[j]];
        const hAdj =
          A[0].row === B[0].row && Math.abs(A[0].col - B[0].col) === 1;
        const vAdj =
          A[0].col === B[0].col && Math.abs(A[0].row - B[0].row) === 1;
        if (!hAdj && !vAdj) continue;

        const aEmpty = A.filter((c) => g.board[c.row][c.col] === "empty");
        const bEmpty = B.filter((c) => g.board[c.row][c.col] === "empty");
        if (
          aEmpty.length < 2 ||
          aEmpty.length > 3 ||
          bEmpty.length < 2 ||
          bEmpty.length > 3
        )
          continue;

        const checkDir = (dir: "row" | "col"): boolean => {
          const aVals = [...new Set(aEmpty.map((c) => c[dir]))];
          const bVals = [...new Set(bEmpty.map((c) => c[dir]))];
          const shared = aVals.filter((v) => bVals.includes(v));

          for (const v of shared) {
            let lineStars = 0;
            for (let x = 0; x < size; x++) {
              const r = dir === "row" ? v : x;
              const c = dir === "row" ? x : v;
              if (g.board[r][c] === "star") lineStars++;
            }
            const committed = oneByNs
              .filter((m) => m[dir] === v)
              .reduce((s, m) => s + m.min, 0);

            if (lineStars + committed + 2 > S) {
              const aIn = aEmpty.filter((c) => c[dir] === v);
              const bIn = bEmpty.filter((c) => c[dir] === v);
              const aOut = aEmpty.filter((c) => c[dir] !== v);
              const bOut = bEmpty.filter((c) => c[dir] !== v);

              if (aIn.length === aEmpty.length && bOut.length > 0) {
                for (const c of bIn) g.board[c.row][c.col] = "eliminated";
                return true;
              }
              if (bIn.length === bEmpty.length && aOut.length > 0) {
                for (const c of aIn) g.board[c.row][c.col] = "eliminated";
                return true;
              }
            }
          }
          return false;
        };

        if (hAdj && checkDir("row")) return true;
        if (vAdj && checkDir("col")) return true;
      }
    }
    return false;
  },
};

const r5_2: Rule = {
  name: "R5.2 The M",
  difficulty: "expert",
  apply: (g) => {
    const { size } = g.grid;
    for (let r = 0; r < size - 1; r++) {
      for (let c = 1; c < size - 1; c++) {
        // M shape: two cells on top row, three on bottom
        const cells = [
          [r, c - 1],
          [r, c + 1],
          [r + 1, c - 1],
          [r + 1, c],
          [r + 1, c + 1],
        ] as const;

        let stars = 0;
        const empty: Cell[] = [];
        for (const [row, col] of cells) {
          if (g.board[row][col] === "star") stars++;
          else if (g.board[row][col] === "empty") empty.push({ row, col });
        }

        if (stars >= 2 && empty.length > 0) {
          for (const cell of empty) g.board[cell.row][cell.col] = "eliminated";
          return true;
        }
      }
    }
    return false;
  },
};

const r5_3: Rule = {
  name: "R5.3 Pressured T",
  difficulty: "expert",
  apply: () => false, // TODO: Not implemented
};

const r5_4: Rule = {
  name: "R5.4 Fish",
  difficulty: "expert",
  apply: (g) => {
    const { size } = g.grid;
    const indices = Array.from({ length: size }, (_, i) => i);

    for (let fishSize = 2; fishSize <= Math.min(4, size); fishSize++) {
      // Column-based fish
      for (const cols of subsetsOfSize(indices, fishSize)) {
        const rowSets = cols.map((c) => {
          const rows = new Set<number>();
          for (let r = 0; r < size; r++) {
            if (g.board[r][c] === "empty") rows.add(r);
          }
          return rows;
        });
        const union = new Set(rowSets.flatMap((s) => [...s]));

        if (
          union.size === fishSize &&
          rowSets.every((s) => s.size >= 1 && s.size <= fishSize)
        ) {
          const colSet = new Set(cols);
          let changed = false;
          for (const row of union) {
            for (let col = 0; col < size; col++) {
              if (!colSet.has(col) && g.board[row][col] === "empty") {
                g.board[row][col] = "eliminated";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }

      // Row-based fish
      for (const rows of subsetsOfSize(indices, fishSize)) {
        const colSets = rows.map((r) => {
          const cols = new Set<number>();
          for (let c = 0; c < size; c++) {
            if (g.board[r][c] === "empty") cols.add(c);
          }
          return cols;
        });
        const union = new Set(colSets.flatMap((s) => [...s]));

        if (
          union.size === fishSize &&
          colSets.every((s) => s.size >= 1 && s.size <= fishSize)
        ) {
          const rowSet = new Set(rows);
          let changed = false;
          for (const col of union) {
            for (let row = 0; row < size; row++) {
              if (!rowSet.has(row) && g.board[row][col] === "empty") {
                g.board[row][col] = "eliminated";
                changed = true;
              }
            }
          }
          if (changed) return true;
        }
      }
    }
    return false;
  },
};

const r5_5: Rule = {
  name: "R5.5 Finned Fish",
  difficulty: "expert",
  apply: (g) => {
    const { size } = g.grid;
    const indices = Array.from({ length: size }, (_, i) => i);

    for (let fishSize = 2; fishSize <= Math.min(4, size); fishSize++) {
      // Column-based finned fish
      for (const cols of subsetsOfSize(indices, fishSize)) {
        const rowSets = cols.map((c) => {
          const rows = new Set<number>();
          for (let r = 0; r < size; r++) {
            if (g.board[r][c] === "empty") rows.add(r);
          }
          return rows;
        });
        const union = new Set(rowSets.flatMap((s) => [...s]));

        if (union.size === fishSize + 1) {
          const finnedIdx = rowSets.findIndex((s) => s.size === fishSize + 1);
          if (
            finnedIdx !== -1 &&
            rowSets.every((s, i) => i === finnedIdx || s.size <= fishSize)
          ) {
            const baseRows = new Set(
              rowSets.filter((_, i) => i !== finnedIdx).flatMap((s) => [...s])
            );
            if (baseRows.size === fishSize) {
              const finRow = [...rowSets[finnedIdx]].find(
                (r) => !baseRows.has(r)
              );
              if (
                finRow !== undefined &&
                g.board[finRow][cols[finnedIdx]] === "empty"
              ) {
                g.board[finRow][cols[finnedIdx]] = "eliminated";
                return true;
              }
            }
          }
        }
      }

      // Row-based finned fish
      for (const rows of subsetsOfSize(indices, fishSize)) {
        const colSets = rows.map((r) => {
          const cols = new Set<number>();
          for (let c = 0; c < size; c++) {
            if (g.board[r][c] === "empty") cols.add(c);
          }
          return cols;
        });
        const union = new Set(colSets.flatMap((s) => [...s]));

        if (union.size === fishSize + 1) {
          const finnedIdx = colSets.findIndex((s) => s.size === fishSize + 1);
          if (
            finnedIdx !== -1 &&
            colSets.every((s, i) => i === finnedIdx || s.size <= fishSize)
          ) {
            const baseCols = new Set(
              colSets.filter((_, i) => i !== finnedIdx).flatMap((s) => [...s])
            );
            if (baseCols.size === fishSize) {
              const finCol = [...colSets[finnedIdx]].find(
                (c) => !baseCols.has(c)
              );
              if (
                finCol !== undefined &&
                g.board[rows[finnedIdx]][finCol] === "empty"
              ) {
                g.board[rows[finnedIdx]][finCol] = "eliminated";
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  },
};

const r5_6: Rule = {
  name: "R5.6 N-Rooks",
  difficulty: "expert",
  apply: (g) => {
    const { size } = g.grid;
    const S = g.starsPerContainer;
    if (size !== 4 * S + 2) return false;

    const metaSize = 2 * S + 1;
    const star2x2s = (g.starContaining2x2s ??= []);

    // Build meta-grid where each cell is a 2x2 block
    const meta: ("unknown" | "has_star" | "empty")[][] = [];
    for (let mr = 0; mr < metaSize; mr++) {
      meta[mr] = [];
      for (let mc = 0; mc < metaSize; mc++) {
        const block = [
          { row: mr * 2, col: mc * 2 },
          { row: mr * 2, col: mc * 2 + 1 },
          { row: mr * 2 + 1, col: mc * 2 },
          { row: mr * 2 + 1, col: mc * 2 + 1 },
        ];

        if (block.some((c) => g.board[c.row][c.col] === "star")) {
          meta[mr][mc] = "has_star";
        } else {
          const bk = block
            .map(cellKey)
            .sort((a, b) => a - b)
            .join("|");
          const isMarked = star2x2s.some(
            (t) =>
              t
                .map(cellKey)
                .sort((a, b) => a - b)
                .join("|") === bk
          );
          meta[mr][mc] = isMarked
            ? "has_star"
            : block.every((c) => g.board[c.row][c.col] === "eliminated")
            ? "empty"
            : "unknown";
        }
      }
    }

    // Count stars per meta-row/col
    const rowStars = meta.map(
      (row) => row.filter((c) => c === "has_star").length
    );
    const colStars = Array.from(
      { length: metaSize },
      (_, mc) => meta.filter((row) => row[mc] === "has_star").length
    );

    // If a meta-row/col has metaSize-1 stars, eliminate the unknown block
    for (let mr = 0; mr < metaSize; mr++) {
      if (rowStars[mr] === metaSize - 1) {
        for (let mc = 0; mc < metaSize; mc++) {
          if (meta[mr][mc] === "unknown") {
            let changed = false;
            for (const [dr, dc] of [
              [0, 0],
              [0, 1],
              [1, 0],
              [1, 1],
            ]) {
              if (g.board[mr * 2 + dr][mc * 2 + dc] === "empty") {
                g.board[mr * 2 + dr][mc * 2 + dc] = "eliminated";
                changed = true;
              }
            }
            if (changed) return true;
          }
        }
      }
    }

    for (let mc = 0; mc < metaSize; mc++) {
      if (colStars[mc] === metaSize - 1) {
        for (let mr = 0; mr < metaSize; mr++) {
          if (meta[mr][mc] === "unknown") {
            let changed = false;
            for (const [dr, dc] of [
              [0, 0],
              [0, 1],
              [1, 0],
              [1, 1],
            ]) {
              if (g.board[mr * 2 + dr][mc * 2 + dc] === "empty") {
                g.board[mr * 2 + dr][mc * 2 + dc] = "eliminated";
                changed = true;
              }
            }
            if (changed) return true;
          }
        }
      }
    }

    return false;
  },
};

// =============================================================================
// TIER 6: UNIQUENESS
// =============================================================================

const r6_1: Rule = {
  name: "R6.1 By a Thread",
  difficulty: "expert",
  apply: (g) => {
    const S = g.starsPerContainer;

    for (const region of findIsolatedRegions(g)) {
      if (region.threads.length !== 1) continue;

      // Check if region is entirely within one shape
      const shapeIds = new Set(
        region.cells.map((c) => g.shapeMap[c.row][c.col])
      );
      if (shapeIds.size !== 1) continue;

      const shapeId = [...shapeIds][0];
      const shape = g.grid.shapes[shapeId];
      const stars = shape.filter(
        (c) => g.board[c.row][c.col] === "star"
      ).length;
      const needed = S - stars;

      if (
        needed > 0 &&
        region.cells.every((c) =>
          shape.some((sc) => sc.row === c.row && sc.col === c.col)
        )
      ) {
        const configs = findValidConfigs(region.cells, needed);
        if (configs.length === 2) {
          g.board[region.threads[0].row][region.threads[0].col] = "star";
          return true;
        }
      }
    }
    return false;
  },
};

const r6_2: Rule = {
  name: "R6.2 At Sea",
  difficulty: "expert",
  apply: (g) => {
    const { size } = g.grid;
    const S = g.starsPerContainer;

    for (const region of findIsolatedRegions(g)) {
      if (region.threads.length !== 0) continue;

      const shapeIds = new Set(
        region.cells.map((c) => g.shapeMap[c.row][c.col])
      );
      if (shapeIds.size !== 1) continue;

      const shapeId = [...shapeIds][0];
      const shape = g.grid.shapes[shapeId];
      const stars = shape.filter(
        (c) => g.board[c.row][c.col] === "star"
      ).length;
      const needed = S - stars;
      if (needed <= 0) continue;

      const configs = findValidConfigs(region.cells, needed);
      if (configs.length !== 2) continue;

      const [c1, c2] = configs;
      const cols1 = new Set(c1.map((c) => c.col));
      const cols2 = new Set(c2.map((c) => c.col));

      if (cols1.size === needed && cols2.size === needed) {
        // Prefer configuration closer to center
        const center = Math.floor(size / 2);
        const d1 = [...cols1].reduce((s, c) => s + Math.abs(c - center), 0);
        const d2 = [...cols2].reduce((s, c) => s + Math.abs(c - center), 0);
        const [chosen, other] = d1 <= d2 ? [c1, c2] : [c2, c1];
        const chosenSet = new Set(chosen.map(cellKey));

        for (const cell of other) {
          if (
            !chosenSet.has(cellKey(cell)) &&
            g.board[cell.row][cell.col] === "empty"
          ) {
            g.board[cell.row][cell.col] = "eliminated";
            return true;
          }
        }
      }
    }
    return false;
  },
};

const r6_3: Rule = {
  name: "R6.3 Thread at Sea",
  difficulty: "expert",
  apply: (g) => {
    const S = g.starsPerContainer;

    for (const region of findIsolatedRegions(g)) {
      if (region.threads.length !== 1) continue;

      const shapeIds = new Set(
        region.cells.map((c) => g.shapeMap[c.row][c.col])
      );
      if (shapeIds.size !== 1) continue;

      const shapeId = [...shapeIds][0];
      const shape = g.grid.shapes[shapeId];
      const stars = shape.filter(
        (c) => g.board[c.row][c.col] === "star"
      ).length;
      const needed = S - stars;
      if (needed <= 0) continue;

      const configs = findValidConfigs(region.cells, needed);
      if (configs.length < 2) continue;

      const thread = region.threads[0];
      let invalidated = 0;
      for (const config of configs) {
        if (
          config.some(
            (star) =>
              Math.abs(star.row - thread.row) <= 1 &&
              Math.abs(star.col - thread.col) <= 1
          )
        ) {
          invalidated++;
        }
      }

      if (configs.length - invalidated === 1 && invalidated >= 1) {
        g.board[thread.row][thread.col] = "star";
        return true;
      }
    }
    return false;
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export const allRules: Rule[] = [
  r1_1,
  r1_2,
  r1_3,
  r1_4,
  r1_5,
  r1_6,
  r1_7,
  r2_1,
  r2_2,
  r2_3,
  r2_4,
  r3_1,
  r3_2,
  r3_3,
  r3_4,
  r4_1,
  r4_2,
  r4_3,
  r4_4,
  r4_5,
  r5_1,
  r5_2,
  r5_3,
  r5_4,
  r5_5,
  r5_6,
  r6_1,
  r6_2,
  r6_3,
];
