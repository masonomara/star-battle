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
import { tilingCountingMark } from "./07-tilingCounting/tilingCountingMark";
import { tilingCountingForced } from "./07-tilingCounting/tilingCountingForced";

// Level 8: Direct Hypotheticals
import { hypotheticalCount } from "./08-directHypotheticals/hypotheticalCount";
import hypotheticalRegionCount from "./08-directHypotheticals/hypotheticalRegionCount";

// Level 9: Tiling Hypotheticals
import { hypotheticalCapacity } from "./09-tilingHypotheticals/hypotheticalCapacity";
import hypotheticalRegionCapacity from "./09-tilingHypotheticals/hypotheticalRegionCapacity";

// Level 10: Counting Hypotheticals
import { hypotheticalCounting } from "./10-countingHypotheticals/hypotheticalCounting";

// Level 11: Propagated Hypotheticals
import { propagatedCount } from "./11-propagatedHypotheticals/propagatedCount";
import propagatedRegionCount from "./11-propagatedHypotheticals/propagatedRegionCount";
import { propagatedCapacity } from "./11-propagatedHypotheticals/propagatedCapacity";
import propagatedRegionCapacity from "./11-propagatedHypotheticals/propagatedRegionCapacity";
import { propagatedCounting } from "./11-propagatedHypotheticals/propagatedCounting";

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
  { rule: tilingCountingMark("row"), level: 7, name: "Tiling Counting Mark Rows" },
  { rule: tilingCountingMark("col"), level: 7, name: "Tiling Counting Mark Columns" },
  { rule: tilingCountingForced("row"), level: 7, name: "Tiling Counting Forced Rows" },
  { rule: tilingCountingForced("col"), level: 7, name: "Tiling Counting Forced Columns" },
  { rule: tilingCountingMark("row", 2, 4), level: 7, name: "Group Tiling Counting Mark Rows" },
  { rule: tilingCountingMark("col", 2, 4), level: 7, name: "Group Tiling Counting Mark Columns" },

  // Level 8: Direct Hypotheticals
  { rule: hypotheticalCount("row"), level: 8, name: "Hypothetical Row Count" },
  { rule: hypotheticalCount("col"), level: 8, name: "Hypothetical Column Count" },
  { rule: hypotheticalRegionCount, level: 8, name: "Hypothetical Region Count" },

  // Level 9: Tiling Hypotheticals
  { rule: hypotheticalCapacity("row"), level: 9, name: "Hypothetical Row Capacity" },
  { rule: hypotheticalCapacity("col"), level: 9, name: "Hypothetical Column Capacity" },
  { rule: hypotheticalRegionCapacity, level: 9, name: "Hypothetical Region Capacity" },

  // Level 10: Counting Hypotheticals
  { rule: hypotheticalCounting("row"), level: 10, name: "Hypothetical Counting Row" },
  { rule: hypotheticalCounting("col"), level: 10, name: "Hypothetical Counting Column" },

  // Level 11: Propagated Hypotheticals
  { rule: propagatedCount("row"), level: 11, name: "Propagated Hypothetical Row Count" },
  { rule: propagatedCount("col"), level: 11, name: "Propagated Hypothetical Column Count" },
  { rule: propagatedRegionCount, level: 11, name: "Propagated Hypothetical Region Count" },
  { rule: propagatedCapacity("row"), level: 11, name: "Propagated Hypothetical Row Capacity" },
  { rule: propagatedCapacity("col"), level: 11, name: "Propagated Hypothetical Column Capacity" },
  { rule: propagatedRegionCapacity, level: 11, name: "Propagated Hypothetical Region Capacity" },
  { rule: propagatedCounting("row"), level: 11, name: "Propagated Hypothetical Counting Row" },
  { rule: propagatedCounting("col"), level: 11, name: "Propagated Hypothetical Counting Column" },
];

/** Rule metadata for external use (e.g., CLI reporting) */
export const RULE_METADATA = allRules.map(({ name, level }) => ({
  name,
  level,
}));
