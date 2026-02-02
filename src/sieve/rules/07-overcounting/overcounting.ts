import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

type Axis = "row" | "col";

function processAxis(
  axis: Axis,
  size: number,
  board: Board,
  cells: CellState[][],
  lineRegions: Map<number, Set<number>>,
  regions: Map<number, Coord[]>,
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
  analysis: BoardAnalysis,
): boolean {
  const { size, regions, rowToActiveRegionsAll, colToActiveRegionsAll } =
    analysis;

  const rowChanged = processAxis(
    "row",
    size,
    board,
    cells,
    rowToActiveRegionsAll,
    regions,
  );
  const colChanged = processAxis(
    "col",
    size,
    board,
    cells,
    colToActiveRegionsAll,
    regions,
  );

  return rowChanged || colChanged;
}
