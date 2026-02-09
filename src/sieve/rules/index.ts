import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";

// Level 1: Direct Inferences
import starNeighbors from "./01-starNeighbors/starNeighbors";
import forcedRow from "./02-forcedPlacements/forcedRow";
import forcedColumn from "./02-forcedPlacements/forcedColumn";
import forcedRegion from "./02-forcedPlacements/forcedRegion";
import trivialRow from "./03-trivialMarks/trivialRow";
import trivialColumn from "./03-trivialMarks/trivialColumn";
import trivialRegion from "./03-trivialMarks/trivialRegion";

// Level 2: Tiling Enumerations
import tilingForcedRow from "./04-tilingEnumeration/tilingForcedRow";
import tilingForcedColumn from "./04-tilingEnumeration/tilingForcedColumn";
import tilingForcedRegion from "./04-tilingEnumeration/tilingForcedRegion";
import tilingAdjacencyMarks from "./04-tilingEnumeration/tilingAdjacencyMarks";
import tilingOverhangMarks from "./04-tilingEnumeration/tilingOverhangMarks";

// Level 3: Counting Enumerations
import countingMarkRow from "./05-countingEnumeration/countingMarkRow";
import countingMarkColumn from "./05-countingEnumeration/countingMarkColumn";

// Level 4: Tiling Counting
import tilingCountingMarkRow from "./07-tilingCounting/tilingCountingMarkRow";
import tilingCountingMarkColumn from "./07-tilingCounting/tilingCountingMarkColumn";
import tilingCountingForcedRow from "./07-tilingCounting/tilingCountingForcedRow";
import tilingCountingForcedColumn from "./07-tilingCounting/tilingCountingForcedColumn";
import tilingPairForcedRow from "./04-tilingEnumeration/tilingPairForcedRow";
import tilingPairForcedColumn from "./04-tilingEnumeration/tilingPairForcedColumn";
import tilingPairAdjacencyRow from "./04-tilingEnumeration/tilingPairAdjacencyRow";
import tilingPairAdjacencyColumn from "./04-tilingEnumeration/tilingPairAdjacencyColumn";
import tilingPairOverhangRow from "./04-tilingEnumeration/tilingPairOverhangRow";
import tilingPairOverhangColumn from "./04-tilingEnumeration/tilingPairOverhangColumn";

// Level 6: Group Tiling Counting
import groupTilingCountingMarkRow from "./07-tilingCounting/groupTilingCountingMarkRow";
import groupTilingCountingMarkColumn from "./07-tilingCounting/groupTilingCountingMarkColumn";

// Level 7: Direct Hypotheticals
import hypotheticalRowCount from "./08-directHypotheticals/hypotheticalRowCount";
import hypotheticalColumnCount from "./08-directHypotheticals/hypotheticalColumnCount";
import hypotheticalRegionCount from "./08-directHypotheticals/hypotheticalRegionCount";

// Level 8: Tiling Hypotheticals
import hypotheticalRowCapacity from "./09-tilingHypotheticals/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./09-tilingHypotheticals/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./09-tilingHypotheticals/hypotheticalRegionCapacity";

// Level 9: Counting Hypotheticals
import hypotheticalCountingRow from "./10-countingHypotheticals/hypotheticalUndercountingRow";
import hypotheticalCountingColumn from "./10-countingHypotheticals/hypotheticalUndercountingColumn";

// Level 10: Propagated Hypotheticals
import propagatedRowCount from "./11-propagatedHypotheticals/propagatedRowCount";
import propagatedColumnCount from "./11-propagatedHypotheticals/propagatedColumnCount";
import propagatedRegionCount from "./11-propagatedHypotheticals/propagatedRegionCount";
import propagatedRowCapacity from "./11-propagatedHypotheticals/propagatedRowCapacity";
import propagatedColumnCapacity from "./11-propagatedHypotheticals/propagatedColumnCapacity";
import propagatedRegionCapacity from "./11-propagatedHypotheticals/propagatedRegionCapacity";
import propagatedCountingRow from "./11-propagatedHypotheticals/propagatedCountingRow";
import propagatedCountingColumn from "./11-propagatedHypotheticals/propagatedCountingColumn";

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
  { rule: tilingPairForcedRow, level: 2, name: "Tiling Pair Forced Rows" },
  { rule: tilingPairForcedColumn, level: 2, name: "Tiling Pair Forced Columns" },
  { rule: tilingPairAdjacencyRow, level: 2, name: "Tiling Pair Adjacency Rows" },
  { rule: tilingPairAdjacencyColumn, level: 2, name: "Tiling Pair Adjacency Columns" },
  { rule: tilingPairOverhangRow, level: 2, name: "Tiling Pair Overhang Rows" },
  { rule: tilingPairOverhangColumn, level: 2, name: "Tiling Pair Overhang Columns" },

  // Level 3: Counting Enumerations
  { rule: countingMarkRow, level: 3, name: "Counting Mark Rows" },
  { rule: countingMarkColumn, level: 3, name: "Counting Mark Columns" },

  // Level 4: Tiling Counting
  { rule: tilingCountingMarkRow, level: 4, name: "Tiling Counting Mark Rows" },
  { rule: tilingCountingMarkColumn, level: 4, name: "Tiling Counting Mark Columns" },
  { rule: tilingCountingForcedRow, level: 4, name: "Tiling Counting Forced Rows" },
  { rule: tilingCountingForcedColumn, level: 4, name: "Tiling Counting Forced Columns" },

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
