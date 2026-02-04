/**
 * Rule 19: Partitioned Regions
 *
 * Find composites from partitioned regions.
 * When marked cells split a region into disconnected components,
 * each component may have a minimum star requirement based on
 * the maximum independent set of the other components.
 */

import { maxIndependentSetSize } from "../../helpers/tiling";
import { Board, CellState } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";
import {
  Composite,
  findConnectedComponents,
  analyzeComposite,
} from "../../helpers/compositeAnalysis";
import { coordKey } from "../../helpers/cellKey";

function findPartitionedRegionComposites(
  _board: Board,
  _cells: CellState[][],
  regions: Map<number, RegionMeta>,
): Composite[] {
  const composites: Composite[] = [];

  for (const [regionId, region] of regions) {
    if (region.starsNeeded <= 0) continue;
    if (region.unknownCoords.length < 2) continue;

    const components = findConnectedComponents(region.unknownCoords);
    if (components.length <= 1) continue;

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const otherCells = components.filter((_, j) => j !== i).flat();

      const maxFromOthers = maxIndependentSetSize(otherCells);
      const minFromThis = Math.max(0, region.starsNeeded - maxFromOthers);

      if (minFromThis > 0) {
        composites.push({
          id: `partition-${regionId}-comp${i}`,
          source: "counting",
          cells: component,
          unknownCells: component,
          starsNeeded: minFromThis,
          regionIds: new Set([regionId]),
        });
      }
    }
  }
  return composites;
}

export default function partitionedRegions(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions } = analysis;

  const composites = findPartitionedRegionComposites(board, cells, regions);

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
