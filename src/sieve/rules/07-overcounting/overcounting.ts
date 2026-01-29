import buildRegions from "../../helpers/regions";
import { Board, CellState } from "../../helpers/types";

type Axis = "row" | "col";

function processAxis(
  axis: Axis,
  size: number,
  board: Board,
  cells: CellState[][],
  lineRegions: Map<number, Set<number>>,
  regions: Map<number, [number, number][]>,
): boolean {
  let changed = false;

  for (let start = 0; start < size; start++) {
    const lineSet = new Set<number>();
    const regSet = new Set<number>();

    for (let end = start; end < size; end++) {
      lineSet.add(end);
      const prev = regSet.size;
      for (const id of lineRegions.get(end)!) regSet.add(id);
      const added = regSet.size > prev;

      if (regSet.size === lineSet.size) {
        let valid = true;
        for (const line of lineSet) {
          for (let i = 0; i < size && valid; i++) {
            const [row, col] = axis === "row" ? [line, i] : [i, line];
            if (!regSet.has(board.grid[row][col])) valid = false;
          }
        }

        if (valid) {
          for (const id of regSet) {
            for (const [row, col] of regions.get(id)!) {
              const lineIdx = axis === "row" ? row : col;
              if (!lineSet.has(lineIdx) && cells[row][col] === "unknown") {
                cells[row][col] = "marked";
                changed = true;
              }
            }
          }
        }
      }

      if (end > start && added && regSet.size > lineSet.size) break;
    }
  }
  return changed;
}

export default function overcounting(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;
  const regions = buildRegions(board.grid);

  const regionStars = new Map<number, number>();
  for (const [id, coords] of regions) {
    let stars = 0;
    for (const [row, col] of coords) if (cells[row][col] === "star") stars++;
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
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = board.grid[row][col];
      if (active.has(id)) {
        rowRegions.get(row)!.add(id);
        colRegions.get(col)!.add(id);
      }
    }
  }

  const rowChanged = processAxis("row", size, board, cells, rowRegions, regions);
  const colChanged = processAxis("col", size, board, cells, colRegions, regions);

  return rowChanged || colChanged;
}
