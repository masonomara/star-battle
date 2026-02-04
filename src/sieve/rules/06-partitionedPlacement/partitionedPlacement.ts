import { getRegionCoords } from "../../helpers/regions";
import { Board, CellState, Coord } from "../../helpers/types";
import { maxIndependentSetSize } from "../../helpers/tiling";
import { coordKey } from "../../helpers/cellKey";

/**
 * Find connected components of coordinates using 8-connected adjacency.
 * Returns array of disconnected component coordinate arrays.
 */
function findConnectedComponents(coords: Coord[]): Coord[][] {
  if (coords.length === 0) return [];

  const coordSet = new Set(coords.map(coordKey));
  const visited = new Set<string>();
  const components: Coord[][] = [];

  for (const coord of coords) {
    const key = coordKey(coord);
    if (visited.has(key)) continue;

    const component: Coord[] = [];
    const queue: Coord[] = [coord];
    visited.add(key);

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      component.push([row, col]);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nKey = coordKey([row + dr, col + dc]);
          if (coordSet.has(nKey) && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push([row + dr, col + dc]);
          }
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Places a forced star when unknown cells partition into components
 * and sum(MIS per component) equals stars needed.
 *
 * When the total capacity exactly matches the requirement, any singleton
 * component (size 1) must contain a star.
 */
function placePartitionedForced(
  board: Board,
  cells: CellState[][],
  coords: Coord[],
): boolean {
  let stars = 0;
  const unknowns: Coord[] = [];
  for (const [row, col] of coords) {
    if (cells[row][col] === "star") stars++;
    else if (cells[row][col] === "unknown") unknowns.push([row, col]);
  }

  const needed = board.stars - stars;
  if (needed <= 0) return false;

  // Skip if simple forced placement would handle this
  if (unknowns.length <= needed) return false;

  const components = findConnectedComponents(unknowns);

  // Need multiple components for this rule to apply
  if (components.length <= 1) return false;

  // Compute MIS for each component
  const componentMIS = components.map((c) => maxIndependentSetSize(c));
  const totalMIS = componentMIS.reduce((sum, mis) => sum + mis, 0);

  // Only applies when total capacity exactly equals needed
  if (totalMIS !== needed) return false;

  // Find a singleton component that must have a star
  for (let i = 0; i < components.length; i++) {
    if (components[i].length === 1 && componentMIS[i] === 1) {
      const [row, col] = components[i][0];
      cells[row][col] = "star";
      return true;
    }
  }

  return false;
}

export default function partitionedPlacement(
  board: Board,
  cells: CellState[][],
): boolean {
  const size = board.grid.length;

  for (let row = 0; row < size; row++) {
    const coords: Coord[] = [];
    for (let col = 0; col < size; col++) coords.push([row, col]);
    if (placePartitionedForced(board, cells, coords)) return true;
  }

  for (let col = 0; col < size; col++) {
    const coords: Coord[] = [];
    for (let row = 0; row < size; row++) coords.push([row, col]);
    if (placePartitionedForced(board, cells, coords)) return true;
  }

  for (const coords of getRegionCoords(board.grid)) {
    if (placePartitionedForced(board, cells, coords)) return true;
  }

  return false;
}
