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
import confinementMarkRemainderRow from "./03-confinementSqueezeRow/confinementMarkRemainderRow";
import confinementMarkRemainderColumn from "./03-confinementSqueezeColumn/confinementMarkRemainderColumn";
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
  { rule: rowComplete, level: 1, name: "Row Complete" },
  { rule: columnComplete, level: 1, name: "Column Complete" },
  { rule: regionComplete, level: 1, name: "Region Complete" },
  { rule: forcedPlacementRow, level: 2, name: "Forced Placement (Row)" },
  { rule: forcedPlacementColumn, level: 2, name: "Forced Placement (Column)" },
  { rule: forcedPlacementRegion, level: 2, name: "Forced Placement (Region)" },
  { rule: confinementMarkRemainderRow, level: 3, name: "Confinement Squeeze(Row)" },
  { rule: confinementMarkRemainderColumn, level: 3, name: "Confinement Squeeze (Column)" },
  { rule: regionLineOverflowRow, level: 3, name: "Confinement Overflow (Row)" },
  { rule: regionLineOverflowColumn, level: 3, name: "Confinement Overflow (Column)" },
  { rule: tilingForcedStarsRow, level: 4, name: "Tiling Forced Stars (Row)" },
  { rule: tilingForcedStarsColumn, level: 4, name: "Tiling Forced Stars (Column)" },
  { rule: tilingForcedStarsRegion, level: 4, name: "Tiling Forced Stars (Region)" },
  { rule: tilingAdjacencyMarks, level: 4, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 4, name: "Tiling Overhang Marks" },
  { rule: regionConfinementRow, level: 5, name: "Region Confinement (Row)" },
  { rule: regionConfinementColumn, level: 5, name: "Region Confinement (Column)" },
  { rule: lineConfinementRow, level: 5, name: "Line Confinement (Row)" },
  { rule: lineConfinementColumn, level: 5, name: "Line Confinement (Column)" },
  // { rule: adjacentRegionCapacity, level: 12, name: "Adjacent Region Capacity" },
  // { rule: reservedAreaExclusions, level: 12, name: "Reserved Area Exclusions" },
  // { rule: adjacentLineAnalysis, level: 12, name: "Adjacent Line Analysis" },
  // { rule: hypotheticalRowCapacity, level: 20, name: "Hypothetical Row Capacity" },
  // { rule: hypotheticalColumnCapacity, level: 20, name: "Hypothetical Column Capacity" },
  // { rule: hypotheticalRegionCapacity, level: 20, name: "Hypothetical Region Capacity" },
  // { rule: hypotheticalOneByNBreak, level: 20, name: "Hypothetical 1×N Break" },
  // { rule: hypotheticalTwoByTwoBreak, level: 20, name: "Hypothetical 2×2 Break" },
  // { rule: hypotheticalFreeOverflow, level: 20, name: "Hypothetical Free Overflow" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
