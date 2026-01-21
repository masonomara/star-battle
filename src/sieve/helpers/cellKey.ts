import { Coord } from "./types";

export const cellKey = (r: number, c: number): string => `${r},${c}`;

export const coordKey = (coord: Coord): string => `${coord[0]},${coord[1]}`;
