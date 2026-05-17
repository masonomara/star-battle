use wasm_bindgen::prelude::*;
use std::collections::BTreeSet;

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
    frontiers:    &mut Vec<BTreeSet<u32>>,
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

    let mut frontiers: Vec<BTreeSet<u32>> = vec![BTreeSet::new(); size];
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

fn compute_tiling_inner(cells: &[(usize, usize)], gs: usize) -> Vec<i32> {
    let n = cells.len();

    let mut cell_to_idx = vec![-1i32; gs * gs];
    for (i, &(r, c)) in cells.iter().enumerate() {
        cell_to_idx[r * gs + c] = i as i32;
    }

    let max_anchor = gs as i32 - 2;
    let mut seen_anchors = vec![false; gs * gs];
    let mut tiles: Vec<(usize, usize, Vec<usize>)> = Vec::new();

    for &(r, c) in cells {
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
    if n == 1 {
        return vec![1, 0, 1, coords_flat[0], coords_flat[1]];
    }
    let cells: Vec<(usize, usize)> = (0..n)
        .map(|i| (coords_flat[i * 2] as usize, coords_flat[i * 2 + 1] as usize))
        .collect();
    compute_tiling_inner(&cells, gs)
}

// ── Tiling Enumeration ────────────────────────────────────────────────────────

#[derive(Clone)]
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

// ── Solver ────────────────────────────────────────────────────────────────────

#[derive(Clone)]
struct CachedTiling {
    capacity:    usize,
    num_tilings: usize,
    forced:      Vec<(usize, usize)>,
    tilings_flat: Vec<i32>,  // [num_tilings, ...] for parse_enum_tilings
}

thread_local! {
    static TILING_CACHE: std::cell::RefCell<std::collections::HashMap<Vec<i32>, CachedTiling>>
        = std::cell::RefCell::new(std::collections::HashMap::new());
}

fn parse_tiling_flat(flat: &[i32]) -> CachedTiling {
    let capacity = flat[0] as usize;
    let num_t    = flat[1] as usize;
    let mut i    = 2usize;
    for _ in 0..num_t {
        let nt = flat[i] as usize; i += 1;
        for _ in 0..nt { let nc = flat[i+2] as usize; i += 3 + nc*2; }
    }
    let tilings_flat = flat[1..i].to_vec();
    let nf = flat[i] as usize; i += 1;
    let forced: Vec<(usize,usize)> = (0..nf).map(|j|
        (flat[i+j*2] as usize, flat[i+j*2+1] as usize)
    ).collect();
    CachedTiling { capacity, num_tilings: num_t, forced, tilings_flat }
}

fn get_tiling(sz: usize, keys: &[usize]) -> CachedTiling {
    let n = keys.len();
    if n == 0 {
        return CachedTiling { capacity: 0, num_tilings: 0, forced: vec![], tilings_flat: vec![0] };
    }
    if n == 1 {
        let (r, c) = (keys[0] / sz, keys[0] % sz);
        return CachedTiling { capacity: 1, num_tilings: 0, forced: vec![(r, c)], tilings_flat: vec![0] };
    }
    let mut sorted = keys.to_vec();
    sorted.sort_unstable();
    let mut cache_key: Vec<i32> = Vec::with_capacity(sorted.len() + 1);
    cache_key.push(sz as i32);
    cache_key.extend(sorted.iter().map(|&k| k as i32));
    let maybe = TILING_CACHE.with(|c| c.borrow().get(&cache_key).cloned());
    if let Some(ct) = maybe { return ct; }
    let coords: Vec<(usize,usize)> = sorted.iter().map(|&k| (k/sz, k%sz)).collect();
    let flat = compute_tiling_inner(&coords, sz);
    let ct = parse_tiling_flat(&flat);
    TILING_CACHE.with(|c| c.borrow_mut().insert(cache_key, ct.clone()));
    ct
}

#[derive(Clone)]
struct TightContrib { max_contrib: usize, stars_needed: usize, coords: Vec<usize> }

#[derive(Clone)]
struct TightSetData { mask: u32, contribs: Vec<TightContrib> }

#[derive(Clone)]
struct CountingResult { feasible: bool, tight_sets: Vec<TightSetData> }

struct Region {
    unknown: Vec<usize>,
    needed:  usize,
}

struct SolverState {
    sz:        usize,
    stars:     usize,
    grid:      Vec<i32>,
    cells:     Vec<u8>,       // 0=unknown 1=star 2=marked
    regions:   Vec<Region>,
    row_stars: Vec<usize>,
    col_stars: Vec<usize>,
    row_unk:   Vec<Vec<usize>>,
    col_unk:   Vec<Vec<usize>>,
    count_row: Option<CountingResult>,
    count_col: Option<CountingResult>,
}

impl SolverState {
    fn new(grid: &[i32], sz: usize, stars: usize) -> Self {
        let mut regions: Vec<Region> = (0..sz).map(|_| Region { unknown: vec![], needed: stars }).collect();
        let mut row_unk: Vec<Vec<usize>> = vec![vec![]; sz];
        let mut col_unk: Vec<Vec<usize>> = vec![vec![]; sz];
        for r in 0..sz { for c in 0..sz {
            let k = r * sz + c;
            let id = grid[k] as usize;
            regions[id].unknown.push(k);
            row_unk[r].push(k);
            col_unk[c].push(k);
        }}
        SolverState {
            sz, stars, grid: grid.to_vec(), cells: vec![0u8; sz*sz],
            regions, row_stars: vec![0; sz], col_stars: vec![0; sz],
            row_unk, col_unk, count_row: None, count_col: None,
        }
    }

    fn apply_delta(&mut self, changed: &[usize]) {
        if changed.is_empty() { return; }
        self.count_row = None;
        self.count_col = None;
        for &k in changed {
            let (r, c) = (k / self.sz, k % self.sz);
            let id = self.grid[k] as usize;
            if self.cells[k] == 1 {
                self.row_stars[r] += 1;
                self.col_stars[c] += 1;
                self.regions[id].needed = self.regions[id].needed.saturating_sub(1);
            }
            self.row_unk[r].retain(|&x| x != k);
            self.col_unk[c].retain(|&x| x != k);
            self.regions[id].unknown.retain(|&x| x != k);
        }
    }

    fn snapshot(&self) -> Vec<u8> { self.cells.clone() }

    fn diff(&self, snap: &[u8]) -> Vec<usize> {
        (0..self.sz*self.sz).filter(|&k| self.cells[k] != snap[k]).collect()
    }
}

fn compute_counting_for_state(s: &SolverState, axis: bool) -> CountingResult {
    let sz = s.sz;
    let axis_stars = if axis { &s.row_stars } else { &s.col_stars };
    let axis_needed: Vec<i32> = (0..sz).map(|i| (s.stars as i32) - (axis_stars[i] as i32)).collect();
    let total_demand: i32 = axis_needed.iter().sum();
    if total_demand == 0 { return CountingResult { feasible: true, tight_sets: vec![] }; }

    let mut region_stars_needed: Vec<i32> = Vec::new();
    let mut unknowns_by_axis_flat: Vec<i32> = Vec::new();
    let mut unknown_coords_flat: Vec<i32> = Vec::new();
    let mut unknown_coord_offsets: Vec<i32> = Vec::new();

    for region in &s.regions {
        if region.needed == 0 { continue; }
        let mut uby = vec![0i32; sz];
        for &k in &region.unknown {
            let line = if axis { k / sz } else { k % sz };
            uby[line] += 1;
        }
        unknown_coord_offsets.push((unknown_coords_flat.len() / 2) as i32);
        for &k in &region.unknown {
            unknown_coords_flat.push((k / sz) as i32);
            unknown_coords_flat.push((k % sz) as i32);
        }
        region_stars_needed.push(region.needed as i32);
        unknowns_by_axis_flat.extend_from_slice(&uby);
    }
    let r_count = region_stars_needed.len();
    unknown_coord_offsets.push((unknown_coords_flat.len() / 2) as i32);

    let (mut g, source, sink) = build_counting_network(sz, &axis_needed, &region_stars_needed, &unknowns_by_axis_flat);
    let max_flow = dinic(&mut g, source, sink);
    if max_flow < total_demand { return CountingResult { feasible: false, tight_sets: vec![] }; }

    let raw = extract_tight_sets(
        &g, source, sink, sz, r_count,
        &axis_needed, &region_stars_needed, &unknowns_by_axis_flat,
        &unknown_coords_flat, &unknown_coord_offsets,
    );
    let tight_sets = raw.into_iter().map(|(mask, contribs)| {
        let tc = contribs.into_iter().map(|(mc, sn, coords)| TightContrib {
            max_contrib:  mc as usize,
            stars_needed: sn as usize,
            coords: coords.iter().map(|&(r,c)| r as usize * sz + c as usize).collect(),
        }).collect();
        TightSetData { mask: mask as u32, contribs: tc }
    }).collect();
    CountingResult { feasible: true, tight_sets }
}

fn get_counting(s: &mut SolverState, axis: bool) -> CountingResult {
    if axis {
        if let Some(ref r) = s.count_row { return r.clone(); }
    } else {
        if let Some(ref r) = s.count_col { return r.clone(); }
    }
    let result = compute_counting_for_state(s, axis);
    if axis { s.count_row = Some(result.clone()); } else { s.count_col = Some(result.clone()); }
    result
}

fn has_counting_violation_inner(
    sz: usize, axis_needed: &[i32], region_stars_needed: &[i32], unknowns_by_axis_flat: &[i32],
) -> bool {
    let mut total = 0i32;
    for i in 0..sz {
        if axis_needed[i] < 0 { return true; }
        total += axis_needed[i];
    }
    if total == 0 { return false; }
    let (mut g, source, sink) = build_counting_network(sz, axis_needed, region_stars_needed, unknowns_by_axis_flat);
    dinic(&mut g, source, sink) < total
}

fn collect_valid_keys_inner(tilings: &[Vec<EnumTile>], in_inside: &[bool], cells: &[u8], sz: usize) -> Vec<bool> {
    let n = sz * sz;
    let mut valid = vec![false; n];
    for tiling in tilings {
        let mut fixed: Vec<usize> = Vec::new();
        let mut cands_per_tile: Vec<Vec<usize>> = Vec::new();
        let mut ok = true;
        for tile in tiling {
            if let Some(&k) = tile.covered.iter().find(|&&k| cells[k] == 1) {
                fixed.push(k);
            } else {
                let cands: Vec<usize> = tile.covered.iter()
                    .filter(|&&k| in_inside[k] && cells[k] == 0)
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
    valid
}

fn find_overhang_inner(tilings: &[Vec<EnumTile>], in_inside: &[bool], sz: usize) -> Vec<usize> {
    if tilings.is_empty() { return Vec::new(); }
    let n = sz * sz;
    let mut inter: Option<Vec<bool>> = None;
    for tiling in tilings {
        let mut outside = vec![false; n];
        for tile in tiling {
            for &k in &tile.all_cells { if !in_inside[k] { outside[k] = true; } }
        }
        match inter {
            None => inter = Some(outside),
            Some(ref mut prev) => { for k in 0..n { prev[k] &= outside[k]; } }
        }
    }
    let inter = inter.unwrap_or_else(|| vec![false; n]);
    (0..n).filter(|&k| inter[k]).collect()
}


fn get_solve_status(s: &SolverState) -> u8 {
    let sz = s.sz;
    let mut solved = true;
    for r in 0..sz {
        for c in 0..sz {
            if s.cells[r*sz+c] == 1 {
                for dr in -1i32..=1 { for dc in -1i32..=1 {
                    if dr == 0 && dc == 0 { continue; }
                    let nr = r as i32 + dr; let nc = c as i32 + dc;
                    if nr >= 0 && nr < sz as i32 && nc >= 0 && nc < sz as i32 {
                        if s.cells[nr as usize * sz + nc as usize] == 1 { return 2; }
                    }
                }}
            }
        }
        if s.row_stars[r] + s.row_unk[r].len() < s.stars || s.col_stars[r] + s.col_unk[r].len() < s.stars { return 2; }
        if s.row_stars[r] != s.stars || s.col_stars[r] != s.stars { solved = false; }
    }
    for region in &s.regions {
        if region.needed + region.unknown.len() < region.unknown.len() + region.needed {
            // can't underflow, handled below
        }
        let placed = s.stars - region.needed;
        if placed + region.unknown.len() < s.stars { return 2; }
        if region.needed != 0 { solved = false; }
    }
    if solved { 1 } else { 0 }
}

fn is_valid_board(grid: &[i32], sz: usize, stars: usize) -> bool {
    if sz == 0 || stars == 0 { return false; }
    let min_size = if stars > 1 { stars * 2 - 1 } else { 1 };
    let mut counts = vec![0usize; sz];
    for &v in grid {
        let id = v as usize;
        if id >= sz { return false; }
        counts[id] += 1;
    }
    if counts.iter().any(|&c| c == 0 || c < min_size) { return false; }
    true
}

// ── Rules 1–3 ─────────────────────────────────────────────────────────────────

fn rule_star_neighbors(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for r in 0..sz { for c in 0..sz {
        if s.cells[r*sz+c] != 1 { continue; }
        for dr in -1i32..=1 { for dc in -1i32..=1 {
            if dr == 0 && dc == 0 { continue; }
            let nr = r as i32 + dr; let nc = c as i32 + dc;
            if nr >= 0 && nr < sz as i32 && nc >= 0 && nc < sz as i32 {
                let k = nr as usize * sz + nc as usize;
                if s.cells[k] == 0 { to_mark.push(k); }
            }
        }}
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_forced_placement(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let lines = if axis { &s.row_unk } else { &s.col_unk };
    let stars = if axis { &s.row_stars } else { &s.col_stars };
    for i in 0..sz {
        let needed = s.stars.saturating_sub(stars[i]);
        if needed == 0 || lines[i].len() != needed { continue; }
        let keys = lines[i].clone();
        for k in keys { s.cells[k] = 1; }
        return true;
    }
    false
}

fn rule_forced_region(s: &mut SolverState) -> bool {
    for id in 0..s.regions.len() {
        let needed = s.regions[id].needed;
        if needed == 0 || s.regions[id].unknown.len() != needed { continue; }
        let keys = s.regions[id].unknown.clone();
        for k in keys { s.cells[k] = 1; }
        return true;
    }
    false
}

fn rule_trivial_marks(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let stars = if axis { &s.row_stars } else { &s.col_stars };
    let mut to_mark: Vec<usize> = Vec::new();
    for i in 0..sz {
        if stars[i] == s.stars {
            let unk = if axis { &s.row_unk[i] } else { &s.col_unk[i] };
            for &k in unk { if s.cells[k] == 0 { to_mark.push(k); } }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_trivial_region(s: &mut SolverState) -> bool {
    let mut to_mark: Vec<usize> = Vec::new();
    for region in &s.regions {
        if region.needed == 0 {
            for &k in &region.unknown { if s.cells[k] == 0 { to_mark.push(k); } }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

// ── Rules 4–5 ─────────────────────────────────────────────────────────────────

fn rule_tiling_forced_line(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    for i in 0..sz {
        let needed = s.stars.saturating_sub(if axis { s.row_stars[i] } else { s.col_stars[i] });
        if needed == 0 { continue; }
        let keys: Vec<usize> = if axis { s.row_unk[i].clone() } else { s.col_unk[i].clone() };
        if keys.is_empty() { continue; }
        let ct = get_tiling(sz, &keys);
        if ct.capacity != needed { continue; }
        for (r, c) in &ct.forced {
            let k = r * sz + c;
            if s.cells[k] == 0 { s.cells[k] = 1; return true; }
        }
    }
    false
}

fn rule_tiling_forced_region(s: &mut SolverState) -> bool {
    let sz = s.sz;
    for id in 0..s.regions.len() {
        let needed = s.regions[id].needed;
        if needed == 0 { continue; }
        let keys = s.regions[id].unknown.clone();
        let ct = get_tiling(sz, &keys);
        if ct.capacity != needed { continue; }
        for (r, c) in &ct.forced {
            let k = r * sz + c;
            if s.cells[k] == 0 { s.cells[k] = 1; return true; }
        }
    }
    false
}

fn rule_tiling_adjacency_marks(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for id in 0..s.regions.len() {
        let needed = s.regions[id].needed;
        if needed == 0 { continue; }
        let keys = s.regions[id].unknown.clone();
        let ct = get_tiling(sz, &keys);
        if ct.capacity != needed || ct.num_tilings == 0 { continue; }
        let tilings = parse_enum_tilings(&ct.tilings_flat, sz);
        if tilings.is_empty() { continue; }
        let mut in_inside = vec![false; sz*sz];
        for &k in &keys { in_inside[k] = true; }
        let valid = collect_valid_keys_inner(&tilings, &in_inside, &s.cells, sz);
        for &k in &keys {
            if !valid[k] && s.cells[k] == 0 { to_mark.push(k); }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_tiling_overhang_marks(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for id in 0..s.regions.len() {
        let needed = s.regions[id].needed;
        if needed == 0 { continue; }
        let keys = s.regions[id].unknown.clone();
        let ct = get_tiling(sz, &keys);
        if ct.capacity != needed { continue; }
        if ct.num_tilings == 0 { continue; }
        let tilings = parse_enum_tilings(&ct.tilings_flat, sz);
        if tilings.is_empty() { continue; }
        let mut in_inside = vec![false; sz*sz];
        for &k in &keys { in_inside[k] = true; }
        let active: Vec<Vec<EnumTile>> = tilings.iter().filter(|tiling| {
            tiling.iter().any(|tile| tile.all_cells.iter().any(|&k| !in_inside[k] && s.cells[k] == 0))
        }).cloned().collect();
        if active.is_empty() { continue; }
        for k in find_overhang_inner(&active, &in_inside, sz) {
            if s.cells[k] == 0 { to_mark.push(k); }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_counting_mark(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let flow = get_counting(s, axis);
    if !flow.feasible { return false; }
    let mut to_mark: Vec<usize> = Vec::new();
    for ts in &flow.tight_sets {
        for contrib in &ts.contribs {
            if contrib.max_contrib != contrib.stars_needed { continue; }
            for &k in &contrib.coords {
                let line = if axis { k / sz } else { k % sz };
                if (ts.mask >> line) & 1 == 0 && s.cells[k] == 0 {
                    to_mark.push(k);
                }
            }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

// ── Rules 6–7 ─────────────────────────────────────────────────────────────────

fn squeeze_pair_keys(s: &SolverState, axis: bool, i: usize) -> (Vec<usize>, usize) {
    let sz = s.sz;
    let mut pair_keys: Vec<usize> = Vec::new();
    let mut existing_stars = 0usize;
    for j in 0..sz {
        let (r0, c0, r1, c1) = if axis { (i, j, i+1, j) } else { (j, i, j, i+1) };
        let k0 = r0*sz+c0; let k1 = r1*sz+c1;
        if s.cells[k0] == 0 { pair_keys.push(k0); }
        if s.cells[k1] == 0 { pair_keys.push(k1); }
        if s.cells[k0] == 1 { existing_stars += 1; }
        if s.cells[k1] == 1 { existing_stars += 1; }
    }
    let needed = (s.stars * 2).saturating_sub(existing_stars);
    (pair_keys, needed)
}

fn rule_tiling_pair_forced(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    for i in 0..sz.saturating_sub(1) {
        let (pair_keys, needed) = squeeze_pair_keys(s, axis, i);
        if pair_keys.is_empty() || needed == 0 { continue; }
        let ct = get_tiling(sz, &pair_keys);
        if ct.capacity != needed { continue; }
        for (r, c) in &ct.forced {
            let k = r*sz+c;
            if s.cells[k] == 0 { s.cells[k] = 1; return true; }
        }
    }
    false
}

fn rule_tiling_pair_adjacency(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for i in 0..sz.saturating_sub(1) {
        let (pair_keys, needed) = squeeze_pair_keys(s, axis, i);
        if pair_keys.is_empty() || needed == 0 { continue; }
        let ct = get_tiling(sz, &pair_keys);
        if ct.capacity != needed || ct.num_tilings == 0 { continue; }
        let tilings = parse_enum_tilings(&ct.tilings_flat, sz);
        if tilings.is_empty() { continue; }
        let mut in_pair = vec![false; sz*sz];
        for &k in &pair_keys { in_pair[k] = true; }
        let valid = collect_valid_keys_inner(&tilings, &in_pair, &s.cells, sz);
        for &k in &pair_keys {
            if !valid[k] && s.cells[k] == 0 { to_mark.push(k); }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_tiling_pair_overhang(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for i in 0..sz.saturating_sub(1) {
        let (pair_keys, needed) = squeeze_pair_keys(s, axis, i);
        if pair_keys.is_empty() || needed == 0 { continue; }
        let ct = get_tiling(sz, &pair_keys);
        if ct.capacity != needed || ct.num_tilings == 0 { continue; }
        let tilings = parse_enum_tilings(&ct.tilings_flat, sz);
        if tilings.is_empty() { continue; }
        let mut in_pair = vec![false; sz*sz];
        for &k in &pair_keys { in_pair[k] = true; }
        let active: Vec<Vec<EnumTile>> = tilings.iter().filter(|tiling| {
            tiling.iter().any(|tile| tile.all_cells.iter().any(|&k| !in_pair[k] && s.cells[k] == 0))
        }).cloned().collect();
        if active.is_empty() { continue; }
        for k in find_overhang_inner(&active, &in_pair, sz) {
            if s.cells[k] == 0 { to_mark.push(k); }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

struct TcEntry { reg_id: usize, axis_mask: u32, unknown: Vec<usize> }

fn build_tc_entries(s: &SolverState, axis: bool) -> Vec<TcEntry> {
    let sz = s.sz;
    s.regions.iter().enumerate().filter_map(|(id, region)| {
        if region.needed == 0 { return None; }
        let mut axis_mask = 0u32;
        for &k in &region.unknown { axis_mask |= 1u32 << (if axis { k/sz } else { k%sz }); }
        Some(TcEntry { reg_id: id, axis_mask, unknown: region.unknown.clone() })
    }).collect()
}

fn tc_line_needed(s: &SolverState, axis: bool) -> Vec<usize> {
    let sz = s.sz;
    (0..sz).map(|i| s.stars.saturating_sub(if axis { s.row_stars[i] } else { s.col_stars[i] })).collect()
}

fn rule_tiling_counting_mark(s: &mut SolverState, axis: bool, min_group: usize, max_group: usize) -> bool {
    let sz = s.sz;
    let entries = build_tc_entries(s, axis);
    let line_needed = tc_line_needed(s, axis);
    let mut combo = vec![0usize; max_group];
    let mut to_mark: Vec<usize> = Vec::new();

    'outer: for group_size in min_group..=max_group.min(sz) {
        for j in 0..group_size { combo[j] = j; }
        loop {
            let mut mask = 0u32;
            let mut total_needed = 0usize;
            for j in 0..group_size { mask |= 1u32 << combo[j]; total_needed += line_needed[combo[j]]; }
            if total_needed > 0 {
                let mut total_min = 0usize;
                let mut entry_mins: Vec<(usize, usize)> = Vec::new(); // (reg_id, min_contrib)
                let mut exceeded = false;
                for e in &entries {
                    if e.axis_mask & mask == 0 { continue; }
                    let outside: Vec<usize> = e.unknown.iter().filter(|&&k| {
                        let line = if axis { k/sz } else { k%sz };
                        (mask >> line) & 1 == 0
                    }).copied().collect();
                    let cap_outside = if outside.is_empty() { 0 } else { get_tiling(sz, &outside).capacity };
                    let min_contrib = s.regions[e.reg_id].needed.saturating_sub(cap_outside);
                    total_min += min_contrib;
                    entry_mins.push((e.reg_id, min_contrib));
                    if total_min > total_needed { exceeded = true; break; }
                }
                if !exceeded && total_min == total_needed {
                    for (reg_id, min_contrib) in &entry_mins {
                        if *min_contrib != 0 { continue; }
                        for &k in &s.regions[*reg_id].unknown {
                            let line = if axis { k/sz } else { k%sz };
                            if (mask >> line) & 1 != 0 && s.cells[k] == 0 { to_mark.push(k); }
                        }
                    }
                    if !to_mark.is_empty() { break 'outer; }
                }
            }
            let mut j = group_size as i32 - 1;
            while j >= 0 && combo[j as usize] == sz - group_size + j as usize { j -= 1; }
            if j < 0 { break; }
            combo[j as usize] += 1;
            for p in (j as usize + 1)..group_size { combo[p] = combo[p-1] + 1; }
        }
    }
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_tiling_counting_forced(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let entries = build_tc_entries(s, axis);
    let line_needed = tc_line_needed(s, axis);
    let mut combo = [0usize; 1];
    let mut to_star: Vec<usize> = Vec::new();

    'outer: for i in 0..sz {
        combo[0] = i;
        let mask = 1u32 << i;
        let total_needed = line_needed[i];
        if total_needed == 0 { continue; }
        let mut total_min = 0usize;
        let mut entry_mins: Vec<(usize, usize)> = Vec::new();
        let mut exceeded = false;
        for e in &entries {
            if e.axis_mask & mask == 0 { continue; }
            let outside: Vec<usize> = e.unknown.iter().filter(|&&k| {
                let line = if axis { k/sz } else { k%sz };
                (mask >> line) & 1 == 0
            }).copied().collect();
            let cap_outside = if outside.is_empty() { 0 } else { get_tiling(sz, &outside).capacity };
            let min_contrib = s.regions[e.reg_id].needed.saturating_sub(cap_outside);
            total_min += min_contrib;
            entry_mins.push((e.reg_id, min_contrib));
            if total_min > total_needed { exceeded = true; break; }
        }
        if !exceeded && total_min == total_needed {
            for (reg_id, min_contrib) in &entry_mins {
                let stars_outside = s.regions[*reg_id].needed.saturating_sub(*min_contrib);
                if stars_outside == 0 { continue; }
                let outside_unk: Vec<usize> = s.regions[*reg_id].unknown.iter().filter(|&&k| {
                    let line = if axis { k/sz } else { k%sz };
                    (mask >> line) & 1 == 0 && s.cells[k] == 0
                }).copied().collect();
                if outside_unk.len() != stars_outside { continue; }
                to_star.extend_from_slice(&outside_unk);
                if !to_star.is_empty() { break 'outer; }
            }
        }
    }
    if to_star.is_empty() { return false; }
    for k in to_star { s.cells[k] = 1; }
    true
}

// ── Hypotheticals ─────────────────────────────────────────────────────────────

struct HypState {
    violation: u8,   // 0=none 1=adjacency 2=row 3=col 4=region
    star_keys: Vec<bool>,
    marked:    Vec<bool>,
}

fn mark_neighbors_in_hyp(hs: &mut HypState, r: usize, c: usize, sz: usize) {
    for dr in -1i32..=1 { for dc in -1i32..=1 {
        let nr = r as i32 + dr; let nc = c as i32 + dc;
        if nr >= 0 && nr < sz as i32 && nc >= 0 && nc < sz as i32 {
            hs.marked[nr as usize * sz + nc as usize] = true;
        }
    }}
}

fn scan_board_hyp(s: &SolverState, hs: &mut HypState) -> (u8, Vec<usize>) {
    let sz = s.sz;
    let mut forced: Vec<usize> = Vec::new();
    let mut seen = hs.star_keys.clone();

    // rows
    for r in 0..sz {
        let mut stars = 0usize;
        let mut unknowns: Vec<usize> = Vec::new();
        for c in 0..sz {
            let k = r*sz+c;
            if s.cells[k] == 1 || hs.star_keys[k] { stars += 1; }
            else if s.cells[k] == 0 && !hs.marked[k] { unknowns.push(k); }
        }
        if stars > s.stars { return (2, vec![]); }
        let needed = s.stars - stars;
        if needed == 0 { for &k in &unknowns { hs.marked[k] = true; } }
        else if unknowns.len() < needed { return (2, vec![]); }
        else if unknowns.len() == needed {
            for &k in &unknowns { if !seen[k] { seen[k] = true; forced.push(k); } }
        }
    }
    // cols
    for c in 0..sz {
        let mut stars = 0usize;
        let mut unknowns: Vec<usize> = Vec::new();
        for r in 0..sz {
            let k = r*sz+c;
            if s.cells[k] == 1 || hs.star_keys[k] { stars += 1; }
            else if s.cells[k] == 0 && !hs.marked[k] { unknowns.push(k); }
        }
        if stars > s.stars { return (3, vec![]); }
        let needed = s.stars - stars;
        if needed == 0 { for &k in &unknowns { hs.marked[k] = true; } }
        else if unknowns.len() < needed { return (3, vec![]); }
        else if unknowns.len() == needed {
            for &k in &unknowns { if !seen[k] { seen[k] = true; forced.push(k); } }
        }
    }
    // regions
    for (id, region) in s.regions.iter().enumerate() {
        let mut extra_stars = 0usize;
        let mut unknowns: Vec<usize> = Vec::new();
        for &k in &region.unknown {
            if hs.star_keys[k] { extra_stars += 1; }
            else if !hs.marked[k] { unknowns.push(k); }
        }
        if extra_stars > region.needed { return (4, vec![]); }
        let needed = region.needed - extra_stars;
        if needed == 0 { for &k in &unknowns { hs.marked[k] = true; } }
        else if unknowns.len() < needed { return (4, vec![]); }
        else if unknowns.len() == needed {
            for &k in &unknowns { if !seen[k] { seen[k] = true; forced.push(k); } }
        }
        let _ = id;
    }
    (0, forced)
}

fn propagate_hypothetical(s: &SolverState, row: usize, col: usize) -> HypState {
    let sz = s.sz;
    let k0 = row*sz+col;
    let mut hs = HypState {
        violation: 0,
        star_keys: vec![false; sz*sz],
        marked:    vec![false; sz*sz],
    };
    hs.star_keys[k0] = true;
    mark_neighbors_in_hyp(&mut hs, row, col, sz);

    for _ in 0..sz*s.stars {
        let (viol, forced) = scan_board_hyp(s, &mut hs);
        if viol != 0 { hs.violation = viol; return hs; }
        if forced.is_empty() { break; }
        for fk in forced {
            let fr = fk/sz; let fc = fk%sz;
            for (sk, &is_star) in hs.star_keys.iter().enumerate() {
                if !is_star { continue; }
                let sr = sk/sz; let sc = sk%sz;
                if (fr as i32 - sr as i32).abs() <= 1 && (fc as i32 - sc as i32).abs() <= 1 {
                    hs.violation = 1; return hs;
                }
            }
            hs.star_keys[fk] = true;
            mark_neighbors_in_hyp(&mut hs, fr, fc, sz);
        }
    }
    hs
}

fn simple_hyp_state(sz: usize, row: usize, col: usize) -> HypState {
    let mut hs = HypState { violation: 0, star_keys: vec![false; sz*sz], marked: vec![false; sz*sz] };
    hs.star_keys[row*sz+col] = true;
    for dr in -1i32..=1 { for dc in -1i32..=1 {
        let nr = row as i32+dr; let nc = col as i32+dc;
        if nr >= 0 && nr < sz as i32 && nc >= 0 && nc < sz as i32 {
            hs.marked[nr as usize*sz+nc as usize] = true;
        }
    }}
    hs
}

fn propagated_counting_violation(s: &SolverState, hs: &HypState, axis: bool) -> bool {
    let sz = s.sz;
    let axis_stars = if axis { &s.row_stars } else { &s.col_stars };
    let mut hyp_per_axis = vec![0i32; sz];
    let mut hyp_per_region = vec![0i32; sz];
    for (k, &is_star) in hs.star_keys.iter().enumerate() {
        if !is_star { continue; }
        let (r, c) = (k/sz, k%sz);
        hyp_per_axis[if axis { r } else { c }] += 1;
        hyp_per_region[s.grid[k] as usize] += 1;
    }
    let axis_needed: Vec<i32> = (0..sz).map(|i| (s.stars as i32) - (axis_stars[i] as i32) - hyp_per_axis[i]).collect();
    let mut region_stars_needed: Vec<i32> = Vec::new();
    let mut unknowns_by_axis_flat: Vec<i32> = Vec::new();
    for (reg_id, region) in s.regions.iter().enumerate() {
        let needed = region.needed as i32 - hyp_per_region[reg_id];
        if needed <= 0 { continue; }
        let mut uby = vec![0i32; sz];
        let mut total = 0i32;
        for &k in &region.unknown {
            if hs.star_keys[k] || hs.marked[k] { continue; }
            uby[if axis { k/sz } else { k%sz }] += 1;
            total += 1;
        }
        if total < needed { return true; }
        region_stars_needed.push(needed);
        unknowns_by_axis_flat.extend_from_slice(&uby);
    }
    has_counting_violation_inner(sz, &axis_needed, &region_stars_needed, &unknowns_by_axis_flat)
}

// ── Rules 8–11 ────────────────────────────────────────────────────────────────

fn rule_hyp_count(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = simple_hyp_state(sz, row, col);
        let idx = if axis { row } else { col };
        let mut violated = false;
        'check: for i in idx.saturating_sub(1)..=(idx+1).min(sz-1) {
            let mut stars = 0usize; let mut remaining = 0usize;
            for j in 0..sz {
                let (r, c) = if axis { (i, j) } else { (j, i) };
                let k = r*sz+c;
                if s.cells[k] == 1 || hs.star_keys[k] { stars += 1; }
                else if s.cells[k] == 0 && !hs.marked[k] { remaining += 1; }
            }
            if stars > s.stars { violated = true; break 'check; }
            let needed = s.stars - stars;
            if needed > 0 && remaining < needed { violated = true; break 'check; }
        }
        if violated { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_hyp_region_count(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = simple_hyp_state(sz, row, col);
        let mut affected: Vec<usize> = Vec::new();
        affected.push(s.grid[row*sz+col] as usize);
        for dr in -1i32..=1 { for dc in -1i32..=1 {
            let nr = row as i32+dr; let nc = col as i32+dc;
            if nr >= 0 && nr < sz as i32 && nc >= 0 && nc < sz as i32 {
                let reg_id = s.grid[nr as usize*sz+nc as usize] as usize;
                if !affected.contains(&reg_id) { affected.push(reg_id); }
            }
        }}
        let mut violated = false;
        'check: for &reg_id in &affected {
            let region = &s.regions[reg_id];
            let mut extra_stars = 0usize; let mut remaining = 0usize;
            for &k in &region.unknown {
                if hs.star_keys[k] { extra_stars += 1; }
                else if !hs.marked[k] { remaining += 1; }
            }
            if extra_stars > region.needed { violated = true; break 'check; }
            let needed = region.needed - extra_stars;
            if needed > 0 && remaining < needed { violated = true; break 'check; }
        }
        if violated { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_hyp_capacity(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = simple_hyp_state(sz, row, col);
        let idx = if axis { row } else { col };
        let mut violated = false;
        'check: for i in idx.saturating_sub(1)..=(idx+1).min(sz-1) {
            let mut stars = 0usize;
            let mut remaining: Vec<usize> = Vec::new();
            for j in 0..sz {
                let (r, c) = if axis { (i, j) } else { (j, i) };
                let k = r*sz+c;
                if s.cells[k] == 1 || hs.star_keys[k] { stars += 1; }
                else if s.cells[k] == 0 && !hs.marked[k] { remaining.push(k); }
            }
            if stars > s.stars { violated = true; break 'check; }
            let needed = s.stars - stars;
            if needed == 0 { continue; }
            if remaining.len() < needed { violated = true; break 'check; }
            if remaining.len() >= needed * 2 { continue; }
            let ct = get_tiling(sz, &remaining);
            if ct.capacity < needed { violated = true; break 'check; }
        }
        if violated { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_hyp_region_capacity(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = simple_hyp_state(sz, row, col);
        let mut affected: Vec<usize> = Vec::new();
        affected.push(s.grid[row*sz+col] as usize);
        for dr in -1i32..=1 { for dc in -1i32..=1 {
            let nr = row as i32+dr; let nc = col as i32+dc;
            if nr >= 0 && nr < sz as i32 && nc >= 0 && nc < sz as i32 {
                let reg_id = s.grid[nr as usize*sz+nc as usize] as usize;
                if !affected.contains(&reg_id) { affected.push(reg_id); }
            }
        }}
        let mut violated = false;
        'check: for &reg_id in &affected {
            let region = &s.regions[reg_id];
            let mut extra_stars = 0usize;
            let mut remaining: Vec<usize> = Vec::new();
            for &k in &region.unknown {
                if hs.star_keys[k] { extra_stars += 1; }
                else if !hs.marked[k] { remaining.push(k); }
            }
            if extra_stars > region.needed { violated = true; break 'check; }
            let needed = region.needed - extra_stars;
            if needed == 0 { continue; }
            if remaining.len() < needed { violated = true; break 'check; }
            if remaining.len() >= needed * 4 { continue; }
            let ct = get_tiling(sz, &remaining);
            if ct.capacity < needed { violated = true; break 'check; }
        }
        if violated { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_hyp_counting(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = simple_hyp_state(sz, row, col);
        if propagated_counting_violation(s, &hs, axis) { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_prop_count(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = propagate_hypothetical(s, row, col);
        let viol = hs.violation;
        let fires = if axis { viol == 2 || viol == 1 } else { viol == 3 };
        if fires { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_prop_region_count(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = propagate_hypothetical(s, row, col);
        if hs.violation == 4 { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_prop_capacity(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = propagate_hypothetical(s, row, col);
        if hs.violation != 0 { continue; }
        let mut violated = false;
        'check: for i in 0..sz {
            let mut stars = 0usize;
            let mut remaining: Vec<usize> = Vec::new();
            for j in 0..sz {
                let (r, c) = if axis { (i, j) } else { (j, i) };
                let k = r*sz+c;
                if s.cells[k] == 1 || hs.star_keys[k] { stars += 1; }
                else if s.cells[k] == 0 && !hs.marked[k] { remaining.push(k); }
            }
            if stars > s.stars { violated = true; break 'check; }
            let needed = s.stars - stars;
            if needed == 0 { continue; }
            if remaining.len() < needed { violated = true; break 'check; }
            if remaining.len() >= needed * 2 { continue; }
            let ct = get_tiling(sz, &remaining);
            if ct.capacity < needed { violated = true; break 'check; }
        }
        if violated { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_prop_region_capacity(s: &mut SolverState) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = propagate_hypothetical(s, row, col);
        if hs.violation != 0 { continue; }
        let mut violated = false;
        'check: for region in &s.regions {
            let mut extra_stars = 0usize;
            let mut remaining: Vec<usize> = Vec::new();
            for &k in &region.unknown {
                if hs.star_keys[k] { extra_stars += 1; }
                else if !hs.marked[k] { remaining.push(k); }
            }
            if extra_stars > region.needed { violated = true; break 'check; }
            let needed = region.needed - extra_stars;
            if needed == 0 { continue; }
            if remaining.len() < needed { violated = true; break 'check; }
            if remaining.len() >= needed * 4 { continue; }
            let ct = get_tiling(sz, &remaining);
            if ct.capacity < needed { violated = true; break 'check; }
        }
        if violated { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

fn rule_prop_counting(s: &mut SolverState, axis: bool) -> bool {
    let sz = s.sz;
    let mut to_mark: Vec<usize> = Vec::new();
    for row in 0..sz { for col in 0..sz {
        if s.cells[row*sz+col] != 0 { continue; }
        let hs = propagate_hypothetical(s, row, col);
        if hs.violation != 0 { continue; }
        if propagated_counting_violation(s, &hs, axis) { to_mark.push(row*sz+col); }
    }}
    if to_mark.is_empty() { return false; }
    for k in to_mark { s.cells[k] = 2; }
    true
}

// ── Main solver loop ──────────────────────────────────────────────────────────

fn apply_next_rule(s: &mut SolverState) -> usize {
    if rule_star_neighbors(s)                          { return 1; }
    if rule_forced_placement(s, true)                  { return 2; }
    if rule_forced_placement(s, false)                 { return 2; }
    if rule_forced_region(s)                           { return 2; }
    if rule_trivial_marks(s, true)                     { return 3; }
    if rule_trivial_marks(s, false)                    { return 3; }
    if rule_trivial_region(s)                          { return 3; }
    if rule_tiling_forced_line(s, true)                { return 4; }
    if rule_tiling_forced_line(s, false)               { return 4; }
    if rule_tiling_forced_region(s)                    { return 4; }
    if rule_tiling_adjacency_marks(s)                  { return 4; }
    if rule_tiling_overhang_marks(s)                   { return 4; }
    if rule_counting_mark(s, true)                     { return 5; }
    if rule_counting_mark(s, false)                    { return 5; }
    if rule_tiling_pair_forced(s, true)                { return 6; }
    if rule_tiling_pair_forced(s, false)               { return 6; }
    if rule_tiling_pair_adjacency(s, true)             { return 6; }
    if rule_tiling_pair_adjacency(s, false)            { return 6; }
    if rule_tiling_pair_overhang(s, true)              { return 6; }
    if rule_tiling_pair_overhang(s, false)             { return 6; }
    if rule_tiling_counting_mark(s, true,  1, 1)       { return 7; }
    if rule_tiling_counting_mark(s, false, 1, 1)       { return 7; }
    if rule_tiling_counting_forced(s, true)            { return 7; }
    if rule_tiling_counting_forced(s, false)           { return 7; }
    if rule_tiling_counting_mark(s, true,  2, 4)       { return 7; }
    if rule_tiling_counting_mark(s, false, 2, 4)       { return 7; }
    if rule_hyp_count(s, true)                         { return 8; }
    if rule_hyp_count(s, false)                        { return 8; }
    if rule_hyp_region_count(s)                        { return 8; }
    if rule_hyp_capacity(s, true)                      { return 9; }
    if rule_hyp_capacity(s, false)                     { return 9; }
    if rule_hyp_region_capacity(s)                     { return 9; }
    if rule_hyp_counting(s, true)                      { return 10; }
    if rule_hyp_counting(s, false)                     { return 10; }
    if rule_prop_count(s, true)                        { return 11; }
    if rule_prop_count(s, false)                       { return 11; }
    if rule_prop_region_count(s)                       { return 11; }
    if rule_prop_capacity(s, true)                     { return 11; }
    if rule_prop_capacity(s, false)                    { return 11; }
    if rule_prop_region_capacity(s)                    { return 11; }
    if rule_prop_counting(s, true)                     { return 11; }
    if rule_prop_counting(s, false)                    { return 11; }
    0
}

/// Solve a star-battle board entirely in Rust.
/// Returns [0] on failure, [1, maxLevel, cycles, c00, c01, ...] on success.
/// c values: 0=unknown, 1=star, 2=marked.
#[wasm_bindgen]
pub fn solve_board(grid_flat: &[i32], size: u32, stars: u32) -> Vec<i32> {
    let sz = size as usize;
    let st = stars as usize;
    if !is_valid_board(grid_flat, sz, st) { return vec![0]; }

    let mut s = SolverState::new(grid_flat, sz, st);
    let mut cycles = 0usize;
    let mut max_level = 0usize;

    loop {
        cycles += 1;
        if cycles > sz * sz * 100 { return vec![0]; } // infinite loop guard

        match get_solve_status(&s) {
            2 => return vec![0],
            1 => {
                let mut out = vec![1i32, max_level as i32, cycles as i32];
                out.extend(s.cells.iter().map(|&c| c as i32));
                return out;
            }
            _ => {}
        }

        let snap = s.snapshot();
        let level = apply_next_rule(&mut s);
        if level == 0 { return vec![0]; }
        max_level = max_level.max(level);
        let changed = s.diff(&snap);
        s.apply_delta(&changed);
    }
}
