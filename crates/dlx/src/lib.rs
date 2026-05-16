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

// ── Counting Flow ─────────────────────────────────────────────────────────────

#[derive(Clone)]
struct CountingEdge { to: usize, cap: i32, rev: usize }
type CountingGraph = Vec<Vec<CountingEdge>>;

fn counting_add_edge(g: &mut CountingGraph, from: usize, to: usize, cap: i32) {
    let rev_from = g[to].len();
    let rev_to   = g[from].len();
    g[from].push(CountingEdge { to, cap, rev: rev_from });
    g[to].push(CountingEdge { to: from, cap: 0, rev: rev_to });
}

fn dinic_bfs(g: &CountingGraph, s: usize, t: usize, level: &mut Vec<i32>) -> bool {
    let n = g.len();
    level.clear();
    level.resize(n, -1);
    level[s] = 0;
    let mut queue = std::collections::VecDeque::new();
    queue.push_back(s);
    while let Some(v) = queue.pop_front() {
        for e in &g[v] {
            if e.cap > 0 && level[e.to] < 0 {
                level[e.to] = level[v] + 1;
                queue.push_back(e.to);
            }
        }
    }
    level[t] >= 0
}

fn dinic_dfs(g: &mut CountingGraph, level: &[i32], iter: &mut Vec<usize>, v: usize, t: usize, pushed: i32) -> i32 {
    if v == t { return pushed; }
    while iter[v] < g[v].len() {
        let i = iter[v];
        let (to, cap, rev) = (g[v][i].to, g[v][i].cap, g[v][i].rev);
        if cap > 0 && level[v] < level[to] {
            let d = dinic_dfs(g, level, iter, to, t, pushed.min(cap));
            if d > 0 {
                g[v][i].cap -= d;
                g[to][rev].cap += d;
                return d;
            }
        }
        iter[v] += 1;
    }
    0
}

fn dinic(g: &mut CountingGraph, s: usize, t: usize) -> i32 {
    let n = g.len();
    let mut flow = 0i32;
    let mut level = vec![-1i32; n];
    let mut iter  = vec![0usize; n];
    while dinic_bfs(g, s, t, &mut level) {
        iter.fill(0);
        loop {
            let d = dinic_dfs(g, &level, &mut iter, s, t, i32::MAX);
            if d == 0 { break; }
            flow += d;
        }
    }
    flow
}

fn build_counting_network(
    size:                  usize,
    axis_needed:           &[i32],
    region_stars_needed:   &[i32],
    unknowns_by_axis_flat: &[i32],
) -> (CountingGraph, usize, usize) {
    let r_count = region_stars_needed.len();
    let n       = 2 + size + r_count;
    let source  = 0usize;
    let sink    = n - 1;
    let mut g: CountingGraph = vec![vec![]; n];

    for i in 0..size {
        let cap = axis_needed[i];
        if cap > 0 { counting_add_edge(&mut g, source, 1 + i, cap); }
    }
    for ri in 0..r_count {
        let sn = region_stars_needed[ri];
        if sn <= 0 { continue; }
        counting_add_edge(&mut g, 1 + size + ri, sink, sn);
        for i in 0..size {
            let cap = unknowns_by_axis_flat[ri * size + i];
            if cap > 0 { counting_add_edge(&mut g, 1 + i, 1 + size + ri, cap); }
        }
    }
    (g, source, sink)
}

#[wasm_bindgen]
pub fn has_counting_violation(
    size:                  u32,
    axis_needed:           &[i32],
    region_stars_needed:   &[i32],
    unknowns_by_axis_flat: &[i32],
) -> bool {
    let size = size as usize;
    let mut total_demand = 0i32;
    for i in 0..size {
        if axis_needed[i] < 0 { return true; }
        total_demand += axis_needed[i];
    }
    if total_demand == 0 { return false; }
    let (mut g, source, sink) = build_counting_network(size, axis_needed, region_stars_needed, unknowns_by_axis_flat);
    dinic(&mut g, source, sink) < total_demand
}

// (mask, [(maxContrib, starsNeeded, [(r, c)])])
type TightSet = (i32, Vec<(i32, i32, Vec<(i32, i32)>)>);

fn extract_tight_sets(
    g:                     &CountingGraph,
    source:                usize,
    sink:                  usize,
    size:                  usize,
    r_count:               usize,
    axis_needed:           &[i32],
    region_stars_needed:   &[i32],
    unknowns_by_axis_flat: &[i32],
    unknown_coords_flat:   &[i32],
    unknown_coord_offsets: &[i32],
) -> Vec<TightSet> {
    let n = g.len();

    // Iterative Tarjan's SCC on residual graph (edges with cap > 0)
    let mut scc_id   = vec![-1i32; n];
    let mut low      = vec![0i32;  n];
    let mut disc     = vec![-1i32; n];
    let mut on_stack = vec![false;  n];
    let mut stack: Vec<usize> = Vec::new();
    let mut timer    = 0i32;
    let mut scc_count = 0usize;

    struct Frame { node: usize, edge_idx: usize, first: bool }

    for start in 0..n {
        if disc[start] >= 0 { continue; }
        let mut call_stack = vec![Frame { node: start, edge_idx: 0, first: true }];
        while !call_stack.is_empty() {
            let len = call_stack.len();
            let u   = call_stack[len - 1].node;

            if call_stack[len - 1].first {
                disc[u] = timer; low[u] = timer; timer += 1;
                stack.push(u); on_stack[u] = true;
                call_stack[len - 1].first = false;
            }

            let mut pushed = false;
            while call_stack[len - 1].edge_idx < g[u].len() {
                let idx         = call_stack[len - 1].edge_idx;
                let (ecap, eto) = (g[u][idx].cap, g[u][idx].to);
                call_stack[len - 1].edge_idx += 1;
                if ecap > 0 {
                    let v = eto;
                    if disc[v] < 0 {
                        call_stack.push(Frame { node: v, edge_idx: 0, first: true });
                        pushed = true;
                        break;
                    } else if on_stack[v] && disc[v] < low[u] {
                        low[u] = disc[v];
                    }
                }
            }

            if !pushed {
                if low[u] == disc[u] {
                    let id = scc_count as i32; scc_count += 1;
                    loop {
                        let v = stack.pop().unwrap();
                        on_stack[v] = false; scc_id[v] = id;
                        if v == u { break; }
                    }
                }
                call_stack.pop();
                let len2 = call_stack.len();
                if len2 > 0 {
                    let pu = call_stack[len2 - 1].node;
                    if low[u] < low[pu] { low[pu] = low[u]; }
                }
            }
        }
    }

    // Collect lines and regions per SCC
    let mut scc_lines:   Vec<Vec<usize>> = vec![vec![]; scc_count];
    let mut scc_regions: Vec<Vec<usize>> = vec![vec![]; scc_count];
    for i in 0..size   { scc_lines  [scc_id[1 + i]         as usize].push(i);  }
    for ri in 0..r_count { scc_regions[scc_id[1 + size + ri] as usize].push(ri); }

    let scc_source = scc_id[source] as usize;
    let scc_sink   = scc_id[sink]   as usize;

    // Walk SCCs in topological order (reverse of Tarjan's numbering = higher id first)
    let mut tight_sets    = Vec::new();
    let mut cum_demand    = 0i32;
    let mut cum_supply    = 0i32;
    let mut block_lines:   Vec<usize> = Vec::new();
    let mut block_regions: Vec<usize> = Vec::new();

    for si in (0..scc_count).rev() {
        if si == scc_source || si == scc_sink { continue; }
        for &line in &scc_lines[si]   { cum_demand += axis_needed[line]; block_lines.push(line); }
        for &ri   in &scc_regions[si] { cum_supply += region_stars_needed[ri]; block_regions.push(ri); }

        if cum_demand > 0 && cum_demand == cum_supply && !block_lines.is_empty() {
            let mask = block_lines.iter().fold(0i32, |m, &l| m | (1 << l));
            let mut contribs: Vec<(i32, i32, Vec<(i32, i32)>)> = Vec::new();

            for &ri in &block_regions {
                let sn     = region_stars_needed[ri];
                let inside: i32 = block_lines.iter().map(|&l| unknowns_by_axis_flat[ri * size + l]).sum();
                if inside > 0 || sn > 0 {
                    let max_contrib = sn.min(inside);
                    let coord_start = unknown_coord_offsets[ri]     as usize;
                    let coord_end   = unknown_coord_offsets[ri + 1] as usize;
                    let coords: Vec<(i32, i32)> = (coord_start..coord_end)
                        .map(|k| (unknown_coords_flat[k * 2], unknown_coords_flat[k * 2 + 1]))
                        .collect();
                    contribs.push((max_contrib, sn, coords));
                }
            }

            if !contribs.is_empty() { tight_sets.push((mask, contribs)); }

            block_lines.clear();
            block_regions.clear();
        }
    }

    tight_sets
}

#[wasm_bindgen]
pub fn compute_counting_flow(
    size:                  u32,
    axis_needed:           &[i32],
    region_stars_needed:   &[i32],
    unknowns_by_axis_flat: &[i32],
    unknown_coords_flat:   &[i32],
    unknown_coord_offsets: &[i32],
) -> Vec<i32> {
    let size    = size as usize;
    let r_count = region_stars_needed.len();

    let mut total_demand = 0i32;
    for i in 0..size { total_demand += axis_needed[i]; }
    if total_demand == 0 { return vec![1, 0]; }

    let (mut g, source, sink) = build_counting_network(size, axis_needed, region_stars_needed, unknowns_by_axis_flat);
    let max_flow = dinic(&mut g, source, sink);
    if max_flow < total_demand { return vec![0, 0]; }

    let tight_sets = extract_tight_sets(
        &g, source, sink, size, r_count,
        axis_needed, region_stars_needed, unknowns_by_axis_flat,
        unknown_coords_flat, unknown_coord_offsets,
    );

    // Encoding: [feasible=1, num_tight_sets, for each: mask, num_contribs,
    //            for each contrib: maxContrib, starsNeeded, num_coords, r0, c0, ...]
    let mut out = vec![1i32, tight_sets.len() as i32];
    for (mask, contribs) in &tight_sets {
        out.push(*mask);
        out.push(contribs.len() as i32);
        for (max_contrib, stars_needed, coords) in contribs {
            out.push(*max_contrib);
            out.push(*stars_needed);
            out.push(coords.len() as i32);
            for (r, c) in coords { out.push(*r); out.push(*c); }
        }
    }
    out
}

// ── Tiling ────────────────────────────────────────────────────────────────────

/// Compute a 2×2 tiling of the given cells.
/// Input:  coords_flat = [r0,c0, r1,c1, ...], grid_size
/// Output: [capacity, num_tilings,
///            for each tiling: num_tiles,
///              for each tile: ar, ac, num_covered, r0,c0, ...
///          , num_forced, r0,c0, ...]
/// Falls back to [n, 0, 0] when no exact cover exists.
#[wasm_bindgen]
pub fn compute_tiling(coords_flat: &[i32], grid_size: u32) -> Vec<i32> {
    let gs = grid_size as usize;
    let n  = coords_flat.len() / 2;
    if n == 0 { return vec![0, 1, 0, 0]; }

    let cells: Vec<(usize, usize)> = (0..n)
        .map(|i| (coords_flat[i * 2] as usize, coords_flat[i * 2 + 1] as usize))
        .collect();

    let mut cell_to_idx = vec![-1i32; gs * gs];
    for (i, &(r, c)) in cells.iter().enumerate() {
        cell_to_idx[r * gs + c] = i as i32;
    }

    let max_anchor = gs as i32 - 2;
    let mut seen_anchors = vec![false; gs * gs];
    let mut tiles: Vec<(usize, usize, Vec<usize>)> = Vec::new();

    for &(r, c) in &cells {
        for dr in -1i32..=0 {
            for dc in -1i32..=0 {
                let ar = r as i32 + dr;
                let ac = c as i32 + dc;
                if ar < 0 || ac < 0 || ar > max_anchor || ac > max_anchor { continue; }
                let ak = ar as usize * gs + ac as usize;
                if seen_anchors[ak] { continue; }
                seen_anchors[ak] = true;

                let covered: Vec<usize> = [
                    (ar as usize,     ac as usize),
                    (ar as usize,     ac as usize + 1),
                    (ar as usize + 1, ac as usize),
                    (ar as usize + 1, ac as usize + 1),
                ].iter().filter_map(|&(tr, tc)| {
                    let idx = cell_to_idx[tr * gs + tc];
                    if idx >= 0 { Some(idx as usize) } else { None }
                }).collect();

                if !covered.is_empty() { tiles.push((ar as usize, ac as usize, covered)); }
            }
        }
    }

    if tiles.is_empty() { return vec![n as i32, 0, 0]; }

    // Assign sequential secondary indices to non-primary tile cells
    let mut secondary_idx = vec![-1i32; gs * gs];
    let mut num_secondary = 0usize;
    for &(ar, ac, _) in &tiles {
        for (tr, tc) in [(ar, ac), (ar, ac + 1), (ar + 1, ac), (ar + 1, ac + 1)] {
            let k = tr * gs + tc;
            if cell_to_idx[k] < 0 && secondary_idx[k] < 0 {
                secondary_idx[k] = num_secondary as i32;
                num_secondary += 1;
            }
        }
    }

    // Build DLX rows: primary indices (covered cells) then secondary indices (other tile cells)
    let mut rows_flat:   Vec<i32> = Vec::new();
    let mut row_offsets: Vec<i32> = Vec::new();
    for &(ar, ac, ref covered) in &tiles {
        row_offsets.push(rows_flat.len() as i32);
        for &ci in covered { rows_flat.push(ci as i32); }
        for (tr, tc) in [(ar, ac), (ar, ac + 1), (ar + 1, ac), (ar + 1, ac + 1)] {
            let k  = tr * gs + tc;
            let si = secondary_idx[k];
            if si >= 0 { rows_flat.push(n as i32 + si); }
        }
    }
    row_offsets.push(rows_flat.len() as i32);

    let mut dlx     = Dlx::build(n as u32, num_secondary as u32, &rows_flat, &row_offsets);
    let mut sol     = Vec::new();
    let mut solutions: Vec<Vec<i32>> = Vec::new();
    let mut min_len = usize::MAX;
    dlx.search(&mut sol, &mut solutions, &mut min_len);

    if solutions.is_empty() { return vec![n as i32, 0, 0]; }

    let capacity    = min_len;
    let num_tilings = solutions.len();

    // Forced: solo (covered.len()==1) in ALL minimal tilings
    let mut solo_count = vec![0u32; n];
    for sol in &solutions {
        for &ti in sol {
            let covered = &tiles[ti as usize].2;
            if covered.len() == 1 { solo_count[covered[0]] += 1; }
        }
    }
    let forced: Vec<usize> = (0..n)
        .filter(|&ci| solo_count[ci] as usize == num_tilings)
        .collect();

    let mut out = vec![capacity as i32, num_tilings as i32];
    for sol in &solutions {
        out.push(sol.len() as i32);
        for &ti in sol {
            let (ar, ac, ref covered) = tiles[ti as usize];
            out.push(ar as i32); out.push(ac as i32);
            out.push(covered.len() as i32);
            for &ci in covered {
                let (r, c) = cells[ci];
                out.push(r as i32); out.push(c as i32);
            }
        }
    }
    out.push(forced.len() as i32);
    for ci in forced {
        let (r, c) = cells[ci];
        out.push(r as i32); out.push(c as i32);
    }
    out
}

// ── Tiling Enumeration ────────────────────────────────────────────────────────

struct EnumTile { covered: Vec<usize>, all_cells: [usize; 4] }

fn parse_enum_tilings(flat: &[i32], sz: usize) -> Vec<Vec<EnumTile>> {
    if flat.is_empty() { return Vec::new(); }
    let mut i = 0;
    let num_tilings = flat[i] as usize; i += 1;
    let mut tilings = Vec::with_capacity(num_tilings);
    for _ in 0..num_tilings {
        let num_tiles = flat[i] as usize; i += 1;
        let mut tiling = Vec::with_capacity(num_tiles);
        for _ in 0..num_tiles {
            let ar = flat[i] as usize; let ac = flat[i + 1] as usize; i += 2;
            let nc = flat[i] as usize; i += 1;
            let mut covered = Vec::with_capacity(nc);
            for _ in 0..nc {
                covered.push(flat[i] as usize * sz + flat[i + 1] as usize); i += 2;
            }
            let all_cells = [ar*sz+ac, ar*sz+ac+1, (ar+1)*sz+ac, (ar+1)*sz+ac+1];
            tiling.push(EnumTile { covered, all_cells });
        }
        tilings.push(tiling);
    }
    tilings
}

#[inline(always)]
fn keys_adjacent(a: usize, b: usize, sz: usize) -> bool {
    let (ar, ac) = (a / sz, a % sz);
    let (br, bc) = (b / sz, b % sz);
    (ar as i32 - br as i32).abs() <= 1 && (ac as i32 - bc as i32).abs() <= 1
}

fn backtrack(
    partial:    &mut Vec<usize>,
    candidates: &[Vec<usize>],
    idx:        usize,
    sz:         usize,
    valid:      &mut Vec<bool>,
) {
    if idx == candidates.len() {
        for &k in partial.iter() { valid[k] = true; }
        return;
    }
    for &k in &candidates[idx] {
        if partial.iter().any(|&p| keys_adjacent(k, p, sz)) { continue; }
        partial.push(k);
        backtrack(partial, candidates, idx + 1, sz, valid);
        partial.pop();
    }
}

/// Returns flat cell keys [k0, k1, ...] for every cell that appears in at
/// least one valid star assignment across all tilings.
/// cell_states: 0=unknown, 1=star, 2=marked  (length = size*size)
#[wasm_bindgen]
pub fn collect_valid_star_cells(
    tilings_flat: &[i32],
    inside_keys:  &[i32],
    cell_states:  &[i32],
    size:         u32,
) -> Vec<i32> {
    let sz = size as usize;
    let mut in_inside = vec![false; sz * sz];
    for &k in inside_keys { in_inside[k as usize] = true; }

    let tilings = parse_enum_tilings(tilings_flat, sz);
    let mut valid = vec![false; sz * sz];

    for tiling in &tilings {
        let mut fixed: Vec<usize> = Vec::new();
        let mut cands_per_tile: Vec<Vec<usize>> = Vec::new();
        let mut ok = true;

        for tile in tiling {
            if let Some(&k) = tile.covered.iter().find(|&&k| cell_states[k] == 1) {
                fixed.push(k);
            } else {
                let cands: Vec<usize> = tile.covered.iter()
                    .filter(|&&k| in_inside[k] && cell_states[k] == 0)
                    .copied().collect();
                if cands.is_empty() { ok = false; break; }
                cands_per_tile.push(cands);
            }
        }
        if !ok { continue; }

        'outer: for i in 0..fixed.len() {
            for j in i+1..fixed.len() {
                if keys_adjacent(fixed[i], fixed[j], sz) { ok = false; break 'outer; }
            }
        }
        if !ok { continue; }

        for &k in &fixed { valid[k] = true; }
        backtrack(&mut fixed.clone(), &cands_per_tile, 0, sz, &mut valid);
    }

    (0..sz*sz).filter(|&k| valid[k]).map(|k| k as i32).collect()
}

/// Given already-filtered active tilings, returns flat [r0,c0, r1,c1, ...]
/// for cells outside insideSet that appear in ALL active tilings.
#[wasm_bindgen]
pub fn find_forced_overhang(
    tilings_flat: &[i32],
    inside_keys:  &[i32],
    size:         u32,
) -> Vec<i32> {
    let sz = size as usize;
    let mut in_inside = vec![false; sz * sz];
    for &k in inside_keys { in_inside[k as usize] = true; }

    let tilings = parse_enum_tilings(tilings_flat, sz);
    if tilings.is_empty() { return Vec::new(); }

    let mut inter: Vec<bool> = Vec::new();

    for tiling in &tilings {
        let mut outside = vec![false; sz * sz];
        for tile in tiling {
            for &k in &tile.all_cells {
                if !in_inside[k] { outside[k] = true; }
            }
        }
        if inter.is_empty() {
            inter = outside;
        } else {
            for k in 0..sz*sz { inter[k] &= outside[k]; }
        }
    }

    let mut out = Vec::new();
    for k in 0..sz*sz {
        if inter[k] { out.push((k / sz) as i32); out.push((k % sz) as i32); }
    }
    out
}
