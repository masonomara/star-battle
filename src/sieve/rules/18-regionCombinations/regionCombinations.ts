/**
 * Rule 18: Region Combinations
 *
 * Find composites by combining adjacent regions.
 * When multiple adjacent regions are analyzed together, their combined
 * star requirements may reveal tight tiling constraints.
 */

import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";
import {
  Composite,
  buildAdjacencyGraph,
  analyzeComposite,
} from "../../helpers/compositeAnalysis";
import { coordKey } from "../../helpers/cellKey";

function findCombinationComposites(
  _board: Board,
  _cells: CellState[][],
  regions: Map<number, RegionMeta>,
  adjacency: Map<number, Set<number>>,
  stars: number,
): Composite[] {
  const composites: Composite[] = [];
  const processed = new Set<string>();
  const activeRegions = [...regions.values()].filter(
    (r) => r.starsNeeded > 0,
  );

  // Generate pairs
  for (const r1 of activeRegions) {
    const neighbors1 = adjacency.get(r1.id);
    if (!neighbors1) continue;

    for (const id2 of neighbors1) {
      if (id2 <= r1.id) continue; // Avoid duplicates

      const r2 = regions.get(id2);
      if (!r2 || r2.starsNeeded <= 0) continue;

      const key = `${r1.id}-${id2}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const combinedUnknowns = [...r1.unknownCoords, ...r2.unknownCoords];
      const combinedNeed = r1.starsNeeded + r2.starsNeeded;

      // Pre-filter: skip if combined slack is too high
      const maxSlackMultiplier = Math.max(4, stars);
      if (combinedUnknowns.length > combinedNeed * maxSlackMultiplier) continue;
      if (combinedUnknowns.length < combinedNeed) continue;

      composites.push({
        id: `combo-${r1.id}-${id2}`,
        source: "combination",
        cells: [...r1.coords, ...r2.coords],
        unknownCells: combinedUnknowns,
        starsNeeded: combinedNeed,
        regionIds: new Set([r1.id, id2]),
      });
    }
  }

  // Generate triplets (three connected regions)
  for (const r1 of activeRegions) {
    const neighbors1 = adjacency.get(r1.id);
    if (!neighbors1) continue;

    for (const id2 of neighbors1) {
      if (id2 <= r1.id) continue;

      const r2 = regions.get(id2);
      if (!r2 || r2.starsNeeded <= 0) continue;

      const neighbors2 = adjacency.get(id2);
      if (!neighbors2) continue;

      // Find third region adjacent to r2 (and optionally to r1)
      for (const id3 of neighbors2) {
        if (id3 <= id2) continue; // Avoid duplicates via sorted order

        const r3 = regions.get(id3);
        if (!r3 || r3.starsNeeded <= 0) continue;

        const tripletKey = `${r1.id}-${id2}-${id3}`;
        if (processed.has(tripletKey)) continue;
        processed.add(tripletKey);

        const combinedUnknowns = [
          ...r1.unknownCoords,
          ...r2.unknownCoords,
          ...r3.unknownCoords,
        ];
        const combinedNeed = r1.starsNeeded + r2.starsNeeded + r3.starsNeeded;

        // Pre-filter: skip if combined slack is too high or too low
        const maxSlackMultiplier = Math.max(4, stars);
        if (combinedUnknowns.length > combinedNeed * maxSlackMultiplier)
          continue;
        if (combinedUnknowns.length < combinedNeed) continue;

        composites.push({
          id: `combo-${r1.id}-${id2}-${id3}`,
          source: "combination",
          cells: [...r1.coords, ...r2.coords, ...r3.coords],
          unknownCells: combinedUnknowns,
          starsNeeded: combinedNeed,
          regionIds: new Set([r1.id, id2, id3]),
        });
      }

      // Also check r1's other neighbors that are adjacent to r2
      for (const id3 of neighbors1) {
        if (id3 <= id2) continue;
        if (!neighbors2.has(id3)) continue; // Must also be adjacent to r2

        const r3 = regions.get(id3);
        if (!r3 || r3.starsNeeded <= 0) continue;

        const tripletKey = `${r1.id}-${id2}-${id3}`;
        if (processed.has(tripletKey)) continue;
        processed.add(tripletKey);

        const combinedUnknowns = [
          ...r1.unknownCoords,
          ...r2.unknownCoords,
          ...r3.unknownCoords,
        ];
        const combinedNeed = r1.starsNeeded + r2.starsNeeded + r3.starsNeeded;

        const maxSlackMultiplier = Math.max(4, stars);
        if (combinedUnknowns.length > combinedNeed * maxSlackMultiplier)
          continue;
        if (combinedUnknowns.length < combinedNeed) continue;

        composites.push({
          id: `combo-${r1.id}-${id2}-${id3}`,
          source: "combination",
          cells: [...r1.coords, ...r2.coords, ...r3.coords],
          unknownCells: combinedUnknowns,
          starsNeeded: combinedNeed,
          regionIds: new Set([r1.id, id2, id3]),
        });
      }
    }
  }

  return composites;
}

export default function regionCombinations(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions } = analysis;
  const adjacency = buildAdjacencyGraph(board, regions);

  const composites = findCombinationComposites(
    board,
    cells,
    regions,
    adjacency,
    board.stars,
  );

  if (composites.length === 0) return false;

  // Deduplicate by unknown cell signature
  const seen = new Set<string>();

  for (const composite of composites) {
    const currentUnknowns = composite.unknownCells.filter(
      ([row, col]) => cells[row][col] === "unknown",
    );
    const sig = currentUnknowns.map(coordKey).sort().join("|");

    if (sig === "" || seen.has(sig)) continue;
    seen.add(sig);

    if (analyzeComposite(composite, board, cells, analysis)) {
      return true;
    }
  }

  return false;
}
