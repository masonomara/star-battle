import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";

import starNeighbors from "./01-direct-inferences/starNeighbors/starNeighbors";
import trivialRow from "./01-direct-inferences/trivialMarks/trivialRow";
import trivialColumn from "./01-direct-inferences/trivialMarks/trivialColumn";
import trivialRegion from "./01-direct-inferences/trivialMarks/trivialRegion";
import forcedRow from "./01-direct-inferences/forcedPlacements/forcedRow";
import forcedColumn from "./01-direct-inferences/forcedPlacements/forcedColumn";
import forcedRegion from "./01-direct-inferences/forcedPlacements/forcedRegion";

import undercountingRow from "./03-confinement-inferences/undercounting/undercountingRow";
import undercountingColumn from "./03-confinement-inferences/undercounting/undercountingColumn";
import overcountingRow from "./03-confinement-inferences/overcounting/overcountingRow";
import overcountingColumn from "./03-confinement-inferences/overcounting/overcountingColumn";
import consumedLineRow from "./03-confinement-inferences/consumedLines/consumedLineRow";
import consumedLineColumn from "./03-confinement-inferences/consumedLines/consumedLineColumn";
import consumedRegionRow from "./03-confinement-inferences/consumedRegions/consumedRegionRow";
import consumedRegionColumn from "./03-confinement-inferences/consumedRegions/consumedRegionColumn";

import {
  tilingForcedRow,
  tilingForcedColumn,
  tilingForcedRegion,
} from "./05-tiling-enumeration/tilingForced/tilingForced";
import tilingAdjacencyMarks from "./05-tiling-enumeration/tilingAdjacent/tilingAdjacencyMarks";
import tilingOverhangMarks from "./05-tiling-enumeration/tilingOverhang/tilingOverhangMarks";

import hypotheticalRowCount from "./07-direct-hypotheticals/hypotheticalRowCount";
import hypotheticalColumnCount from "./07-direct-hypotheticals/hypotheticalColumnCount";
import hypotheticalRowCapacity from "./07-direct-hypotheticals/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./07-direct-hypotheticals/hypotheticalColumnCapacity";

import hypotheticalRegionCapacity from "./08-tiling-hypotheticals/hypotheticalRegionCapacity";
import hypotheticalAdjacentRegionBreak from "./08-tiling-hypotheticals/hypotheticalAdjacentRegionBreak";
import hypotheticalTwoByTwoBreak from "./08-tiling-hypotheticals/hypotheticalTwoByTwoBreak";

import hypotheticalBindedPlacement from "./09-confinement-hypotheticals/hypotheticalBindedPlacement";

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
  // Level 1: Direct Inferences
  { rule: starNeighbors, level: 1, name: "Star Neighbors" },
  { rule: trivialRow, level: 1, name: "Trivial Rows" },
  { rule: trivialColumn, level: 1, name: "Trivial Columns" },
  { rule: trivialRegion, level: 1, name: "Trivial Regions" },
  { rule: forcedRow, level: 1, name: "Forced Rows" },
  { rule: forcedColumn, level: 1, name: "Forced Columns" },
  { rule: forcedRegion, level: 1, name: "Forced Regions" },

  // Level 2: Tiling Inferences

  // Level 3: Confinement Inferences
  { rule: undercountingRow, level: 3, name: "Undercounted Rows" },
  { rule: undercountingColumn, level: 3, name: "Undercounted Columns" },
  { rule: overcountingRow, level: 3, name: "Overcounted Rows" },
  { rule: overcountingColumn, level: 3, name: "Overcounted Columns" },
  { rule: consumedLineRow, level: 3, name: "Consumed Line Row" },
  { rule: consumedLineColumn, level: 3, name: "Consumed Line Column" },
  { rule: consumedRegionRow, level: 3, name: "Consumed Region Row" },
  { rule: consumedRegionColumn, level: 3, name: "Consumed Region Column" },

  // Level 5: Tiling Enumerations
  { rule: tilingForcedRow, level: 5, name: "Tiling Forced Rows" },
  { rule: tilingForcedColumn, level: 5, name: "Tiling Forced Columns" },
  { rule: tilingForcedRegion, level: 5, name: "Tiling Forced Regions" },
  { rule: tilingAdjacencyMarks, level: 5, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 5, name: "Tiling Overhang Marks" },

  // Level 7: Direct Hypotheticals
  { rule: hypotheticalRowCount, level: 7, name: "Hypothetical Row Count" },
  {
    rule: hypotheticalColumnCount,
    level: 7,
    name: "Hypothetical Column Count",
  },
  {
    rule: hypotheticalRowCapacity,
    level: 7,
    name: "Hypothetical Row Capacity",
  },
  {
    rule: hypotheticalColumnCapacity,
    level: 7,
    name: "Hypothetical Column Capacity",
  },

  // Level 8: Tiling Hypotheticals
  {
    rule: hypotheticalRegionCapacity,
    level: 8,
    name: "Hypothetical Region Capacity",
  },
  {
    rule: hypotheticalAdjacentRegionBreak,
    level: 8,
    name: "Hypothetical Adjacent Region Break",
  },
  {
    rule: hypotheticalTwoByTwoBreak,
    level: 8,
    name: "Hypothetical 2×2 Break",
  },

  // Level 9: Confinement Hypotheticals
  {
    rule: hypotheticalBindedPlacement,
    level: 9,
    name: "Hypothetical Binded Placement",
  },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
