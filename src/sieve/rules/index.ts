import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";

import regionConfinementRow from "./05-regionConfinementRow/regionConfinementRow";
import regionConfinementColumn from "./05-regionConfinementColumn/regionConfinementColumn";
import lineConfinementRow from "./05-lineConfinementRow/lineConfinementRow";
import lineConfinementColumn from "./05-lineConfinementColumn/lineConfinementColumn";
import pressuredRow from "./04-pressuredPlacements/pressuredRow";
import pressuredColumn from "./04-pressuredPlacements/pressuredColumn";
import hypotheticalRowCapacity from "./99-hypotheticalRowCapacity/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./99-hypotheticalColumnCapacity/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./99-hypotheticalRegionCapacity/hypotheticalRegionCapacity";
import hypotheticalOneByNBreak from "./99-hypotheticalOneByNBreak/hypotheticalOneByNBreak";
import hypotheticalTwoByTwoBreak from "./99-hypotheticalTwoByTwoBreak/hypotheticalTwoByTwoBreak";
import adjacentRegionCapacity from "./99-adjacentRegionCapacity/adjacentRegionCapacity";
import reservedAreaExclusions from "./99-reservedAreaExclusions/reservedAreaExclusions";
import adjacentLineAnalysis from "./99-adjacentLineAnalysis/adjacentLineAnalysis";
import excludedRow from "./03-excludedAreas/excludedRow";
import excludedColumn from "./03-excludedAreas/excludedColumn";
import tilingAdjacencyMarks from "./03-twoByTwoTiling/tilingAdjacencyMarks";
import starNeighbors from "./01-direct-inferences/starNeighbors/starNeighbors";
import trivialRow from "./01-direct-inferences/trivialMarks/trivialRow";
import trivialColumn from "./01-direct-inferences/trivialMarks/trivialColumn";
import trivialRegion from "./01-direct-inferences/trivialMarks/trivialRegion";
import forcedRow from "./01-direct-inferences/forcedPlacements/forcedRow";
import forcedColumn from "./01-direct-inferences/forcedPlacements/forcedColumn";
import forcedRegion from "./01-direct-inferences/forcedPlacements/forcedRegion";
import tilingForcedRow from "./03-twoByTwoTiling/tilingForcedRow"
import tilingForcedColumn from "./03-twoByTwoTiling/tilingForcedColumn"
import tilingOverhangMarks from "./03-twoByTwoTiling/tilingOverhangMarks"

import tilingForcedRegion from "./03-twoByTwoTiling/tilingForcedRegion"


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
  { rule: starNeighbors, level: 1, name: "Trivial Rows" },
  { rule: trivialRow, level: 1, name: "Trivial Rows" },
  { rule: trivialColumn, level: 1, name: "Trivial Columns" },
  { rule: trivialRegion, level: 1, name: "Trivial Regions" },
  { rule: forcedRow, level: 1, name: "Forced Rows" },
  { rule: forcedColumn, level: 1, name: "Forced Columns" },
  { rule: forcedRegion, level: 1, name: "Forced Regions" },
  { rule: excludedRow, level: 3, name: "Excluded Rows" },
  { rule: excludedColumn, level: 3, name: "Excluded Columns" },
  { rule: pressuredRow, level: 4, name: "Pressured Rows" },
  { rule: pressuredColumn, level: 4, name: "Pressured Columns" },
  { rule: tilingForcedRow, level: 4, name: "Tiling Forced Rows" },
  { rule: tilingForcedColumn, level: 4, name: "Tiling Forced Columns" },
  { rule: tilingForcedRegion, level: 4, name: "Tiling Forced Regions" },
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
 
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
