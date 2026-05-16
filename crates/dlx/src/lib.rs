use wasm_bindgen::prelude::*;

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
