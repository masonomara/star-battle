import { Board, CellState } from "../helpers/types";
import { BoardAnalysis } from "../helpers/boardAnalysis";

// Levels 1-3: Direct Inferences
import starNeighbors from "./01-starNeighbors/starNeighbors";
import { forcedPlacement } from "./02-forcedPlacements/forcedPlacement";
import forcedRegion from "./02-forcedPlacements/forcedRegion";
import { trivialMarks } from "./03-trivialMarks/trivialMarks";
import trivialRegion from "./03-trivialMarks/trivialRegion";

// Level 4: Tiling Enumerations
import { tilingForcedLine } from "./04-tilingEnumeration/tilingForcedLine";
import tilingForcedRegion from "./04-tilingEnumeration/tilingForcedRegion";
import tilingAdjacencyMarks from "./04-tilingEnumeration/tilingAdjacencyMarks";
import tilingOverhangMarks from "./04-tilingEnumeration/tilingOverhangMarks";

// Level 5: Counting Enumerations
import { countingMark } from "./05-countingEnumeration/countingMark";

// Level 6: Tiling Pairs
import { tilingPairForced } from "./06-tilingPairs/tilingPairForced";
import { tilingPairAdjacency } from "./06-tilingPairs/tilingPairAdjacency";
import { tilingPairOverhang } from "./06-tilingPairs/tilingPairOverhang";

// Level 7: Tiling Counting + Group Tiling Counting
import tilingCountingMarkRow from "./07-tilingCounting/tilingCountingMarkRow";
import tilingCountingMarkColumn from "./07-tilingCounting/tilingCountingMarkColumn";
import tilingCountingForcedRow from "./07-tilingCounting/tilingCountingForcedRow";
import tilingCountingForcedColumn from "./07-tilingCounting/tilingCountingForcedColumn";
import groupTilingCountingMarkRow from "./07-tilingCounting/groupTilingCountingMarkRow";
import groupTilingCountingMarkColumn from "./07-tilingCounting/groupTilingCountingMarkColumn";

// Level 8: Direct Hypotheticals
import hypotheticalRowCount from "./08-directHypotheticals/hypotheticalRowCount";
import hypotheticalColumnCount from "./08-directHypotheticals/hypotheticalColumnCount";
import hypotheticalRegionCount from "./08-directHypotheticals/hypotheticalRegionCount";

// Level 9: Tiling Hypotheticals
import hypotheticalRowCapacity from "./09-tilingHypotheticals/hypotheticalRowCapacity";
import hypotheticalColumnCapacity from "./09-tilingHypotheticals/hypotheticalColumnCapacity";
import hypotheticalRegionCapacity from "./09-tilingHypotheticals/hypotheticalRegionCapacity";

// Level 10: Counting Hypotheticals
import hypotheticalCountingRow from "./10-countingHypotheticals/hypotheticalCountingRow";
import hypotheticalCountingColumn from "./10-countingHypotheticals/hypotheticalCountingColumn";

// Level 11: Propagated Hypotheticals
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
  // Levels 1-3: Direct Inferences
  { rule: starNeighbors, level: 1, name: "Star Neighbors" },
  { rule: forcedPlacement("row"), level: 2, name: "Forced Rows" },
  { rule: forcedPlacement("col"), level: 2, name: "Forced Columns" },
  { rule: forcedRegion, level: 2, name: "Forced Regions" },
  { rule: trivialMarks("row"), level: 3, name: "Trivial Rows" },
  { rule: trivialMarks("col"), level: 3, name: "Trivial Columns" },
  { rule: trivialRegion, level: 3, name: "Trivial Regions" },

  // Level 4: Tiling Enumerations
  { rule: tilingForcedLine("row"), level: 4, name: "Tiling Forced Rows" },
  { rule: tilingForcedLine("col"), level: 4, name: "Tiling Forced Columns" },
  { rule: tilingForcedRegion, level: 4, name: "Tiling Forced Regions" },
  { rule: tilingAdjacencyMarks, level: 4, name: "Tiling Adjacency Marks" },
  { rule: tilingOverhangMarks, level: 4, name: "Tiling Overhang Marks" },

  // Level 5: Counting Enumerations
  { rule: countingMark("row"), level: 5, name: "Counting Mark Rows" },
  { rule: countingMark("col"), level: 5, name: "Counting Mark Columns" },

  // Level 6: Tiling Pairs
  { rule: tilingPairForced("row"), level: 6, name: "Tiling Pair Forced Rows" },
  { rule: tilingPairForced("col"), level: 6, name: "Tiling Pair Forced Columns" },
  { rule: tilingPairAdjacency("row"), level: 6, name: "Tiling Pair Adjacency Rows" },
  { rule: tilingPairAdjacency("col"), level: 6, name: "Tiling Pair Adjacency Columns" },
  { rule: tilingPairOverhang("row"), level: 6, name: "Tiling Pair Overhang Rows" },
  { rule: tilingPairOverhang("col"), level: 6, name: "Tiling Pair Overhang Columns" },

  // Level 7: Tiling Counting
  { rule: tilingCountingMarkRow, level: 7, name: "Tiling Counting Mark Rows" },
  { rule: tilingCountingMarkColumn, level: 7, name: "Tiling Counting Mark Columns" },
  { rule: tilingCountingForcedRow, level: 7, name: "Tiling Counting Forced Rows" },
  { rule: tilingCountingForcedColumn, level: 7, name: "Tiling Counting Forced Columns" },
  { rule: groupTilingCountingMarkRow, level: 7, name: "Group Tiling Counting Mark Rows" },
  { rule: groupTilingCountingMarkColumn, level: 7, name: "Group Tiling Counting Mark Columns" },

  // Level 8: Direct Hypotheticals
  { rule: hypotheticalRowCount, level: 8, name: "Hypothetical Row Count" },
  { rule: hypotheticalColumnCount, level: 8, name: "Hypothetical Column Count" },
  { rule: hypotheticalRegionCount, level: 8, name: "Hypothetical Region Count" },

  // Level 9: Tiling Hypotheticals
  { rule: hypotheticalRowCapacity, level: 9, name: "Hypothetical Row Capacity" },
  { rule: hypotheticalColumnCapacity, level: 9, name: "Hypothetical Column Capacity" },
  { rule: hypotheticalRegionCapacity, level: 9, name: "Hypothetical Region Capacity" },

  // Level 10: Counting Hypotheticals
  { rule: hypotheticalCountingRow, level: 10, name: "Hypothetical Counting Row" },
  { rule: hypotheticalCountingColumn, level: 10, name: "Hypothetical Counting Column" },

  // Level 11: Propagated Hypotheticals
  { rule: propagatedRowCount, level: 11, name: "Propagated Hypothetical Row Count" },
  { rule: propagatedColumnCount, level: 11, name: "Propagated Hypothetical Column Count" },
  { rule: propagatedRegionCount, level: 11, name: "Propagated Hypothetical Region Count" },
  { rule: propagatedRowCapacity, level: 11, name: "Propagated Hypothetical Row Capacity" },
  { rule: propagatedColumnCapacity, level: 11, name: "Propagated Hypothetical Column Capacity" },
  { rule: propagatedRegionCapacity, level: 11, name: "Propagated Hypothetical Region Capacity" },
  { rule: propagatedCountingRow, level: 11, name: "Propagated Hypothetical Counting Row" },
  { rule: propagatedCountingColumn, level: 11, name: "Propagated Hypothetical Counting Column" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
