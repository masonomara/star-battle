/**
 * Rule 17: Overcounting Surplus
 *
 * Find composites from overcounting surplus.
 * When M rows are fully contained in N regions (N > M), leftover forms composite.
 * - M rows need M × stars
 * - N regions need N × stars
 * - Leftover (region cells outside the M rows) needs (N - M) × stars
 */

import { Board, CellState, Coord } from "../../helpers/types";
import { BoardAnalysis, RegionMeta } from "../../helpers/boardAnalysis";
import { Composite, analyzeComposite } from "../../helpers/compositeAnalysis";
import { coordKey } from "../../helpers/cellKey";

function findOvercountingComposites(
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

  // Build line -> regions mapping using full region extent
  const lineToRegions = new Map<number, Set<number>>();
  const lineHasUnknown = new Array(size).fill(false);

  for (let i = 0; i < size; i++) {
    lineToRegions.set(i, new Set());
  }

  for (const region of activeRegions) {
    // Use allRows/allCols for complete coverage
    const allLines = axis === "row" ? region.rows : region.cols;
    const unknownLines = axis === "row" ? region.unknownRows : region.unknownCols;
    for (const line of allLines) {
      lineToRegions.get(line)!.add(region.id);
    }
    for (const line of unknownLines) {
      lineHasUnknown[line] = true;
    }
  }

  // Find line ranges fully contained in regions with surplus
  // Limit range to board.stars + 2 to avoid huge composites while allowing meaningful surplus
  const maxLineRange = Math.min(board.stars + 2, 8);

  for (let start = 0; start < size; start++) {
    if (!lineHasUnknown[start]) continue;

    const lineSet = new Set<number>();
    const regSet = new Set<number>();

    for (let end = start; end < size && end < start + maxLineRange; end++) {
      if (!lineHasUnknown[end]) continue;

      lineSet.add(end);
      for (const id of lineToRegions.get(end)!) {
        regSet.add(id);
      }

      const M = lineSet.size; // rows
      const N = regSet.size; // regions

      // Overcounting surplus: more regions than rows (N > M)
      // Regions collectively need more stars than rows can provide
      // Leftover = region cells outside these rows
      if (N > M && N <= M + 2) {
        // Verify lines are fully contained in these regions
        let fullyContained = true;
        for (const line of lineSet) {
          for (let i = 0; i < size && fullyContained; i++) {
            const [row, col] = axis === "row" ? [line, i] : [i, line];
            if (cells[row][col] === "unknown" && !regSet.has(board.grid[row][col])) {
              fullyContained = false;
            }
          }
        }

        if (fullyContained) {
          // Leftover = region cells outside these lines
          const leftoverCells: Coord[] = [];
          for (const regId of regSet) {
            const region = regions.get(regId)!;
            for (const [row, col] of region.coords) {
              const lineIdx = axis === "row" ? row : col;
              if (!lineSet.has(lineIdx)) {
                leftoverCells.push([row, col]);
              }
            }
          }

          // Count stars already placed in leftover cells
          const leftoverStarsPlaced = leftoverCells.filter(
            ([row, col]) => cells[row][col] === "star",
          ).length;
          const leftoverStarsNeeded =
            (N - M) * board.stars - leftoverStarsPlaced;

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
              id: `overcount-${axis}-${[...lineSet].sort().join(",")}`,
              source: "counting",
              cells: leftoverCells,
              unknownCells,
              starsNeeded: leftoverStarsNeeded,
              regionIds: regSet,
            });
          }
        }
      }
    }
  }

  return composites;
}

export default function overcountingSurplus(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  const { regions } = analysis;

  const composites: Composite[] = [
    ...findOvercountingComposites(board, cells, regions, "row"),
    ...findOvercountingComposites(board, cells, regions, "col"),
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
