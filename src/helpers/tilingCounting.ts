import { Board, CellState, Coord } from "./types";
import { BoardAnalysis, RegionMeta } from "./boardAnalysis";

export function tilingCountingLoop(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
  axis: "row" | "col",
  deduct: (
    cells: CellState[][],
    mask: number,
    regionMeta: RegionMeta,
    minContrib: number,
  ) => boolean,
  minGroupSize = 1,
  maxGroupSize = 1,
): boolean {
  const { size, regions } = analysis;
  const axisStars = axis === "row" ? analysis.rowStars : analysis.colStars;

  const regionEntries: { meta: RegionMeta; axisMask: number }[] = [];
  for (const meta of regions.values()) {
    if (meta.starsNeeded <= 0) continue;
    let axisMask = 0;
    for (const [r, c] of meta.unknownCoords) {
      axisMask |= 1 << (axis === "row" ? r : c);
    }
    regionEntries.push({ meta, axisMask });
  }

  const lineNeeded = new Array<number>(size);
  for (let i = 0; i < size; i++) {
    lineNeeded[i] = board.stars - axisStars[i];
  }

  const entryMetas: RegionMeta[] = [];
  const entryContribs: number[] = [];
  const combo = new Int32Array(maxGroupSize);

  for (let groupSize = minGroupSize; groupSize <= maxGroupSize; groupSize++) {
    if (groupSize > size) break;

    for (let j = 0; j < groupSize; j++) combo[j] = j;

    outer: while (true) {
      let mask = 0;
      let totalNeeded = 0;
      for (let j = 0; j < groupSize; j++) {
        const line = combo[j];
        mask |= 1 << line;
        totalNeeded += lineNeeded[line];
      }

      if (totalNeeded > 0) {
        let totalMin = 0;
        let exceeded = false;
        entryMetas.length = 0;
        entryContribs.length = 0;

        for (let ri = 0; ri < regionEntries.length; ri++) {
          const { meta, axisMask } = regionEntries[ri];
          if (!(axisMask & mask)) continue;

          const cellsOutside: Coord[] = [];
          for (const [r, c] of meta.unknownCoords) {
            if (!((mask >> (axis === "row" ? r : c)) & 1)) {
              cellsOutside.push([r, c]);
            }
          }

          const capacityOutside =
            cellsOutside.length === 0
              ? 0
              : analysis.getTiling(cellsOutside).capacity;

          const minContrib = Math.max(0, meta.starsNeeded - capacityOutside);
          totalMin += minContrib;
          entryMetas.push(meta);
          entryContribs.push(minContrib);

          if (totalMin > totalNeeded) {
            exceeded = true;
            break;
          }
        }

        if (!exceeded && totalMin === totalNeeded) {
          let changed = false;
          for (let ei = 0; ei < entryMetas.length; ei++) {
            if (deduct(cells, mask, entryMetas[ei], entryContribs[ei])) {
              changed = true;
            }
          }
          if (changed) return true;
        }
      }

      let j = groupSize - 1;
      while (j >= 0 && combo[j] === size - groupSize + j) j--;
      if (j < 0) break outer;
      combo[j]++;
      for (let p = j + 1; p < groupSize; p++) combo[p] = combo[p - 1] + 1;
    }
  }

  return false;
}
