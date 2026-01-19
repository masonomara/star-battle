# Production Rules

**Based off of Kris Pengy's Article:** https://kris.pengy.ca/starbattle

## Rules

Each puzzle consists of a subdivided grid and specifies a number of stars (e.g., 2★). The objective is to place stars such that:

- Each row, column, and region contains exactly the specified number of stars.
- No two stars can touch horizontally, vertically, or diagonally.

Below is an example of a 10x10 2★ puzzle and its solution:

![Sample Puzzle](/docs/specs/images/sample_puzzle.png) ![Sample Solution](/docs/specs/images/sample_solution.png)

The most popular variant is 10×10 2★, so most examples on this page focus on 2★ puzzles. That said, many techniques generalize to arbitrary star counts.

Much of Star Battle revolves around bounding the number of stars in specific regions and cross-referencing such bounds with pigeonhole-style logic. While many logical routes can reach the same conclusion, the techniques below offer multiple perspectives that make it easier to spot opportunities for progress.

## 1. The Basics

This section covers the fundamentals of solving Star Battle puzzles: what immediately follows from the rules, plus key observations that lay a foundation for advanced techniques.

### 1.1 Trivial Marks

Since no two stars can touch (even diagonally), you may mark all cells that share an edge or corner with a star.

Since each row (or column) must contain exactly the specified number of stars, you may mark the remainder of a row (or column) once it has that many stars. For example, for 2★:

Since each region must contain exactly the specified number of stars, you may mark the remainder of a region once it has that many stars. For example, for 2★:

### 1.2 The 2×2

A 2×2 is the largest region that contains at most one star—this bound follows from stars not being able to touch:

The significance lies in the information you can get from tiling a larger region with 2×2s. In particular:

- The minimum number of 2×2s required to tile a region bounds that region to at most that many stars.
- After tiling, if the number of 2×2s equals the known star count for that region, each 2×2 contains exactly one star.

For example, the following region can be tiled with a minimum of two 2×2s, meaning it fits at most two stars:

If this were in a 2★ puzzle, we would further know that each 2×2 contains a star. Because one of the 2×2s has only one cell within the region, that cell must contain a star:

As another example, the following region can fit at most three stars:

Note that there can be many ways to tile a region with 2×2s. The above remains true regardless, and considering several different tilings can yield additional information.

### 1.3 The 1×n

The 1×n (or n×1) refers to regions known to have at least one star but confined to a single row (or column). Such regions can often be identified by partially tiling a region. In the following 2★ examples, the red cells contain at most one star, implying that the orange cells contain at least one star.

Should multiple 1×ns fall in the same row (or column) and account for every star in that row (or column):

- The remainder of the row (or column) can be marked.
- The bound on each 1×n goes from "at least one star" to "exactly one star." If a 1×n was part of a larger region, this may adjust the bounds of 2×2s in the remainder of the region from "at most one star" to "exactly one star."

In the following 2★ example, we get several marks and deduce that each 2×2 in red has exactly one star:

The "pressure" exerted by the left 1×n's presence allows us to identify both stars in the region on the right. Further, the symmetry of the region on the left lets us also consider a column-wise 1×n!

### 1.4 Exclusion

Exclusion refers to marks in cells where—should they contain a star—a region, row, or column would no longer fit the specified star count. This can be deduced by considering a star's immediate marks and attempting to tile the remainder with 2×2s. Such cells can be both inside and outside the considered region, e.g., for 2★:

### 1.5 Pressured Exclusion

Pressured exclusion is like exclusion, but in the presence of other stars or 1×ns. For example, for 2★, we get the following exclusion mark when combined with the 1×n below:

Pressured exclusions can be used extensively with identified star-containing-2×2s, e.g., those found via a squeeze. If the star-containing-2×2 contains marks forming an L or diagonal region, there's potential for the following marks (highlighted in red) given a star or 1×n present in the corresponding row (or column):

## 2. Counting

Counting in Star Battle generally refers to considering regions of the board with known star counts and seeing how many of their stars are accounted for. For example, considering large groups of consecutive rows (or columns) and cross-referencing them with information about intersected regions.

### 2.1 Undercounting

Undercounting occurs when a collection of n regions is completely contained within n rows (or columns). In such cases, the stars in those n rows (or columns) must be in those regions. This allows marking the cells of the n rows (or columns) that lie outside the n regions. For example:

### 2.2 Overcounting

Overcounting is equivalent to undercounting from the opposite direction, but may be easier to spot in some situations. Overcounting occurs when a collection of n regions completely contains n rows (or columns). In such cases, the stars in those regions must be in those n rows (or columns). This allows marking the cells of each region that lie outside the n rows (or columns). For example:

### 2.3 Finned Counts

When trying to spot undercounting, regions will inevitably just barely exceed the necessary conditions. If placing a star in a cell would create an undercounting scenario across rows (or columns) containing that cell, it would force too many stars into the undercounted rows (or columns), and thus can be marked. In the following example, if the marked cells contained stars, it would create an undercounting situation that would have marked those same cells:

Looking from the other direction, we can similarly spot finned overcounting. If placing a star in a cell would create an overcounting scenario across rows (or columns) that do not contain that cell but include that cell's region, it would force too few stars into the overcounted rows (or columns), and thus can be marked. For example, if the following marked cells contained a star, it would create an overcounting scenario that would have marked those same cells:

### 2.4 Composite Regions

The previous examples relied on conveniently-located regions. In all other cases, we count the regions we can and treat what's left as "composite regions" with a known star count. In the following 2★ example, three large regions are contained within five rows. This accounts for six out of ten stars, meaning the remaining area—regardless of specified regions—can be treated as a composite region containing four stars (highlighted in green):

Because the composite region can be minimally tiled with four 2×2s, we can deduce the following:

For another 2★ example, consider the bottom two rows in the following:

From minimally tiling 2×2s, the area in red has at most two stars. The area in blue similarly has at most two stars as a result of being fully contained within a region. Because there are four stars across two rows, we can deduce that each area has exactly two stars and can view the red area as a composite region with two stars. This lets us mark the remainder of the region on the right and gives the following information in the composite region:

Beyond composite regions deduced from counting, we can simply combine any regions of known star count into a composite region containing the sum of those star counts. For example, for 2★, the following two regions can be better viewed as a composite region containing four stars:

This perspective shines here because the composite four-star region can be minimally tiled with four 2×2s! This gives us much more than what each region yields in isolation:

### 2.5 The Squeeze

A squeeze refers to minimally tiling 2×2s across pairs of consecutive rows (or columns) where every star can be accounted for. While squeezes can be thought of as a special case of forming composite regions, they deserve separate acknowledgment given how impactful and easy-to-spot they can be. In 2★, we're specifically looking to minimally tile a pair of rows (or columns)—typically ones with existing blocks of marks—with four 2×2s. In the following 2★ example, we can squeeze four 2×2s across the middle pair of columns and get some marks from excluding one of the star-containing-2×2s:

In a more extreme—but not uncommon—2★ example, a squeeze (and subsequent chain of exclusions) can identify all four stars in the pair of columns below:

Even if a squeeze doesn't readily produce stars or marks, identifying several star-containing-2×2s is valuable information. For example, the results from the following (2★) column-wise squeezes account for all four stars in the bottom two rows. This lets us mark the remainder of those rows (highlighted in grey):

In a similar vein, the information from the following (2★) squeeze accounts for both stars in the middle region. This lets us mark the remainder of that region (highlighted in grey):

## 3. Implementation Mapping

Maps each rule to its function name in `src/sieve/rules.ts`. Rules are applied in order by the solver.

| Rule                    | Function Name           | Level | Description                                     |
| ----------------------- | ----------------------- | ----- | ----------------------------------------------- |
| 1. Star Neighbors       | `trivialStarMarks`      | 1     | Mark 8 neighbors of placed ★s                   |
| 2. Row Complete         | `trivialRowComplete`    | 1     | Mark remaining cells when row complete          |
| 3. Column Complete      | `trivialColComplete`    | 1     | Mark remaining cells when column complete       |
| 4. Region Complete      | `trivialRegionComplete` | 1     | Mark remaining cells when region complete       |
| 5. Forced Placement     | `forcedPlacement`       | 1     | Place ★s when unknowns = needed ★s              |
| 6. The 2×2              | `twoByTwoTiling`        | 2     | Max 1★ per 2×2; tile regions to find bounds     |
| 7. The 1×n              | `oneByNConfinement`     | 2     | Region's ★s confined to single row/col          |
| 8. Exclusion            | `exclusion`             | 3     | Mark cells that would make region unsolvable    |
| 9. Pressured Exclusion  | `pressuredExclusion`    | 3     | Exclusion with 1×n constraints                  |
| 10. Undercounting       | `undercounting`         | 4     | N regions in N rows → ★s must be in regions     |
| 11. Overcounting        | `overcounting`          | 4     | N regions contain N rows → ★s in those rows     |
| 12. Finned Counts       | `finnedCounts`          | 4     | Cells that would create under/overcounting      |
| 13. Composite Regions   | `compositeRegions`      | 5     | Combine regions with known ★ counts             |
| 14. The Squeeze         | `squeeze`               | 5     | Tile row/col pairs to find ★-containing 2×2s    |

**Level** indicates rule complexity (1 = simplest, 5 = most advanced). The solver tries simpler rules first and only uses advanced rules when stuck. A puzzle's difficulty score is derived from the highest level rule required to solve it.
