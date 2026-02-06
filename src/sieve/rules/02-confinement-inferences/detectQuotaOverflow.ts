/**
 * Shared detection: Quota Overflow
 *
 * When container A needs N stars but container B can contribute at most M,
 * A must place N - M stars outside B. If the cells of A outside B number
 * exactly N - M, those cells are all forced stars.
 *
 * Works for any container pair: region × column, region × row,
 * row × region, column × region.
 */

import { Coord, Deduction } from "../../helpers/types";

export function detectQuotaOverflow(
  starsNeeded: number,
  maxContribution: number,
  cellsOutside: Coord[],
): Deduction[] {
  const overflow = starsNeeded - maxContribution;
  if (overflow <= 0) return [];
  if (cellsOutside.length !== overflow) return [];

  return cellsOutside.map((coord) => ({ coord, state: "star" as const }));
}
