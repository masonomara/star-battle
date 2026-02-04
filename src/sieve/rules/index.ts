import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";
import starNeighbors from "./01-starNeighbors/starNeighbors";
import rowComplete from "./02-rowComplete/rowComplete";
import columnComplete from "./03-columnComplete/columnComplete";
import regionComplete from "./04-regionComplete/regionComplete";
import forcedPlacementRow from "./05a-forcedPlacementRow/forcedPlacementRow";
import forcedPlacementColumn from "./05b-forcedPlacementColumn/forcedPlacementColumn";
import forcedPlacementRegion from "./05c-forcedPlacementRegion/forcedPlacementRegion";
import tilingForcedStarsRow from "./08a-tilingForcedStarsRow/tilingForcedStarsRow";
import tilingForcedStarsColumn from "./08b-tilingForcedStarsColumn/tilingForcedStarsColumn";
import tilingForcedStarsRegion from "./08c-tilingForcedStarsRegion/tilingForcedStarsRegion";
import tilingOverhangMarks from "./08d-tilingOverhangMarks/tilingOverhangMarks";
import tilingAdjacencyMarks from "./08e-tilingAdjacencyMarks/tilingAdjacencyMarks";
import oneByNConfinement from "./09-oneByNConfinement/oneByNConfinement";
import finnedCounts from "./12-finnedCounts/finnedCounts";
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
  { rule: tilingForcedStarsRow, level: 2, name: "Tiling Forced Stars (Row)" },
  { rule: tilingForcedStarsColumn, level: 2, name: "Tiling Forced Stars (Column)" },
  { rule: tilingForcedStarsRegion, level: 2, name: "Tiling Forced Stars (Region)" },
  { rule: tilingOverhangMarks, level: 2, name: "Tiling Overhang Marks" },
  { rule: tilingAdjacencyMarks, level: 2, name: "Tiling Adjacency Marks" },
  { rule: oneByNConfinement, level: 3, name: "1×n Confinement" },
  { rule: finnedCounts, level: 3, name: "Finned Counts" },
  { rule: reservedAreaExclusions, level: 3, name: "Reserved Area Exclusions" },
  { rule: adjacentLineAnalysis, level: 3, name: "Adjacent Line Analysis" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
