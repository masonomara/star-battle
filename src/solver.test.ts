import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const _req = createRequire(import.meta.url);
const wasm = _req("../pkg/dlx.js") as {
  solve_board(gridFlat: Int32Array, size: number, stars: number): Int32Array;
  layout_with_seed(size: number, stars: number, seed: number): Int32Array;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function packGrid(rows: number[][]): Int32Array {
  const sz = rows.length;
  const flat = new Int32Array(sz * sz);
  for (let r = 0; r < sz; r++)
    for (let c = 0; c < sz; c++)
      flat[r * sz + c] = rows[r][c];
  return flat;
}

type SolveResult =
  | { solved: false }
  | { solved: true; maxLevel: number; cycles: number; cells: number[][] };

function decodeSolve(flat: Int32Array, size: number): SolveResult {
  if (flat[0] !== 1) return { solved: false };
  const cells: number[][] = [];
  for (let r = 0; r < size; r++) {
    cells.push([]);
    for (let c = 0; c < size; c++) cells[r].push(flat[3 + r * size + c]);
  }
  return { solved: true, maxLevel: flat[1], cycles: flat[2], cells };
}

function validateSolution(
  grid: Int32Array,
  cells: number[][],
  size: number,
  stars: number,
): string | null {
  // Row counts
  for (let r = 0; r < size; r++) {
    const n = cells[r].filter((v) => v === 1).length;
    if (n !== stars) return `row ${r}: expected ${stars} stars, got ${n}`;
  }
  // Column counts
  for (let c = 0; c < size; c++) {
    const n = cells.map((row) => row[c]).filter((v) => v === 1).length;
    if (n !== stars) return `col ${c}: expected ${stars} stars, got ${n}`;
  }
  // Region counts
  const regionStars = new Map<number, number>();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (cells[r][c] === 1) {
        const id = grid[r * size + c];
        regionStars.set(id, (regionStars.get(id) ?? 0) + 1);
      }
  for (let id = 0; id < size; id++) {
    const n = regionStars.get(id) ?? 0;
    if (n !== stars) return `region ${id}: expected ${stars} stars, got ${n}`;
  }
  // No adjacent stars
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (cells[r][c] === 1)
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size)
              if (cells[nr][nc] === 1) return `stars at (${r},${c}) and (${nr},${nc}) are adjacent`;
          }
  return null;
}

function solveGenerated(size: number, stars: number, seed: number): SolveResult {
  const grid = wasm.layout_with_seed(size, stars, seed);
  return decodeSolve(wasm.solve_board(grid, size, stars), size);
}

// ── solve_board: invalid board rejection ─────────────────────────────────────

describe("solve_board: invalid board rejection", () => {
  it("rejects a 4×4 board with only 2 regions (needs 4)", () => {
    // mirrors the old tilingForced.test.ts boards which were invalid puzzles
    const grid = packGrid([
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]);
    const result = wasm.solve_board(grid, 4, 1);
    expect(result[0]).toBe(0);
  });

  it("rejects a 4×4 board whose first region is too small for stars=2", () => {
    // region 0 has 2 cells; min size for stars=2 is 3
    const grid = packGrid([
      [0, 0, 1, 2],
      [3, 3, 1, 2],
      [3, 3, 1, 2],
      [3, 3, 3, 2],
    ]);
    const result = wasm.solve_board(grid, 4, 2);
    expect(result[0]).toBe(0);
  });

  it("rejects an empty (0×0) board", () => {
    const result = wasm.solve_board(new Int32Array(0), 0, 1);
    expect(result[0]).toBe(0);
  });

  it("rejects an ambiguous board with no unique solution (stripe regions)", () => {
    // 4 row-stripe regions, 4×4, stars=1 — many solutions, solver gets stuck
    const grid = packGrid([
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [3, 3, 3, 3],
    ]);
    const result = wasm.solve_board(grid, 4, 1);
    expect(result[0]).toBe(0);
  });
});

// ── solve_board: known boards with expected solutions ─────────────────────────

describe("solve_board: known solvable boards", () => {
  it("solves 6×1 seed=5 (maxLevel=3, trivial rules only)", () => {
    // Grid: [[5,1,1,1,3,3],[5,5,5,0,3,3],[5,5,5,3,3,3],[5,5,2,2,2,2],[5,5,5,2,2,2],[5,5,5,4,4,4]]
    const result = solveGenerated(6, 1, 5);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(3);
    expect(result.cycles).toBe(15);
  });

  it("solves 6×1 seed=11 (maxLevel=5, requires tiling rules)", () => {
    const result = solveGenerated(6, 1, 11);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(5);
    expect(result.cycles).toBe(15);
  });

  it("solves 8×2 seed=2349 (maxLevel=4, tiling level)", () => {
    const result = solveGenerated(8, 2, 2349);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(4);
  });

  it("solves 8×2 seed=9721 (maxLevel=7, counting level)", () => {
    const result = solveGenerated(8, 2, 9721);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(7);
  });

  it("solves 10×2 seed=2425 (maxLevel=8)", () => {
    const result = solveGenerated(10, 2, 2425);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(8);
  });

  it("solves 10×2 seed=1755 (maxLevel=11, hardest rules)", () => {
    const result = solveGenerated(10, 2, 1755);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(11);
  });

  it("solves a known 10×2 puzzle string (maxLevel=5, cycles=46)", () => {
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const layout = "AAAABBBBBCDDDDBEEBBCDDDDBECBCCDDBBBECCCCDDBBBEFCCCDDGGFFFGGCDDGGFGGGGCHGGGGGGGICHGGJJJJGIIHGIIIIIIII";
    const size = 10;
    const stars = 2;
    const grid = new Int32Array(size * size);
    for (let i = 0; i < size * size; i++) grid[i] = LETTERS.indexOf(layout[i]);
    const flat = wasm.solve_board(grid, size, stars);
    const result = decodeSolve(flat, size);
    expect(result.solved).toBe(true);
    if (!result.solved) return;
    expect(result.maxLevel).toBe(5);
    expect(result.cycles).toBe(46);
  });
});

// ── solve_board: exact star positions (regression) ───────────────────────────

describe("solve_board: exact star positions", () => {
  it("6×1 seed=5 places stars at known coordinates", () => {
    // Reference solution recorded from a verified run
    const expectedStars = [[0, 1], [1, 3], [2, 5], [3, 2], [4, 0], [5, 4]];
    const size = 6;
    const grid = wasm.layout_with_seed(size, 1, 5);
    const flat = wasm.solve_board(grid, size, 1);
    expect(flat[0]).toBe(1);

    const actual: number[][] = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (flat[3 + r * size + c] === 1) actual.push([r, c]);

    expect(actual).toEqual(expectedStars);
  });
});

// ── solve_board: solution validity ───────────────────────────────────────────

describe("solve_board: solution validity", () => {
  const cases: [string, number, number, number][] = [
    ["6×1 seed=5",    6, 1,    5],
    ["6×1 seed=11",   6, 1,   11],
    ["8×2 seed=2349", 8, 2, 2349],
    ["8×2 seed=9721", 8, 2, 9721],
    ["10×2 seed=2425", 10, 2, 2425],
  ];

  for (const [label, size, stars, seed] of cases) {
    it(`${label}: correct star counts per row/col/region and no adjacent stars`, () => {
      const grid = wasm.layout_with_seed(size, stars, seed);
      const flat = wasm.solve_board(grid, size, stars);
      expect(flat[0]).toBe(1);
      const result = decodeSolve(flat, size);
      if (!result.solved) return;
      const err = validateSolution(grid, result.cells, size, stars);
      expect(err).toBeNull();
    });
  }
});

// ── solve_board: difficulty / maxLevel properties ─────────────────────────────

describe("solve_board: difficulty properties", () => {
  it("trivial board (seed=5, 6×1) has maxLevel ≤ 3", () => {
    const r = solveGenerated(6, 1, 5);
    expect(r.solved).toBe(true);
    if (r.solved) expect(r.maxLevel).toBeLessThanOrEqual(3);
  });

  it("harder board (seed=1755, 10×2) has maxLevel > 3", () => {
    const r = solveGenerated(10, 2, 1755);
    expect(r.solved).toBe(true);
    if (r.solved) expect(r.maxLevel).toBeGreaterThan(3);
  });

  it("cycles is a positive integer for any solvable board", () => {
    const r = solveGenerated(6, 1, 5);
    expect(r.solved).toBe(true);
    if (r.solved) {
      expect(r.cycles).toBeGreaterThan(0);
      expect(Number.isInteger(r.cycles)).toBe(true);
    }
  });

  it("maxLevel is in range 1–11 for all solvable boards", () => {
    const seeds: [number, number, number][] = [
      [6, 1, 5], [6, 1, 11], [8, 2, 2349], [10, 2, 2425], [10, 2, 1755],
    ];
    for (const [size, stars, seed] of seeds) {
      const r = solveGenerated(size, stars, seed);
      expect(r.solved).toBe(true);
      if (r.solved) {
        expect(r.maxLevel).toBeGreaterThanOrEqual(1);
        expect(r.maxLevel).toBeLessThanOrEqual(11);
      }
    }
  });
});

// ── layout_with_seed ──────────────────────────────────────────────────────────

describe("layout_with_seed", () => {
  it("returns flat grid of length size×size", () => {
    const grid = wasm.layout_with_seed(8, 2, 853);
    expect(grid.length).toBe(64);
  });

  it("grid has exactly size distinct region IDs (0 through size-1)", () => {
    const size = 8;
    const grid = wasm.layout_with_seed(size, 2, 853);
    const ids = new Set(Array.from(grid));
    expect(ids.size).toBe(size);
    for (let i = 0; i < size; i++) expect(ids.has(i)).toBe(true);
  });

  it("each region has at least 2*stars-1 cells", () => {
    const size = 8;
    const stars = 2;
    const minSize = 2 * stars - 1;
    const grid = wasm.layout_with_seed(size, stars, 853);
    const counts = new Map<number, number>();
    for (const id of Array.from(grid)) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [, count] of counts) expect(count).toBeGreaterThanOrEqual(minSize);
  });

  it("returns empty array for size=0 or stars=0", () => {
    expect(wasm.layout_with_seed(0, 1, 0).length).toBe(0);
    expect(wasm.layout_with_seed(6, 0, 0).length).toBe(0);
  });

  it("produces the same layout for the same seed (deterministic)", () => {
    const a = wasm.layout_with_seed(8, 2, 853);
    const b = wasm.layout_with_seed(8, 2, 853);
    expect(Array.from(a)).toEqual(Array.from(b));
  });
});
