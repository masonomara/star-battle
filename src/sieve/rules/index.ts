import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";

import undercountingRow from "./03-confinement-inferences/undercounting/undercountingRow";
import undercountingColumn from "./03-confinement-inferences/undercounting/undercountingColumn";
import overcountingRow from "./03-confinement-inferences/overcounting/overcountingRow";
import overcountingColumn from "./03-confinement-inferences/overcounting/overcountingColumn";
import hypotheticalRowCapacity from "./99-hypotheticalRowCapacity/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./99-hypotheticalColumnCapacity/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./99-hypotheticalRegionCapacity/hypotheticalRegionCapacity";
import hypotheticalOneByNBreak from "./99-hypotheticalOneByNBreak/hypotheticalOneByNBreak";
import hypotheticalTwoByTwoBreak from "./99-hypotheticalTwoByTwoBreak/hypotheticalTwoByTwoBreak";
import adjacentRegionCapacity from "./99-adjacentRegionCapacity/adjacentRegionCapacity";
import reservedAreaExclusions from "./99-reservedAreaExclusions/reservedAreaExclusions";
import adjacentLineAnalysis from "./99-adjacentLineAnalysis/adjacentLineAnalysis";
import tilingAdjacencyMarks from "./05-tiling-enumeration/tilingAdjacent/tilingAdjacencyMarks";
import starNeighbors from "./01-direct-inferences/starNeighbors/starNeighbors";
import trivialRow from "./01-direct-inferences/trivialMarks/trivialRow";
import trivialColumn from "./01-direct-inferences/trivialMarks/trivialColumn";
import trivialRegion from "./01-direct-inferences/trivialMarks/trivialRegion";
import forcedRow from "./01-direct-inferences/forcedPlacements/forcedRow";
import forcedColumn from "./01-direct-inferences/forcedPlacements/forcedColumn";
import forcedRegion from "./01-direct-inferences/forcedPlacements/forcedRegion";
import {
  tilingForcedRow,
  tilingForcedColumn,
  tilingForcedRegion,
} from "./05-tiling-enumeration/tilingForced/tilingForced";
import tilingOverhangMarks from "./05-tiling-enumeration/tilingOverhang/tilingOverhangMarks";
import consumedLineRow from "./03-confinement-inferences/consumedLines/consumedLineRow";
import consumedLineColumn from "./03-confinement-inferences/consumedLines/consumedLineColumn";
import consumedRegionRow from "./03-confinement-inferences/consumedRegions/consumedRegionRow";
import consumedRegionColumn from "./03-confinement-inferences/consumedRegions/consumedRegionColumn";

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
  { rule: trivialRow, level: 1, name: "Trivial Rows" },
  { rule: trivialColumn, level: 1, name: "Trivial Columns" },
  { rule: trivialRegion, level: 1, name: "Trivial Regions" },
  { rule: forcedRow, level: 1, name: "Forced Rows" },
  { rule: forcedColumn, level: 1, name: "Forced Columns" },
  { rule: forcedRegion, level: 1, name: "Forced Regions" },
  { rule: undercountingRow, level: 2, name: "Undercounted Rows" },
  { rule: undercountingColumn, level: 2, name: "Undercounted Columns" },
  { rule: overcountingRow, level: 2, name: "Overcounted Rows" },
  { rule: overcountingColumn, level: 2, name: "Overcounted Columns" },
  { rule: consumedLineRow, level: 2, name: "Consumed Line Row" },
  { rule: consumedLineColumn, level: 2, name: "Consumed Line Column" },
  { rule: consumedRegionRow, level: 2, name: "Consumed Region Row" },
  { rule: consumedRegionColumn, level: 2, name: "Consumed Region Column" },
  { rule: tilingForcedRow, level: 3, name: "Tiling Forced Rows" },
  { rule: tilingForcedColumn, level: 3, name: "Tiling Forced Columns" },
  { rule: tilingForcedRegion, level: 3, name: "Tiling Forced Regions" },
  { rule: tilingAdjacencyMarks, level: 3, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 3, name: "Tiling Overhang Marks" },
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
