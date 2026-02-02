import { cellKey } from "../../helpers/cellKey";
import { computeAllStrips } from "../../helpers/strips";
import { Board, CellState, Strip, StripCache } from "../../helpers/types";
import { BoardAnalysis } from "../../helpers/boardAnalysis";

type Axis = "row" | "col";
type Contrib = { stars: number; cells: Set<string> };

/** Check if all strips of a region are confined to a single index on the given axis. */
function isConfined(
  strips: Strip[],
  axis: Axis,
  targetIndex: number,
): boolean {
  if (strips.length === 0) return false;

  const primaryOrientation = axis === "row" ? "horizontal" : "vertical";
  const anchorIdx = axis === "row" ? 0 : 1;
  let hasPrimary = false;

  for (const s of strips) {
    if (s.orientation === primaryOrientation) {
      hasPrimary = true;
      if (s.anchor[anchorIdx] !== targetIndex) return false;
    } else if (s.cells.length > 1) {
      return false;
    }
  }
  return hasPrimary;
}

/** Collect contributions from regions confined to a single row or column. */
function collectContributions(
  stripCache: StripCache,
  axis: Axis,
): Map<number, Contrib[]> {
  const contribs = new Map<number, Contrib[]>();
  const orientation = axis === "row" ? "horizontal" : "vertical";
  const anchorIdx = axis === "row" ? 0 : 1;

  for (const [regionId, strips] of stripCache.byRegion) {
    const [firstStrip] = strips;
    if (!firstStrip) continue;
    const needed = firstStrip.starsNeeded;
    if (needed <= 0) continue;

    const axisStrips = strips.filter((s) => s.orientation === orientation);
    if (axisStrips.length === 0) continue;

    const indices = new Set(axisStrips.map((s) => s.anchor[anchorIdx]));
    if (indices.size !== 1) continue;

    const index = indices.values().next().value as number;
    if (!isConfined(strips, axis, index)) continue;

    const cellSet = new Set<string>();
    for (const s of axisStrips) {
      for (const [row, col] of s.cells) cellSet.add(cellKey(row, col));
    }

    if (!contribs.has(index)) contribs.set(index, []);
    contribs.get(index)!.push({ stars: needed, cells: cellSet });
  }

  return contribs;
}

/** Mark remainder of row/col when confined regions account for all needed stars. */
function markRemainder(
  board: Board,
  cells: CellState[][],
  contribs: Map<number, Contrib[]>,
  axis: Axis,
): boolean {
  const size = axis === "row" ? board.grid[0].length : board.grid.length;
  let changed = false;

  for (const [index, regionContribs] of contribs) {
    let existingStars = 0;
    for (let i = 0; i < size; i++) {
      const cell = axis === "row" ? cells[index][i] : cells[i][index];
      if (cell === "star") existingStars++;
    }

    const quota = board.stars - existingStars;
    if (quota <= 0) continue;

    const total = regionContribs.reduce((sum, c) => sum + c.stars, 0);
    if (total < quota) continue;

    const contributing = new Set<string>();
    for (const c of regionContribs) {
      for (const cell of c.cells) contributing.add(cell);
    }

    for (let i = 0; i < size; i++) {
      const [row, col] = axis === "row" ? [index, i] : [i, index];
      if (cells[row][col] === "unknown" && !contributing.has(cellKey(row, col))) {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}

export default function oneByNConfinement(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  if (board.grid.length === 0) return false;

  const stripCache = computeAllStrips(board, cells, analysis);
  const rowContribs = collectContributions(stripCache, "row");
  const colContribs = collectContributions(stripCache, "col");

  const rowChanged = markRemainder(board, cells, rowContribs, "row");
  const colChanged = markRemainder(board, cells, colContribs, "col");

  return rowChanged || colChanged;
}
