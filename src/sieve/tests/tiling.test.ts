import { describe, it, expect } from "vitest";
import { findAllMinimalTilings } from "../tiling";
import { CellState, Coord } from "../types";

/**
 * Tiling tests verify minTileCount bounds max stars a region can hold.
 * Used by Rules 6, 8, 9, 12, 14.
 */

const makeGrid = (size: number): CellState[][] =>
  Array(size)
    .fill(null)
    .map(() => Array(size).fill("unknown"));

describe("tiling", () => {
  it("2x2 square needs 1 tile", () => {
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
    expect(result.minTileCount).toBe(1);
  });

  it("L-shape needs 2 tiles (spec example_tiling_1a)", () => {
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
      [2, 1],
    ];
    const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
    expect(result.minTileCount).toBe(2);
  });

  it("8-cell region needs 3 tiles (spec example_tiling_2)", () => {
    const regionCells: Coord[] = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ];
    const result = findAllMinimalTilings(regionCells, makeGrid(4), 4);
    expect(result.minTileCount).toBe(3);
  });

  it("row pair needs 4 tiles (squeeze pattern)", () => {
    const regionCells: Coord[] = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) {
        regionCells.push([r, c]);
      }
    }
    const result = findAllMinimalTilings(regionCells, makeGrid(10), 10);
    expect(result.minTileCount).toBe(4);
  });
});
