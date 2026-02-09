import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";

import starNeighbors from "./01-direct-inferences/starNeighbors/starNeighbors";
import trivialRow from "./01-direct-inferences/trivialMarks/trivialRow";
import trivialColumn from "./01-direct-inferences/trivialMarks/trivialColumn";
import trivialRegion from "./01-direct-inferences/trivialMarks/trivialRegion";
import forcedRow from "./01-direct-inferences/forcedPlacements/forcedRow";
import forcedColumn from "./01-direct-inferences/forcedPlacements/forcedColumn";
import forcedRegion from "./01-direct-inferences/forcedPlacements/forcedRegion";

import countingMarkRow from "./03-counting-enumerations/counting/countingMarkRow";
import countingMarkColumn from "./03-counting-enumerations/counting/countingMarkColumn";
import countingForcedRow from "./03-counting-enumerations/counting/countingForcedRow";
import countingForcedColumn from "./03-counting-enumerations/counting/countingForcedColumn";

import {
  tilingForcedRow,
  tilingForcedColumn,
  tilingForcedRegion,
} from "./05-tiling-enumeration/tilingForced/tilingForced";
import tilingAdjacencyMarks from "./05-tiling-enumeration/tilingAdjacent/tilingAdjacencyMarks";
import tilingOverhangMarks from "./05-tiling-enumeration/tilingOverhang/tilingOverhangMarks";
import squeezeForcedRow from "./05-tiling-enumeration/squeeze/squeezeForcedRow";
import squeezeForcedColumn from "./05-tiling-enumeration/squeeze/squeezeForcedColumn";
import squeezeAdjacencyRow from "./05-tiling-enumeration/squeeze/squeezeAdjacencyRow";
import squeezeAdjacencyColumn from "./05-tiling-enumeration/squeeze/squeezeAdjacencyColumn";
import squeezeOverhangRow from "./05-tiling-enumeration/squeeze/squeezeOverhangRow";
import squeezeOverhangColumn from "./05-tiling-enumeration/squeeze/squeezeOverhangColumn";

import tilingCountingMarkRow from "./06-tiling-counting/tilingCountingMarkRow";
import tilingCountingMarkColumn from "./06-tiling-counting/tilingCountingMarkColumn";
import tilingCountingForcedRow from "./06-tiling-counting/tilingCountingForcedRow";
import tilingCountingForcedColumn from "./06-tiling-counting/tilingCountingForcedColumn";
import groupTilingCountingMarkRow from "./06-tiling-counting/groupTilingCountingMarkRow";
import groupTilingCountingMarkColumn from "./06-tiling-counting/groupTilingCountingMarkColumn";

import hypotheticalRowCount from "./07-direct-hypotheticals/hypotheticalRowCount";
import hypotheticalColumnCount from "./07-direct-hypotheticals/hypotheticalColumnCount";
import hypotheticalRegionCount from "./07-direct-hypotheticals/hypotheticalRegionCount";

import hypotheticalRowCapacity from "./08-tiling-hypotheticals/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./08-tiling-hypotheticals/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./08-tiling-hypotheticals/hypotheticalRegionCapacity";

import hypotheticalCountingRow from "./09-confinement-hypotheticals/hypotheticalUndercountingRow";
import hypotheticalCountingColumn from "./09-confinement-hypotheticals/hypotheticalUndercountingColumn";

import propagatedRowCount from "./10-propagated-hypotheticals/propagatedRowCount";
import propagatedColumnCount from "./10-propagated-hypotheticals/propagatedColumnCount";
import propagatedRegionCount from "./10-propagated-hypotheticals/propagatedRegionCount";
import propagatedColumnCapacity from "./10-propagated-hypotheticals/propagatedColumnCapacity";

import propagatedRegionCapacity from "./10-propagated-hypotheticals/propagatedRegionCapacity";
import propagatedRowCapacity from "./10-propagated-hypotheticals/propagatedRowCapacity";
import propagatedCountingColumn from "./10-propagated-hypotheticals/propagatedCountingColumn";

import propagatedCountingRow from "./10-propagated-hypotheticals/propagatedCountingRow";


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
  { rule: forcedRow, level: 1, name: "Forced Rows" },
  { rule: forcedColumn, level: 1, name: "Forced Columns" },
  { rule: forcedRegion, level: 1, name: "Forced Regions" },
  { rule: trivialRow, level: 1, name: "Trivial Rows" },
  { rule: trivialColumn, level: 1, name: "Trivial Columns" },
  { rule: trivialRegion, level: 1, name: "Trivial Regions" },

  // Level 2: Tiling Enumerations
  { rule: tilingForcedRow, level: 2, name: "Tiling Forced Rows" },
  { rule: tilingForcedColumn, level: 2, name: "Tiling Forced Columns" },
  { rule: tilingForcedRegion, level: 2, name: "Tiling Forced Regions" },
  { rule: tilingAdjacencyMarks, level: 2, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 2, name: "Tiling Overhang Marks" },

  // Level 3: Counting Enumerations
  { rule: countingMarkRow, level: 3, name: "Counting Mark Rows" },
  { rule: countingMarkColumn, level: 3, name: "Counting Mark Columns" },
  { rule: countingForcedRow, level: 3, name: "Counting Forced Rows" },
  { rule: countingForcedColumn, level: 3, name: "Counting Forced Columns" },

  // Level 4: Tiling Counting
  { rule: tilingCountingMarkRow, level: 4, name: "Tiling Counting Mark Rows" },
  { rule: tilingCountingMarkColumn, level: 4, name: "Tiling Counting Mark Columns" },
  { rule: tilingCountingForcedRow, level: 4, name: "Tiling Counting Forced Rows" },
  { rule: tilingCountingForcedColumn, level: 4, name: "Tiling Counting Forced Columns" },

  // Level 5: Squeeze
  { rule: squeezeForcedRow, level: 5, name: "Squeeze Forced Rows" },
  { rule: squeezeForcedColumn, level: 5, name: "Squeeze Forced Columns" },
  { rule: squeezeAdjacencyRow, level: 5, name: "Squeeze Adjacency Rows" },
  { rule: squeezeAdjacencyColumn, level: 5, name: "Squeeze Adjacency Columns" },
  { rule: squeezeOverhangRow, level: 5, name: "Squeeze Overhang Rows" },
  { rule: squeezeOverhangColumn, level: 5, name: "Squeeze Overhang Columns" },

  // Level 6: Group Tiling Counting
  { rule: groupTilingCountingMarkRow, level: 6, name: "Group Tiling Counting Mark Rows" },
  { rule: groupTilingCountingMarkColumn, level: 6, name: "Group Tiling Counting Mark Columns" },

  // Level 7: Direct Hypotheticals
  { rule: hypotheticalRowCount, level: 7, name: "Hypothetical Row Count" },
  { rule: hypotheticalColumnCount, level: 7, name: "Hypothetical Column Count" },
  { rule: hypotheticalRegionCount, level: 7, name: "Hypothetical Region Count" },

  // Level 8: Tiling Hypotheticals
  { rule: hypotheticalRowCapacity, level: 8, name: "Hypothetical Row Capacity" },
  { rule: hypotheticalColumnCapacity, level: 8, name: "Hypothetical Column Capacity" },
  { rule: hypotheticalRegionCapacity, level: 8, name: "Hypothetical Region Capacity" },

  // Level 9: Counting Hypotheticals
  { rule: hypotheticalCountingRow, level: 9, name: "Hypothetical Counting Row" },
  { rule: hypotheticalCountingColumn, level: 9, name: "Hypothetical Counting Column" },

  // Level 10: Propagated Hypotheticals
  { rule: propagatedRowCount, level: 10, name: "Propagated Hypothetical Row Count" },
  { rule: propagatedColumnCount, level: 10, name: "Propagated Hypothetical Column Count" },
  { rule: propagatedRegionCount, level: 10, name: "Propagated Hypothetical Region Count" },
  { rule: propagatedRowCapacity, level: 10, name: "Propagated Hypothetical Row Capacity" },
  { rule: propagatedColumnCapacity, level: 10, name: "Propagated Hypothetical Column Capacity" },
  { rule: propagatedRegionCapacity, level: 10, name: "Propagated Hypothetical Region Capacity" },
  { rule: propagatedCountingRow, level: 10, name: "Propagated Hypothetical Counting Row" },
  { rule: propagatedCountingColumn, level: 10, name: "Propagated Hypothetical Counting Column" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
