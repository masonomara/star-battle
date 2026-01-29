interface DLXNode {
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
  column: ColumnHeader;
  rowIndex: number;
}
interface ColumnHeader extends DLXNode {
  size: number;
}
interface RootHeader {
  left: ColumnHeader | RootHeader;
  right: ColumnHeader | RootHeader;
}

function buildMatrix(
  numPrimary: number,
  numSecondary: number,
  rows: number[][],
): RootHeader {
  const root: RootHeader = {} as RootHeader;
  root.left = root;
  root.right = root;
  const columns: ColumnHeader[] = [];

  for (let i = 0; i < numPrimary + numSecondary; i++) {
    const col = {} as ColumnHeader;
    col.up = col;
    col.down = col;
    col.left = col;
    col.right = col;
    col.column = col;
    col.rowIndex = -1;
    col.size = 0;
    columns.push(col);
  }

  let prev: RootHeader | ColumnHeader = root;
  for (let i = 0; i < numPrimary; i++) {
    prev.right = columns[i];
    columns[i].left = prev as ColumnHeader;
    prev = columns[i];
  }
  prev.right = root;
  root.left = prev;

  for (let i = numPrimary; i < columns.length; i++)
    columns[i].left = columns[i].right = columns[i];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    if (rows[rowIdx].length === 0) continue;
    let first: DLXNode | null = null,
      prevNode: DLXNode | null = null;

    for (const colIdx of rows[rowIdx]) {
      const col = columns[colIdx];
      const node = {} as DLXNode;
      node.up = col.up;
      node.down = col;
      node.column = col;
      node.rowIndex = rowIdx;
      col.up.down = node;
      col.up = node;
      col.size++;

      if (!first) {
        first = node;
        node.left = node;
        node.right = node;
      } else {
        node.left = prevNode!;
        node.right = first;
        prevNode!.right = node;
        first.left = node;
      }
      prevNode = node;
    }
  }
  return root;
}

function cover(col: ColumnHeader): void {
  col.right.left = col.left;
  col.left.right = col.right;
  for (let row = col.down; row !== col; row = row.down)
    for (let node = row.right; node !== row; node = node.right) {
      node.down.up = node.up;
      node.up.down = node.down;
      node.column.size--;
    }
}

function uncover(col: ColumnHeader): void {
  for (let row = col.up; row !== col; row = row.up)
    for (let node = row.left; node !== row; node = node.left) {
      node.column.size++;
      node.down.up = node;
      node.up.down = node;
    }
  col.right.left = col;
  col.left.right = col;
}

function search(
  root: RootHeader,
  solution: number[],
  solutions: number[][],
): void {
  if (root.right === root) {
    solutions.push([...solution]);
    return;
  }
  let col: ColumnHeader | null = null,
    minSize = Infinity;
  for (
    let c = root.right as ColumnHeader;
    c !== root;
    c = c.right as ColumnHeader
  )
    if (c.size < minSize) {
      minSize = c.size;
      col = c;
    }
  if (!col || col.size === 0) return;

  cover(col);
  for (let row = col.down; row !== col; row = row.down) {
    solution.push(row.rowIndex);
    for (let node = row.right; node !== row; node = node.right)
      cover(node.column);
    search(root, solution, solutions);
    for (let node = row.left; node !== row; node = node.left)
      uncover(node.column);
    solution.pop();
  }
  uncover(col);
}

export function dlxSolve(
  numPrimary: number,
  numSecondary: number,
  rows: number[][],
): number[][] {
  if (numPrimary === 0) return [[]];
  const solutions: number[][] = [];
  search(buildMatrix(numPrimary, numSecondary, rows), [], solutions);
  return solutions;
}

/**
 * Check if a solution exists with at least minRows rows.
 * Much faster than dlxSolve when we only need to validate minimum tile count.
 */
export function dlxHasSolutionWithMinRows(
  numPrimary: number,
  numSecondary: number,
  rows: number[][],
  minRows: number,
): boolean {
  if (numPrimary === 0) return minRows <= 0;
  const root = buildMatrix(numPrimary, numSecondary, rows);
  return searchWithMinRows(root, 0, minRows);
}

function searchWithMinRows(
  root: RootHeader,
  depth: number,
  minRows: number,
): boolean {
  if (root.right === root) {
    return depth >= minRows;
  }

  let col: ColumnHeader | null = null;
  let minSize = Infinity;
  for (
    let c = root.right as ColumnHeader;
    c !== root;
    c = c.right as ColumnHeader
  ) {
    if (c.size < minSize) {
      minSize = c.size;
      col = c;
    }
  }
  if (!col || col.size === 0) return false;

  cover(col);
  for (let row = col.down; row !== col; row = row.down) {
    for (let node = row.right; node !== row; node = node.right) {
      cover(node.column);
    }
    if (searchWithMinRows(root, depth + 1, minRows)) {
      // Uncover before returning (restore state for caller)
      for (let node = row.left; node !== row; node = node.left) {
        uncover(node.column);
      }
      uncover(col);
      return true;
    }
    for (let node = row.left; node !== row; node = node.left) {
      uncover(node.column);
    }
  }
  uncover(col);
  return false;
}
