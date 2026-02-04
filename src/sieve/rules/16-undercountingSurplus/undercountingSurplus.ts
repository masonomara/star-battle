/**
 * Rule 16: Undercounting Surplus
 *
 * Find composites from undercounting surplus.
 * When N regions fit in M rows (M > N), leftover forms composite.
 * The leftover cells (not in any of the N regions) must contain (M-N)×stars stars.
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";
import { Composite, analyzeComposite } from "../../helpers/compositeAnalysis";
import { coordKey } from "../../helpers/cellKey";

function findUndercountingComposites(
  board: Board,
  cells: CellState[][],
  regions: Map<number, RegionMeta>,
  axis: "row" | "col",
): Composite[] {
  const composites: Composite[] = [];
  const size = board.grid.length;
  const activeRegions = [...regions.values()].filter(
    (r) => r.starsNeeded > 0,
  );

  if (activeRegions.length === 0) return composites;

  for (const seedRegion of activeRegions) {
    // Use allRows/allCols for the seed lines (full region extent)
    const lines = axis === "row" ? seedRegion.rows : seedRegion.cols;
    if (lines.size === 0) continue;

    // Find all regions fully contained in these lines (using full extent)
    const contained = activeRegions.filter((r) => {
      const rLines = axis === "row" ? r.rows : r.cols;
      if (rLines.size === 0) return false;
      return [...rLines].every((l) => lines.has(l));
    });

    const M = lines.size;
    const N = contained.length;

    // Surplus case: more lines than regions
    if (M > N && M <= N + 2) {
      // Limit surplus to avoid huge composites
      const containedIds = new Set(contained.map((r) => r.id));
      const leftoverCells: Coord[] = [];

      for (const lineIdx of lines) {
        for (let i = 0; i < size; i++) {
          const [row, col] = axis === "row" ? [lineIdx, i] : [i, lineIdx];
          if (!containedIds.has(board.grid[row][col])) {
            leftoverCells.push([row, col]);
          }
        }
      }

      // Count stars already placed in leftover cells
      const leftoverStarsPlaced = leftoverCells.filter(
        ([row, col]) => cells[row][col] === "star",
      ).length;
      const leftoverStarsNeeded = (M - N) * board.stars - leftoverStarsPlaced;

      if (leftoverStarsNeeded <= 0) continue;

      const unknownCells = leftoverCells.filter(
        ([row, col]) => cells[row][col] === "unknown",
      );

      // Pre-filter: need enough unknowns and not too many
      // Use higher multiplier for larger star counts
      const maxSlackMultiplier = Math.max(4, board.stars);
      if (
        unknownCells.length >= leftoverStarsNeeded &&
        unknownCells.length <= leftoverStarsNeeded * maxSlackMultiplier
      ) {
        composites.push({
          id: `undercount-${axis}-${[...lines].sort().join(",")}`,
          source: "counting",
          cells: leftoverCells,
          unknownCells,
          starsNeeded: leftoverStarsNeeded,
          regionIds: new Set(),
        });
      }
    }
  }

  return composites;
}

export default function undercountingSurplus(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions } = analysis;

  const composites: Composite[] = [
    ...findUndercountingComposites(board, cells, regions, "row"),
    ...findUndercountingComposites(board, cells, regions, "col"),
  ];

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
