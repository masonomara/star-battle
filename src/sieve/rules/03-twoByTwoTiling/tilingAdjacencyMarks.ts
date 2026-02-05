import { BoardAnalysis } from "../../helpers/boardAnalysis";
import { Board, CellState, Coord, Tile } from "../../helpers/types";

/**
 * Check if two cells are adjacent (including diagonals).
 */
function cellsAreAdjacent(c1: Coord, c2: Coord): boolean {
  return Math.abs(c1[0] - c2[0]) <= 1 && Math.abs(c1[1] - c2[1]) <= 1;
}

/**
 * Rule 8e: Tiling Adjacency Marks
 *
 * When capacity === starsNeeded, each tile contains exactly one star.
 * Cells that would force adjacent stars in ALL tilings cannot be stars.
 */
export default function tilingAdjacencyMarks(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): boolean {
  let changed = false;

  for (const [, meta] of analysis.regions) {
    if (meta.starsNeeded <= 0) continue;

    const tiling = analysis.getTiling(meta.unknownCoords);
    if (tiling.capacity !== meta.starsNeeded) continue;

    const invalidCells = findInvalidCellsDueToAdjacency(
      meta.unknownCoords,
      tiling.tilings,
      cells,
    );

    for (const [row, col] of invalidCells) {
      if (cells[row][col] === "unknown") {
        cells[row][col] = "marked";
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Find cells that cannot be stars because placing a star there
 * would force adjacent stars in ALL minimal tilings.
 */
function findInvalidCellsDueToAdjacency(
  unknownCells: Coord[],
  allMinimalTilings: Tile[][],
  cells: CellState[][],
): Coord[] {
  if (allMinimalTilings.length === 0 || unknownCells.length === 0) return [];

  const invalidCells: Coord[] = [];
  const unknownSet = new Set(unknownCells.map((c) => `${c[0]},${c[1]}`));

  for (const cell of unknownCells) {
    const key = `${cell[0]},${cell[1]}`;
    let canBeStarInSomeTiling = false;

    for (const tiling of allMinimalTilings) {
      const containingTile = tiling.find((tile) =>
        tile.coveredCells.some((c) => `${c[0]},${c[1]}` === key),
      );

      if (!containingTile) continue;

      const otherTiles = tiling.filter((t) => t !== containingTile);

      if (canPlaceStarsInTiles(cell, otherTiles, unknownSet, cells)) {
        canBeStarInSomeTiling = true;
        break;
      }
    }

    if (!canBeStarInSomeTiling) {
      invalidCells.push(cell);
    }
  }

  return invalidCells;
}

/**
 * Check if stars can be placed in the given tiles such that:
 * 1. No star is adjacent to the assumed star at `assumedStar`
 * 2. No two stars are adjacent to each other
 */
function canPlaceStarsInTiles(
  assumedStar: Coord,
  tiles: Tile[],
  unknownSet: Set<string>,
  cells: CellState[][],
): boolean {
  const placed: Coord[] = [];
  const tilesNeedingStars: Coord[][] = [];

  for (const tile of tiles) {
    const existingStar = tile.coveredCells.find(
      ([r, c]) => cells[r][c] === "star",
    );

    if (existingStar) {
      if (cellsAreAdjacent(existingStar, assumedStar)) return false;
      if (placed.some((p) => cellsAreAdjacent(existingStar, p))) return false;
      placed.push(existingStar);
    } else {
      const valid = tile.coveredCells.filter(
        (c) =>
          unknownSet.has(`${c[0]},${c[1]}`) && !cellsAreAdjacent(c, assumedStar),
      );
      if (valid.length === 0) return false;
      tilesNeedingStars.push(valid);
    }
  }

  return assignStars(tilesNeedingStars, 0, placed);
}

/** Backtrack to find if a valid star assignment exists for remaining tiles. */
function assignStars(tiles: Coord[][], idx: number, placed: Coord[]): boolean {
  if (idx >= tiles.length) return true;

  for (const pos of tiles[idx]) {
    if (placed.some((p) => cellsAreAdjacent(pos, p))) continue;
    placed.push(pos);
    if (assignStars(tiles, idx + 1, placed)) return true;
    placed.pop();
  }
  return false;
}
