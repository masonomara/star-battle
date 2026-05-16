use wasm_bindgen::prelude::*;
use std::collections::HashSet;

// Flat SOA DLX. All "pointers" are u32 indices into parallel Vec<u32> arrays.
//
// Node layout:
//   0              = root (horizontal sentinel)
//   1..=np         = primary column headers  (chained through root)
//   np+1..=np+ns   = secondary column headers (self-linked, never in root's ring)
//   np+ns+1..      = data nodes
//
// Secondary columns are excluded from root's horizontal ring. Covering them is
// a horizontal no-op (they're already self-linked), but their vertical cover/
// uncover still removes their rows from other columns' lists.
struct Dlx {
    left:        Vec<u32>,
    right:       Vec<u32>,
    up:          Vec<u32>,
    down:        Vec<u32>,
    col:         Vec<u32>, // owning column header index; col[h] = h for headers
    row_id:      Vec<i32>, // -1 for headers, >= 0 for data nodes
    size:        Vec<u32>, // live data-node count; only meaningful for column headers
    num_primary: u32,
}

impl Dlx {
    fn build(
        num_primary:   u32,
        num_secondary: u32,
        rows_flat:     &[i32],
        row_offsets:   &[i32],
    ) -> Self {
        let num_cols = num_primary + num_secondary;
        let total    = 1 + num_cols as usize + rows_flat.len();

        let mut d = Dlx {
            left:        vec![0u32; total],
            right:       vec![0u32; total],
            up:          vec![0u32; total],
            down:        vec![0u32; total],
            col:         vec![0u32; total],
            row_id:      vec![-1i32; total],
            size:        vec![0u32; total],
            num_primary,
        };

        // Root ↔ primary columns ring
        d.right[0] = if num_primary > 0 { 1 } else { 0 };
        d.left[0]  = if num_primary > 0 { num_primary } else { 0 };

        for i in 1..=(num_cols as usize) {
            let ui = i as u32;
            d.up[i]  = ui;
            d.down[i] = ui;
            d.col[i]  = ui;
            if i as u32 <= num_primary {
                d.left[i]  = if i == 1 { 0 } else { ui - 1 };
                d.right[i] = if ui == num_primary { 0 } else { ui + 1 };
            } else {
                d.left[i]  = ui;
                d.right[i] = ui;
            }
        }

        // Data nodes
        let mut node    = (1 + num_cols) as usize;
        let num_rows    = row_offsets.len().saturating_sub(1);

        for row in 0..num_rows {
            let start = row_offsets[row]     as usize;
            let end   = row_offsets[row + 1] as usize;
            if start == end { continue; }

            let first_node = node as u32;
            let mut prev   = 0u32;

            for k in start..end {
                let h  = (rows_flat[k] as u32) + 1; // 0-based col → 1-based header
                let ni = node as u32;

                // Vertical: insert ni at the bottom of column h
                let col_up = d.up[h as usize];
                d.up[ni as usize]        = col_up;
                d.down[ni as usize]      = h;
                d.down[col_up as usize]  = ni;
                d.up[h as usize]         = ni;
                d.size[h as usize]      += 1;

                d.col[ni as usize]    = h;
                d.row_id[ni as usize] = row as i32;

                // Horizontal: build circular ring for this row
                if k == start {
                    d.left[ni as usize]  = ni;
                    d.right[ni as usize] = ni;
                } else {
                    d.left[ni as usize]          = prev;
                    d.right[ni as usize]         = first_node;
                    d.right[prev as usize]       = ni;
                    d.left[first_node as usize]  = ni;
                }
                prev = ni;
                node += 1;
            }
        }

        d
    }

    #[inline(always)]
    fn is_primary(&self, c: u32) -> bool {
        c >= 1 && c <= self.num_primary
    }

    fn cover(&mut self, c: u32) {
        let c = c as usize;
        // Remove c from root's horizontal ring
        let cl = self.left[c];
        let cr = self.right[c];
        self.right[cl as usize] = cr;
        self.left[cr as usize]  = cl;

        // For each row in this column, unlink those row-nodes from their columns
        let mut row = self.down[c] as usize;
        while row != c {
            let mut node = self.right[row] as usize;
            while node != row {
                // Capture both neighbors before any write
                let u  = self.up[node];
                let dn = self.down[node];
                self.down[u as usize]  = dn;
                self.up[dn as usize]   = u;
                let nc = self.col[node];
                if self.is_primary(nc) {
                    self.size[nc as usize] -= 1;
                }
                node = self.right[node] as usize;
            }
            row = self.down[row] as usize;
        }
    }

    fn uncover(&mut self, c: u32) {
        let c = c as usize;
        // Restore row-nodes in reverse order
        let mut row = self.up[c] as usize;
        while row != c {
            let mut node = self.left[row] as usize;
            while node != row {
                let u  = self.up[node];
                let dn = self.down[node];
                self.down[u as usize]  = node as u32;
                self.up[dn as usize]   = node as u32;
                let nc = self.col[node];
                if self.is_primary(nc) {
                    self.size[nc as usize] += 1;
                }
                node = self.left[node] as usize;
            }
            row = self.up[row] as usize;
        }
        // Restore c in root's horizontal ring
        let cl = self.left[c];
        let cr = self.right[c];
        self.right[cl as usize] = c as u32;
        self.left[cr as usize]  = c as u32;
    }

    fn search(
        &mut self,
        sol:      &mut Vec<i32>,
        solutions: &mut Vec<Vec<i32>>,
        min_len:   &mut usize,
    ) {
        if sol.len() >= *min_len {
            return;
        }

        // All primary columns covered → found a solution
        if self.right[0] == 0 {
            if sol.len() < *min_len {
                solutions.clear();
                *min_len = sol.len();
            }
            solutions.push(sol.clone());
            return;
        }

        // S-heuristic: choose primary column with fewest live rows
        let mut best    = 0u32;
        let mut best_sz = u32::MAX;
        let mut c = self.right[0];
        while c != 0 {
            let sz = self.size[c as usize];
            if sz < best_sz {
                best_sz = sz;
                best    = c;
                if sz == 0 { break; } // dead end — prune immediately
            }
            c = self.right[c as usize];
        }

        if best_sz == 0 {
            return;
        }

        self.cover(best);

        let mut row = self.down[best as usize];
        while row != best {
            sol.push(self.row_id[row as usize]);

            // Cover every other column in this row
            let mut node = self.right[row as usize];
            while node != row {
                self.cover(self.col[node as usize]);
                node = self.right[node as usize];
            }

            self.search(sol, solutions, min_len);

            // Uncover in reverse
            let mut node = self.left[row as usize];
            while node != row {
                self.uncover(self.col[node as usize]);
                node = self.left[node as usize];
            }
            sol.pop();

            row = self.down[row as usize];
        }

        self.uncover(best);
    }
}

/// Exact-cover solver matching the TypeScript `dlxSolve` contract.
///
/// `rows_flat`   – all column indices from every row, concatenated (0-based).
/// `row_offsets` – row i spans rows_flat[row_offsets[i]..row_offsets[i+1]];
///                 length must be rows.length + 1.
///
/// Returns solutions flattened as row-index runs, each terminated by -1.
/// Empty result slice means no solutions exist.
#[wasm_bindgen]
pub fn dlx_solve(
    num_primary:   u32,
    num_secondary: u32,
    rows_flat:     &[i32],
    row_offsets:   &[i32],
) -> Vec<i32> {
    if row_offsets.len() < 2 {
        return Vec::new();
    }

    let mut dlx = Dlx::build(num_primary, num_secondary, rows_flat, row_offsets);
    let mut sol       = Vec::new();
    let mut solutions: Vec<Vec<i32>> = Vec::new();
    let mut min_len   = usize::MAX;

    dlx.search(&mut sol, &mut solutions, &mut min_len);

    let mut result = Vec::new();
    for s in &solutions {
        result.extend_from_slice(s);
        result.push(-1);
    }
    result
}

// ── Generator ─────────────────────────────────────────────────────────────────

const DIRS: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];

// LCG matching TypeScript exactly:
//   s = (Math.imul(s, 1103515245) + 12345) | 0
//   return (s >>> 0) / 0x100000000
#[inline(always)]
fn rng_next(s: &mut i32) -> f64 {
    *s = s.wrapping_mul(1103515245i32).wrapping_add(12345);
    (*s as u32) as f64 / 4294967296.0
}

#[inline(always)]
fn rng_idx(s: &mut i32, n: usize) -> usize {
    (rng_next(s) * n as f64) as usize
}

fn unfilled_neighbor_keys(grid: &[i32], size: usize, r: usize, c: usize) -> Vec<u32> {
    let mut out = Vec::with_capacity(4);
    for (dr, dc) in DIRS {
        let nr = r as i32 + dr;
        let nc = c as i32 + dc;
        if nr >= 0 && nr < size as i32 && nc >= 0 && nc < size as i32 {
            let idx = nr as usize * size + nc as usize;
            if grid[idx] == -1 { out.push(idx as u32); }
        }
    }
    out
}

fn filled_neighbors(grid: &[i32], size: usize, r: usize, c: usize) -> Vec<(usize, usize)> {
    let mut out = Vec::with_capacity(4);
    for (dr, dc) in DIRS {
        let nr = r as i32 + dr;
        let nc = c as i32 + dc;
        if nr >= 0 && nr < size as i32 && nc >= 0 && nc < size as i32 {
            let (nr, nc) = (nr as usize, nc as usize);
            if grid[nr * size + nc] != -1 { out.push((nr, nc)); }
        }
    }
    out
}

fn grow_regions_balanced(
    grid:         &mut Vec<i32>,
    size:         usize,
    min_size:     usize,
    region_sizes: &mut Vec<usize>,
    frontiers:    &mut Vec<HashSet<u32>>,
    s:            &mut i32,
) {
    while region_sizes.iter().any(|&sz| sz < min_size) {
        let mut needs_growth: Vec<usize> = Vec::new();
        for id in 0..size {
            if region_sizes[id] < min_size {
                let g = &*grid;
                frontiers[id].retain(|&k| g[k as usize] == -1);
                if !frontiers[id].is_empty() { needs_growth.push(id); }
            }
        }
        if needs_growth.is_empty() { break; }

        let region_id = needs_growth[rng_idx(s, needs_growth.len())];

        let keys: Vec<u32> = frontiers[region_id].iter().copied().collect();
        let key = keys[rng_idx(s, keys.len())];
        frontiers[region_id].remove(&key);

        let r = key as usize / size;
        let c = key as usize % size;
        if grid[r * size + c] != -1 { continue; }

        grid[r * size + c] = region_id as i32;
        region_sizes[region_id] += 1;

        for nk in unfilled_neighbor_keys(grid, size, r, c) {
            frontiers[region_id].insert(nk);
        }
    }
}

fn fill_remaining(grid: &mut Vec<i32>, size: usize, s: &mut i32) -> bool {
    let mut frontier: Vec<u32>     = Vec::new();
    let mut in_frontier: Vec<bool> = vec![false; size * size];

    for r in 0..size {
        for c in 0..size {
            let idx = r * size + c;
            if grid[idx] != -1 { continue; }
            let has_filled = DIRS.iter().any(|(dr, dc)| {
                let nr = r as i32 + dr;
                let nc = c as i32 + dc;
                nr >= 0 && nr < size as i32 && nc >= 0 && nc < size as i32
                    && grid[nr as usize * size + nc as usize] != -1
            });
            if has_filled {
                frontier.push(idx as u32);
                in_frontier[idx] = true;
            }
        }
    }

    while !frontier.is_empty() {
        let i   = rng_idx(s, frontier.len());
        let key = frontier[i];
        let last = *frontier.last().unwrap();
        frontier[i] = last;
        frontier.pop();
        in_frontier[key as usize] = false;

        let r = key as usize / size;
        let c = key as usize % size;

        let filled = filled_neighbors(grid, size, r, c);
        if filled.is_empty() { return false; }
        let (nr, nc) = filled[rng_idx(s, filled.len())];
        grid[r * size + c] = grid[nr * size + nc];

        for (dr, dc) in DIRS {
            let nnr = r as i32 + dr;
            let nnc = c as i32 + dc;
            if nnr >= 0 && nnr < size as i32 && nnc >= 0 && nnc < size as i32 {
                let nidx = nnr as usize * size + nnc as usize;
                if grid[nidx] == -1 && !in_frontier[nidx] {
                    frontier.push(nidx as u32);
                    in_frontier[nidx] = true;
                }
            }
        }
    }

    grid.iter().all(|&v| v != -1)
}

/// Generate a board layout for the given seed.
/// Returns flat row-major Int32Array of length size×size, or empty on failure.
#[wasm_bindgen]
pub fn layout_with_seed(size: u32, stars: u32, seed: i32) -> Vec<i32> {
    if size == 0 || stars == 0 { return Vec::new(); }
    let size = size as usize;
    let mut s = seed;

    let mut grid = vec![-1i32; size * size];

    let mut placed = 0usize;
    while placed < size {
        let row = rng_idx(&mut s, size);
        let col = rng_idx(&mut s, size);
        let idx = row * size + col;
        if grid[idx] == -1 { grid[idx] = placed as i32; placed += 1; }
    }

    let min_size = (stars * 2 - 1) as usize;
    let mut region_sizes = vec![1usize; size];

    let mut frontiers: Vec<HashSet<u32>> = vec![HashSet::new(); size];
    for r in 0..size {
        for c in 0..size {
            let v = grid[r * size + c];
            if v != -1 {
                for k in unfilled_neighbor_keys(&grid, size, r, c) {
                    frontiers[v as usize].insert(k);
                }
            }
        }
    }

    grow_regions_balanced(&mut grid, size, min_size, &mut region_sizes, &mut frontiers, &mut s);

    if !fill_remaining(&mut grid, size, &mut s) {
        return Vec::new();
    }

    grid
}
