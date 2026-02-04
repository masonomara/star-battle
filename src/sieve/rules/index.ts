import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";
import starNeighbors from "./00-starNeighbors/starNeighbors";
import rowComplete from "./01-rowComplete/rowComplete";
import columnComplete from "./01-columnComplete/columnComplete";
import regionComplete from "./01-regionComplete/regionComplete";
import forcedPlacementRow from "./02-forcedPlacementRow/forcedPlacementRow";
import forcedPlacementColumn from "./02-forcedPlacementColumn/forcedPlacementColumn";
import forcedPlacementRegion from "./02-forcedPlacementRegion/forcedPlacementRegion";
import tilingForcedStarsRow from "./04-tilingForcedStarsRow/tilingForcedStarsRow";
import tilingForcedStarsColumn from "./04-tilingForcedStarsColumn/tilingForcedStarsColumn";
import tilingForcedStarsRegion from "./04-tilingForcedStarsRegion/tilingForcedStarsRegion";
import tilingOverhangMarks from "./04-tilingOverhangMarks/tilingOverhangMarks";
import tilingAdjacencyMarks from "./04-tilingAdjacencyMarks/tilingAdjacencyMarks";
import confinementMarkRemainderRow from "./03-confinementMarkRemainderRow/confinementMarkRemainderRow";
import confinementMarkRemainderColumn from "./03-confinementMarkRemainderColumn/confinementMarkRemainderColumn";
import regionConfinementRow from "./05-regionConfinementRow/regionConfinementRow";
import regionConfinementColumn from "./05-regionConfinementColumn/regionConfinementColumn";
import lineConfinementRow from "./05-lineConfinementRow/lineConfinementRow";
import lineConfinementColumn from "./05-lineConfinementColumn/lineConfinementColumn";
import hypotheticalRowCapacity from "./12a-hypotheticalRowCapacity/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./12b-hypotheticalColumnCapacity/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./12c-hypotheticalRegionCapacity/hypotheticalRegionCapacity";
import hypotheticalOneByNBreak from "./12d-hypotheticalOneByNBreak/hypotheticalOneByNBreak";
import hypotheticalTwoByTwoBreak from "./12e-hypotheticalTwoByTwoBreak/hypotheticalTwoByTwoBreak";
import hypotheticalFreeOverflow from "./12g-hypotheticalFreeOverflow/hypotheticalFreeOverflow";
import adjacentRegionCapacity from "./12f-adjacentRegionCapacity/adjacentRegionCapacity";
import reservedAreaExclusions from "./14-reservedAreaExclusions/reservedAreaExclusions";
import adjacentLineAnalysis from "./15-adjacentLineAnalysis/adjacentLineAnalysis";

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
  { rule: rowComplete, level: 0, name: "Row Complete" },
  { rule: columnComplete, level: 0, name: "Column Complete" },
  { rule: regionComplete, level: 0, name: "Region Complete" },
  { rule: forcedPlacementRow, level: 1, name: "Forced Placement (Row)" },
  { rule: forcedPlacementColumn, level: 1, name: "Forced Placement (Column)" },
  { rule: forcedPlacementRegion, level: 1, name: "Forced Placement (Region)" },
  {
    rule: confinementMarkRemainderRow,
    level: 2,
    name: "Confinement Mark Remainder (Row)",
  },
  {
    rule: confinementMarkRemainderColumn,
    level: 2,
    name: "Confinement Mark Remainder (Column)",
  },
  { rule: tilingForcedStarsRow, level: 3, name: "Tiling Forced Stars (Row)" },
  {
    rule: tilingForcedStarsColumn,
    level: 3,
    name: "Tiling Forced Stars (Column)",
  },
  {
    rule: tilingForcedStarsRegion,
    level: 3,
    name: "Tiling Forced Stars (Region)",
  },
  { rule: tilingAdjacencyMarks, level: 3, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 3, name: "Tiling Overhang Marks" },

  { rule: regionConfinementRow, level: 4, name: "Region Confinement (Row)" },
  {
    rule: regionConfinementColumn,
    level: 4,
    name: "Region Confinement (Column)",
  },
  { rule: lineConfinementRow, level: 4, name: "Line Confinement (Row)" },
  { rule: lineConfinementColumn, level: 4, name: "Line Confinement (Column)" },
  {
    rule: hypotheticalRowCapacity,
    level: 5,
    name: "Hypothetical Row Capacity",
  },
  {
    rule: hypotheticalColumnCapacity,
    level: 5,
    name: "Hypothetical Column Capacity",
  },
  {
    rule: hypotheticalRegionCapacity,
    level: 5,
    name: "Hypothetical Region Capacity",
  },
  {
    rule: hypotheticalOneByNBreak,
    level: 5,
    name: "Hypothetical 1×N Break",
  },
  {
    rule: hypotheticalTwoByTwoBreak,
    level: 5,
    name: "Hypothetical 2×2 Break",
  },
  {
    rule: hypotheticalFreeOverflow,
    level: 5,
    name: "Hypothetical Free Overflow",
  },
  { rule: adjacentRegionCapacity, level: 6, name: "Adjacent Region Capacity" },
  { rule: reservedAreaExclusions, level: 6, name: "Reserved Area Exclusions" },
  { rule: adjacentLineAnalysis, level: 6, name: "Adjacent Line Analysis" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
