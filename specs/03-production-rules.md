## Definitions

**Region**: A contiguous area on the grid outlined by thick borders. Each puzzle has N regions where N equals the grid size (5x5 has 5 regions, 10x10 has 10 regions, etc.).

**Row**: A horizontal line of cells spanning the entire grid from left to right.

**Column**: A vertical line of cells spanning the entire grid from top to bottom.

**Allowed Stars**: The number of stars that must be placed in each row, column, and region. For a 1-star puzzle, each container needs exactly 1 star. For a 2-star puzzle, each container needs exactly 2 stars, etc.

**Cell**: A single space on the board that can be starred, eliminated, or open.

**Starred Cell**: A cell with a star placed in it.

**Eliminated Cell**: A cell that cannot contain a star because:
  - It is adjacent (horizontally, vertically, or diagonally) to a starred cell, OR
  - Its container (region, row, or column) already has the required number of stars, OR
  - Placing a star would make the puzzle unsolvable

**Open Cell**: Any cell that is not starred or eliminated.

## Rules

**Rule 1: Star Count**
Each row, column, and region must have exactly the allowed number of stars (1 star for 1-star puzzles, 2 stars for 2-star puzzles, etc.).

**Rule 2: No Adjacent Stars**
Stars cannot be placed in cells that are adjacent to each other horizontally, vertically, or diagonally.


## Preliminary Steps

1) **Region-Row/Column Overlap**: Check if any region takes up a whole row or column. All stars in that region need to go in that row or column. Eliminate the region's cells outside of that row or column.

2) **Region Containment**: Check any regions are entirely inside one row or one column. All stars for that row or column must go in that region. Eliminate all other cells in that row or column.

## 1-Star Puzzles Solving Steps
