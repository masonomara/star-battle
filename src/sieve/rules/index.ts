import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";
import starNeighbors from "./00-starNeighbors/starNeighbors";
import rowComplete from "./01-rowComplete/rowComplete";
import columnComplete from "./01-columnComplete/columnComplete";
import regionComplete from "./01-regionComplete/regionComplete";
import forcedPlacementRow from "./02-forcedPlacementRow/forcedPlacementRow";
import forcedPlacementColumn from "./02-forcedPlacementColumn/forcedPlacementColumn";
import forcedPlacementRegion from "./02-forcedPlacementRegion/forcedPlacementRegion";
import tilingForcedStarsRow from "./08a-tilingForcedStarsRow/tilingForcedStarsRow";
import tilingForcedStarsColumn from "./08b-tilingForcedStarsColumn/tilingForcedStarsColumn";
import tilingForcedStarsRegion from "./08c-tilingForcedStarsRegion/tilingForcedStarsRegion";
import tilingOverhangMarks from "./08d-tilingOverhangMarks/tilingOverhangMarks";
import tilingAdjacencyMarks from "./08e-tilingAdjacencyMarks/tilingAdjacencyMarks";
import confinementMarkRemainderRow from "./09a-confinementMarkRemainderRow/confinementMarkRemainderRow";
import confinementMarkRemainderColumn from "./09b-confinementMarkRemainderColumn/confinementMarkRemainderColumn";
import regionConfinement from "./12a-regionConfinement/regionConfinement";
import lineConfinement from "./12b-lineConfinement/lineConfinement";
import constrainedQuota from "./12c-constrainedQuota/constrainedQuota";
import adjacentRegionCapacity from "./12d-adjacentRegionCapacity/adjacentRegionCapacity";
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

  { rule: regionConfinement, level: 4, name: "Region Confinement" },
  { rule: lineConfinement, level: 4, name: "Line Confinement" },
  { rule: constrainedQuota, level: 4, name: "Constrained Quota" },
  { rule: adjacentRegionCapacity, level: 4, name: "Adjacent Region Capacity" },
  { rule: reservedAreaExclusions, level: 4, name: "Reserved Area Exclusions" },
  { rule: adjacentLineAnalysis, level: 4, name: "Adjacent Line Analysis" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
