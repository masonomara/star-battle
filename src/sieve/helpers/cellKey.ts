import { Coord } from "./types";

export const cellKey = (r: number, c: number): string => `${r},${c}`;

export const coordKey = (coord: Coord): string => `${coord[0]},${coord[1]}`;

export function parseKey(key: string): Coord {
  const parts = key.split(",");
  if (parts.length !== 2) {
    throw new Error(`Invalid cell key: ${key}`);
  }
  const r = Number(parts[0]);
  const c = Number(parts[1]);
  if (!Number.isFinite(r) || !Number.isFinite(c)) {
    throw new Error(`Invalid cell key: ${key}`);
  }
  return [r, c];
}
