import { SolverResult } from "./types";

// Raw composite: maxLevel (1-11) weighted + cycle contribution.
// Observed range across 1000 KrazyDad puzzles: ~20-60.
const RAW_MIN = 20;
const RAW_MAX = 60;

/** Normalized difficulty on a 1-100 integer scale. */
export function computeDifficulty(result: SolverResult): number {
  const raw = result.maxLevel * 4 + result.cycles / 4;
  const t = (raw - RAW_MIN) / (RAW_MAX - RAW_MIN);
  return Math.max(1, Math.min(100, Math.round(t * 99 + 1)));
}
