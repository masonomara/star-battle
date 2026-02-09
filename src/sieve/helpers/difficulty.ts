import { SolverResult } from "./types";

export function computeDifficulty(result: SolverResult): number {
  return Math.round(result.maxLevel * 4 + result.cycles / 4);
}
