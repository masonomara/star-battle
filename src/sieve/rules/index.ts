import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";
import starNeighbors from "./00-starNeighbors/starNeighbors";
import tilingForcedStarsRow from "./04-tilingForcedStarsRow/tilingForcedStarsRow";
import tilingForcedStarsColumn from "./04-tilingForcedStarsColumn/tilingForcedStarsColumn";
import tilingForcedStarsRegion from "./04-tilingForcedStarsRegion/tilingForcedStarsRegion";
import tilingOverhangMarks from "./04-tilingOverhangMarks/tilingOverhangMarks";
import tilingAdjacencyMarks from "./04-tilingAdjacencyMarks/tilingAdjacencyMarks";

import regionConfinementRow from "./05-regionConfinementRow/regionConfinementRow";
import regionConfinementColumn from "./05-regionConfinementColumn/regionConfinementColumn";
import lineConfinementRow from "./05-lineConfinementRow/lineConfinementRow";
import lineConfinementColumn from "./05-lineConfinementColumn/lineConfinementColumn";
import regionLineOverflowRow from "./03-confinementOverflowRow/regionLineOverflowRow";
import regionLineOverflowColumn from "./03-confinementOverflowColumn/regionLineOverflowColumn";
import hypotheticalRowCapacity from "./99-hypotheticalRowCapacity/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./99-hypotheticalColumnCapacity/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./99-hypotheticalRegionCapacity/hypotheticalRegionCapacity";
import hypotheticalOneByNBreak from "./99-hypotheticalOneByNBreak/hypotheticalOneByNBreak";
import hypotheticalTwoByTwoBreak from "./99-hypotheticalTwoByTwoBreak/hypotheticalTwoByTwoBreak";
import hypotheticalFreeOverflow from "./99-hypotheticalFreeOverflow/hypotheticalFreeOverflow";
import adjacentRegionCapacity from "./99-adjacentRegionCapacity/adjacentRegionCapacity";
import reservedAreaExclusions from "./99-reservedAreaExclusions/reservedAreaExclusions";
import adjacentLineAnalysis from "./99-adjacentLineAnalysis/adjacentLineAnalysis";
import trivialColumn from "./01-trivialMarks/trivialColumn";
import trivialRow from "./01-trivialMarks/trivialRow";
import trivialRegion from "./01-trivialMarks/trivialRegion";
import forcedRow from "./02-forcedPlacements/forcedRow";
import forcedColumn from "./02-forcedPlacements/forcedColumn";
import forcedRegion from "./02-forcedPlacements/forcedRegion";
import excludedRow from "./03-exclusion/excludedRow";
import excludedColumn from "./03-exclusion/excludedColumn";

export type Rule = (
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
) => boolean;

export type RuleEntry = {
  rule: Rule;
  level: number;
  name: string;
};

export const allRules: RuleEntry[] = [
  { rule: starNeighbors, level: 0, name: "Star Neighbors" },
  { rule: trivialRow, level: 1, name: "Trivial Row" },
  { rule: trivialColumn, level: 1, name: "Trivial Column" },
  { rule: trivialRegion, level: 1, name: "Trivial Region" },
  { rule: forcedRow, level: 2, name: "Forced Row" },
  { rule: forcedColumn, level: 2, name: "Forced Column" },
  { rule: forcedRegion, level: 2, name: "Forced Region" },
  { rule: excludedRow, level: 3, name: "Excluded Row" },
  { rule: excludedColumn, level: 3, name: "Excluded Column" },
  { rule: regionLineOverflowRow, level: 4, name: "Confinement Overflow (Row)" },
  {
    rule: regionLineOverflowColumn,
    level: 4,
    name: "Confinement Overflow (Column)",
  },
  { rule: tilingForcedStarsRow, level: 4, name: "Tiling Forced Stars (Row)" },
  {
    rule: tilingForcedStarsColumn,
    level: 4,
    name: "Tiling Forced Stars (Column)",
  },
  {
    rule: tilingForcedStarsRegion,
    level: 4,
    name: "Tiling Forced Stars (Region)",
  },
  { rule: tilingAdjacencyMarks, level: 4, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 4, name: "Tiling Overhang Marks" },
  { rule: regionConfinementRow, level: 5, name: "Region Confinement (Row)" },
  {
    rule: regionConfinementColumn,
    level: 5,
    name: "Region Confinement (Column)",
  },
  { rule: lineConfinementRow, level: 5, name: "Line Confinement (Row)" },
  { rule: lineConfinementColumn, level: 5, name: "Line Confinement (Column)" },
  { rule: adjacentRegionCapacity, level: 12, name: "Adjacent Region Capacity" },
  { rule: reservedAreaExclusions, level: 12, name: "Reserved Area Exclusions" },
  { rule: adjacentLineAnalysis, level: 12, name: "Adjacent Line Analysis" },
  {
    rule: hypotheticalRowCapacity,
    level: 20,
    name: "Hypothetical Row Capacity",
  },
  {
    rule: hypotheticalColumnCapacity,
    level: 20,
    name: "Hypothetical Column Capacity",
  },
  {
    rule: hypotheticalRegionCapacity,
    level: 20,
    name: "Hypothetical Region Capacity",
  },
  { rule: hypotheticalOneByNBreak, level: 20, name: "Hypothetical 1×N Break" },
  {
    rule: hypotheticalTwoByTwoBreak,
    level: 20,
    name: "Hypothetical 2×2 Break",
  },
  {
    rule: hypotheticalFreeOverflow,
    level: 20,
    name: "Hypothetical Free Overflow",
  },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
