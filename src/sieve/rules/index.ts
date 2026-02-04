import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";
import starNeighbors from "./01-starNeighbors/starNeighbors";
import rowComplete from "./02-rowComplete/rowComplete";
import columnComplete from "./03-columnComplete/columnComplete";
import regionComplete from "./04-regionComplete/regionComplete";
import forcedPlacement from "./05-forcedPlacement/forcedPlacement";
import tilingForcedStars from "./08a-tilingForcedStars/tilingForcedStars";
import tilingOverhangMarks from "./08b-tilingOverhangMarks/tilingOverhangMarks";
import tilingAdjacencyMarks from "./08c-tilingAdjacencyMarks/tilingAdjacencyMarks";
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
  { rule: starNeighbors, level: 1, name: "Star Neighbors" },
  { rule: rowComplete, level: 1, name: "Row Complete" },
  { rule: columnComplete, level: 1, name: "Column Complete" },
  { rule: regionComplete, level: 1, name: "Region Complete" },
  { rule: forcedPlacement, level: 1, name: "Forced Placement" },
  { rule: tilingForcedStars, level: 2, name: "Tiling Forced Stars" },
  { rule: tilingOverhangMarks, level: 2, name: "Tiling Overhang Marks" },
  { rule: tilingAdjacencyMarks, level: 2, name: "Tiling Adjacency Marks" },
  { rule: oneByNConfinement, level: 2, name: "1×n Confinement" },
  { rule: finnedCounts, level: 2, name: "Finned Counts" },
  { rule: reservedAreaExclusions, level: 2, name: "Reserved Area Exclusions" },
  { rule: adjacentLineAnalysis, level: 2, name: "Adjacent Line Analysis" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
