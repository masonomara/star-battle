/**
 * DLX (Dancing Links) - Knuth's Algorithm X with dancing links.
 *
 * Solves exact cover with primary and secondary columns:
 * - Primary columns: must be covered exactly once
 * - Secondary columns: may be covered at most once (optional)
 */

/** A node in the dancing links structure */
interface DLXNode {
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
  column: ColumnHeader;
  rowIndex: number;
}

/** Column header extends node with metadata */
interface ColumnHeader extends DLXNode {
  size: number;
}

/** Root header for the entire matrix */
interface RootHeader {
  left: ColumnHeader | RootHeader;
  right: ColumnHeader | RootHeader;
}

/**
 * Build the DLX matrix from a sparse representation.
 *
 * @param numPrimaryColumns - Number of primary columns (must be covered)
 * @param numSecondaryColumns - Number of secondary columns (at most once)
 * @param rows - Each row is a list of column indices it covers
 * @returns The root header of the matrix
 */
function buildMatrix(
  numPrimaryColumns: number,
  numSecondaryColumns: number,
  rows: number[][],
): RootHeader {
  const totalColumns = numPrimaryColumns + numSecondaryColumns;

  // Create root
  const root: RootHeader = { left: null!, right: null! };

  // Create column headers
  const columns: ColumnHeader[] = [];
  for (let i = 0; i < totalColumns; i++) {
    const col: ColumnHeader = {
      left: null!,
      right: null!,
      up: null!,
      down: null!,
      column: null!,
      rowIndex: -1,
      size: 0,
    };
    col.up = col;
    col.down = col;
    col.column = col;
    columns.push(col);
  }

  // Link primary columns horizontally (left-right through root)
  // Secondary columns are NOT linked horizontally - they won't be chosen by Algorithm X
  let prev: RootHeader | ColumnHeader = root;
  for (let i = 0; i < numPrimaryColumns; i++) {
    const col = columns[i];
    prev.right = col;
    col.left = prev as ColumnHeader;
    prev = col;
  }
  prev.right = root;
  root.left = prev;

  // Link secondary columns to themselves (isolated horizontally)
  for (let i = numPrimaryColumns; i < totalColumns; i++) {
    columns[i].left = columns[i];
    columns[i].right = columns[i];
  }

  // Add rows
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (row.length === 0) continue;

    let firstNode: DLXNode | null = null;
    let prevNode: DLXNode | null = null;

    for (const colIdx of row) {
      const col = columns[colIdx];

      const node: DLXNode = {
        left: null!,
        right: null!,
        up: col.up,
        down: col,
        column: col,
        rowIndex: rowIdx,
      };

      // Link vertically
      col.up.down = node;
      col.up = node;
      col.size++;

      // Link horizontally within row
      if (firstNode === null) {
        firstNode = node;
        node.left = node;
        node.right = node;
      } else {
        node.left = prevNode!;
        node.right = firstNode;
        prevNode!.right = node;
        firstNode.left = node;
      }
      prevNode = node;
    }
  }

  return root;
}

/**
 * Cover a column - remove it and all rows that intersect it.
 */
function cover(col: ColumnHeader): void {
  // Remove column header from horizontal list
  col.right.left = col.left;
  col.left.right = col.right;

  // Remove all rows in this column
  for (let row = col.down; row !== col; row = row.down) {
    for (let node = row.right; node !== row; node = node.right) {
      node.down.up = node.up;
      node.up.down = node.down;
      node.column.size--;
    }
  }
}

/**
 * Uncover a column - restore it and all rows (reverse of cover).
 */
function uncover(col: ColumnHeader): void {
  // Restore all rows in this column (reverse order)
  for (let row = col.up; row !== col; row = row.up) {
    for (let node = row.left; node !== row; node = node.left) {
      node.column.size++;
      node.down.up = node;
      node.up.down = node;
    }
  }

  // Restore column header to horizontal list
  col.right.left = col;
  col.left.right = col;
}

/**
 * Choose column with minimum remaining values (MRV heuristic).
 */
function chooseColumn(root: RootHeader): ColumnHeader | null {
  let best: ColumnHeader | null = null;
  let minSize = Infinity;

  for (
    let col = root.right as ColumnHeader;
    col !== root;
    col = col.right as ColumnHeader
  ) {
    if (col.size < minSize) {
      minSize = col.size;
      best = col;
    }
  }

  return best;
}

/**
 * Recursive search for all solutions.
 */
function search(
  root: RootHeader,
  solution: number[],
  solutions: number[][],
): void {
  // If no primary columns left, we found a solution
  if (root.right === root) {
    solutions.push([...solution]);
    return;
  }

  // Choose column with MRV
  const col = chooseColumn(root);
  if (col === null || col.size === 0) {
    return; // No solution from here
  }

  cover(col);

  // Try each row in this column
  for (let row = col.down; row !== col; row = row.down) {
    solution.push(row.rowIndex);

    // Cover all other columns in this row
    for (let node = row.right; node !== row; node = node.right) {
      cover(node.column);
    }

    search(root, solution, solutions);

    // Uncover all other columns in this row (reverse order)
    for (let node = row.left; node !== row; node = node.left) {
      uncover(node.column);
    }

    solution.pop();
  }

  uncover(col);
}

/**
 * Solve an exact cover problem.
 *
 * @param numPrimaryColumns - Columns that must be covered exactly once
 * @param numSecondaryColumns - Columns that may be covered at most once
 * @param rows - Each row is a list of column indices (0-indexed)
 * @returns All solutions, where each solution is a list of row indices
 */
export function dlxSolve(
  numPrimaryColumns: number,
  numSecondaryColumns: number,
  rows: number[][],
): number[][] {
  if (numPrimaryColumns === 0) {
    return [[]]; // No columns to cover = trivial solution
  }

  const root = buildMatrix(numPrimaryColumns, numSecondaryColumns, rows);
  const solutions: number[][] = [];

  search(root, [], solutions);

  return solutions;
}
