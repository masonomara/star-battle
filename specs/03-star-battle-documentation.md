### Star Battle Rules

Each puzzle consists of a subdivided grid and specifies a number of stars (e.g., 2★). The objective is to place stars such that:

- Each row, column, and shape contains exactly the specified number of stars.
- No two stars touch horizontally, vertically, or diagonally.

Below is an example 10×10 2★ puzzle and its solution:

### Overview

The most popular variant is 10×10 2★, so most examples on this page focus on 2★ puzzles. That said, many techniques generalize to arbitrary star counts.

Much of Star Battle revolves around bounding the number of stars in specific regions and cross-referencing such bounds with pigeonhole-style logic. While many logical routes can reach the same conclusion, the techniques below offer multiple perspectives that make it easier to spot opportunities for progress.

## 1. The Basics

This section covers the fundamentals of solving Star Battle puzzles: what immediately follows from the rules, plus key observations that lay a foundation for advanced techniques.

### 1.1 Trivial Marks

Since no two stars can touch (even diagonally), you may mark all cells that share an edge or corner with a star.

Since each row (or column) must contain exactly the specified number of stars, you may mark the remainder of a row (or column) once it has that many stars. For example, for 2★:

Since each shape must contain exactly the specified number of stars, you may mark the remainder of a shape once it has that many stars. For example, for 2★:

### 1.2 The 2×2

A 2×2 is the largest region that contains at most one star—this bound follows from stars not being able to touch:

The significance lies in the information you can get from tiling a larger region with 2×2s. In particular:

- The minimum number of 2×2s required to tile a region bounds that region to at most that many stars.
- After tiling, if the number of 2×2s equals the known star count for that region, each 2×2 contains exactly one star.

For example, the following shape can be tiled with a minimum of two 2×2s, meaning it fits at most two stars:

If this were in a 2★ puzzle, we would further know that each 2×2 contains a star. Because one of the 2×2s has only one cell within the region, that cell must contain a star:

As another example, the following shape can fit at most three stars:

Note that there can be many ways to tile a region with 2×2s. The above remains true regardless, and considering several different tilings can yield additional information.

### 1.3 The 1×n

The 1×n (or n×1) refers to regions known to have at least one star but confined to a single row (or column). Such regions can often be identified by partially tiling a shape. In the following 2★ examples, the red cells contain at most one star, implying that the orange cells contain at least one star.

Should multiple 1×ns fall in the same row (or column) and account for every star in that row (or column):

- The remainder of the row (or column) can be marked.
- The bound on each 1×n goes from "at least one star" to "exactly one star." If a 1×n was part of a larger shape, this may adjust the bounds of 2×2s in the remainder of the shape from "at most one star" to "exactly one star."

In the following 2★ example, we get several marks and deduce that each 2×2 in red has exactly one star:

The "pressure" exerted by the left 1×n's presence allows us to identify both stars in the shape on the right. Further, the symmetry of the shape on the left lets us also consider a column-wise 1×n!

### 1.4 Exclusion

Exclusion refers to marks in cells where—should they contain a star—a shape, row, or column would no longer fit the specified star count. This can be deduced by considering a star's immediate marks and attempting to tile the remainder with 2×2s. Such cells can be both inside and outside the considered region, e.g., for 2★:

### 1.5 Pressured Exclusion

Pressured exclusion is like exclusion, but in the presence of other stars or 1×ns. For example, for 2★, we get the following exclusion mark when combined with the 1×n below:

Pressured exclusions can be used extensively with identified star-containing-2×2s, e.g., those found via a squeeze. If the star-containing-2×2 contains marks forming an L or diagonal shape, there's potential for the following marks (highlighted in red) given a star or 1×n present in the corresponding row (or column):

### 1.6 Simple Shapes

By following the above principles—namely a combination of the 2×2 and exclusion—we can often deduce several marks (and occasionally stars) for simple shapes. Such shapes are easy to spot and typically how one starts a solve. It's good to work some of these out and internalize them—this lets you focus on harder-to-spot deductions!

For 2★, below are the stars, marks, and star-containing-2×2s that can be deduced from select simple shapes. Many other shapes readily provide comparable information, but this should be a decent starting point. For each shape below—as an exercise—convince yourself that the deduced information is true:

While the above diagrams highlight star-containing-2×2s, it's worth considering whether each shape also has a 1×n decomposition. In contrast with identifying 2×2 regions with exactly one star, having a row- (or column-) constrained region with at least one star can lead to different, further deductions.

## 2. Counting

Counting in Star Battle generally refers to considering regions of the board with known star counts and seeing how many of their stars are accounted for. For example, considering large groups of consecutive rows (or columns) and cross-referencing them with information about intersected shapes.

### 2.1 Undercounting

Undercounting occurs when a collection of n shapes is completely contained within n rows (or columns). In such cases, the stars in those n rows (or columns) must be in those shapes. This allows marking the cells of the n rows (or columns) that lie outside the n shapes. For example:

### 2.2 Overcounting

Overcounting is equivalent to undercounting from the opposite direction, but may be easier to spot in some situations. Overcounting occurs when a collection of n shapes completely contains n rows (or columns). In such cases, the stars in those shapes must be in those n rows (or columns). This allows marking the cells of each shape that lie outside the n rows (or columns). For example:

### 2.3 Finned Counts

When trying to spot undercounting, shapes will inevitably just barely exceed the necessary conditions. If placing a star in a cell would create an undercounting scenario across rows (or columns) containing that cell, it would force too many stars into the undercounted rows (or columns), and thus can be marked. In the following example, if the marked cells contained stars, it would create an undercounting situation that would have marked those same cells:

Looking from the other direction, we can similarly spot finned overcounting. If placing a star in a cell would create an overcounting scenario across rows (or columns) that do not contain that cell but include that cell's shape, it would force too few stars into the overcounted rows (or columns), and thus can be marked. For example, if the following marked cells contained a star, it would create an overcounting scenario that would have marked those same cells:

### 2.4 Composite Shapes

The previous examples relied on conveniently-located shapes. In all other cases, we count the shapes we can and treat what's left as "composite shapes" with a known star count. In the following 2★ example, three large shapes are contained within five rows. This accounts for six out of ten stars, meaning the remaining area—regardless of specified shapes—can be treated as a composite shape containing four stars (highlighted in green):

Because the composite shape can be minimally tiled with four 2×2s, we can deduce the following:

For another 2★ example, consider the bottom two rows in the following:

From minimally tiling 2×2s, the area in red has at most two stars. The area in blue similarly has at most two stars as a result of being fully contained within a shape. Because there are four stars across two rows, we can deduce that each area has exactly two stars and can view the red area as a composite shape with two stars. This lets us mark the remainder of the shape on the right and gives the following information in the composite shape:

Beyond composite shapes deduced from counting, we can simply combine any regions of known star count into a composite shape containing the sum of those star counts. For example, for 2★, the following two shapes can be better viewed as a composite shape containing four stars:

This perspective shines here because the composite four-star shape can be minimally tiled with four 2×2s! This gives us much more than what each shape yields in isolation:

### 2.5 The Squeeze

A squeeze refers to minimally tiling 2×2s across pairs of consecutive rows (or columns) where every star can be accounted for. While squeezes can be thought of as a special case of forming composite shapes, they deserve separate acknowledgment given how impactful and easy-to-spot they can be. In 2★, we're specifically looking to minimally tile a pair of rows (or columns)—typically ones with existing blocks of marks—with four 2×2s. In the following 2★ example, we can squeeze four 2×2s across the middle pair of columns and get some marks from excluding one of the star-containing-2×2s:

In a more extreme—but not uncommon—2★ example, a squeeze (and subsequent chain of exclusions) can identify all four stars in the pair of columns below:

Even if a squeeze doesn't readily produce stars or marks, identifying several star-containing-2×2s is valuable information. For example, the results from the following (2★) column-wise squeezes account for all four stars in the bottom two rows. This lets us mark the remainder of those rows (highlighted in grey):

In a similar vein, the information from the following (2★) squeeze accounts for both stars in the middle shape. This lets us mark the remainder of that shape (highlighted in grey):

### 2.6 Set Differentials

Parts of the counting section can be further generalized under the concept of computing set differentials. We can add and subtract equivalent sets to identify regions with varying star counts, where addition and subtraction consist of incrementing (or decrementing) a count for each cell within a set while adding (or subtracting) the total star count across that set. Consider the following four shapes of a 10×10 2★ puzzle:

We can add the top and bottom rows of the puzzle. Each row contains exactly two stars, giving an initial total of four stars:

We can add the left- and right-most columns. Each column contains exactly two stars, bringing the total to eight stars. Note that due to overlap, the corner cells have a count of two.

We can now subtract the four shapes. Each shape contains exactly two stars. Having eight stars across the four shapes, this subtraction results in a total of zero stars across the resulting set:

Because the resulting set has no double-counted or negative cells, we can treat it as a region with a known star count of zero. This gives the following marks:

As an exercise, use set differentials to show that the red region in the following 10×10 2★ example has zero stars (and can be marked):

As another exercise, use set differentials to show that the red region in the following 10×10 2★ example has six stars:

Hint

## 3. Uniqueness

Uniqueness involves making deductions under the assumption that a puzzle has only one solution. This is often reasonable because if a puzzle's solution weren't unique, there wouldn't be a logical path forward. I personally avoid it when casually solving hand-set puzzles—as the setter likely had an intended logical route in mind—but I use it extensively when speed-solving computer-generated puzzles.

Most uniqueness-related deductions involve considering how the state of some region can be influenced by the rest of the puzzle. As marks accumulate, situations arise where there's only one way the rest of the puzzle can determine star locations in a region. Spotting cases where uniqueness arguments apply generally involves looking for small shapes that are (almost or completely) engulfed by marks. This section details the most common applicable scenarios, but is not exhaustive.

### 3.1 By a Thread

Consider the following 2★ scenario, where we know there's a star in each of red and blue:

Given that there is already one star in each of the first two columns, the red and blue stars must be in opposite columns. If the yellow cell weren't a star, both red and blue configurations would be possible with no way for the rest of the board to specify which. The yellow cell being a star is the only way the red and blue configuration can be specified:

### 3.2 At Sea

Now consider the following 2★ scenario, where again we know there's a star in each of red and blue:

Here, there's no "thread" by which an adjacent star can influence the bottom-left area. Combined with the observations in 3.1, the red and blue stars can't be in different columns since there's no way for the rest of the board to specify which. In other words, the red and blue stars must be in the same column.

If the stars in red and blue were in the left-most column, the stars in yellow would be in the inner (second) column. In this case, we could swap the stars between the first two columns to produce another valid solution without influencing the rest of the board. To uniquely specify the solution, the red and blue stars must be in the inner (second) column. This further implies that the puzzle will somehow force the stars in yellow to be in the left-most column:

We can also deduce that the red and blue stars must be in the inner (second) column by observing that if the stars were in the left-most column, the second and third columns would fit at most three stars. This observation is specific to 10×10, however.

### 3.3 By a Thread at Sea

Lastly, consider the following 2★ scenario:

Based on 3.2, the red and blue stars must be in the inner (second) column. However—like 3.1—the yellow cell is the only "thread" by which this can be enforced! This gives an additional star in yellow:

## 4. Idiosyncrasies

This section details further nuances that didn't fit in the other sections.

### 4.1 Kissing Ls (2★)

Kissing Ls is an easy-to-spot pattern that shows up relatively often—particularly from the results of a squeeze. The pattern readily gives a mark in 2★, but can still apply in larger puzzles with sufficient pressure from additional stars (or 1×ns). Kissing Ls consists of two L-shaped star-containing-2×2s in the following configuration:

We can get the mark above because a star there would force too many stars into a given row (or column, with vertical Kissing Ls). We can see its application in the following row-wise squeeze:

Counting from the left, the first two star-containing-2×2s form (partially occluded) Kissing Ls. This gives a mark (and a star):

The second and third 2×2s of the squeeze also form Kissing Ls. The resulting mark, however, is not as impactful:

### 4.2 The M (2★)

The M is a region that can be minimally tiled with three 2×2s but in a 2★ puzzle contains at most two stars. The M—which may span multiple shapes—is shown below:

Spotting the M can enable squeezes that otherwise wouldn't be informative. For example, for 2★, the following pair of rows is minimally tiled by five 2×2s:

However, acknowledging that the following (yellow) M has at most two stars, we can squeeze the remaining area of this pair of rows and identify a star:

### 4.3 Pressured Ts (2★)

A Pressured T refers to a 2★ scenario where a T-tetromino has a star (or 1×n) in the same row (or column) as the long 1×3 section of the tetromino. In such cases, the T-tetromino contains at most one star:

Similar to the M, spotting a Pressured T can enable squeezes that otherwise wouldn't be informative. Consider the following 2★ squeeze:

The above squeeze is minimally tiled by five 2×2s, which would normally be uninformative. However, acknowledging the (yellow) Pressured T, the squeeze can give a star (and some marks):

The above example can have two stars in the T-tetromino, e.g., if the left-most 2×2 did not contain a star. The Pressured T perspective suggests that if the left-most 2×2 contained a star, the tetromino would have at most one star and we can tile the remainder of the area to get a star regardless.

### 4.4 Fish

Fish is a term borrowed from an analogous technique in Sudoku. It denotes patterns where across n columns, the stars are constrained to be within the same n rows. In such cases, the rows may be marked in all cells outside those columns. The reverse is also true for n rows having stars constrained to the same n columns. For example, with the following marks in a 2★ puzzle:

Here, the stars across four columns are constrained to the same four rows. Because there are eight stars across the four columns, the eight stars for the four rows are accounted for, allowing us to mark the rest of the shared rows outside those columns (highlighted in grey):

While such cases may arise in 2★ puzzles, they are considerably more prevalent in 1★ puzzles—particularly finned fish, which are one mark away from being a fish. Consider the following marks of a 1★ puzzle, with a finned fish in red:

If placing a star would create a fish and the star would fall in the resulting fish's affected area, we can mark them:

### 4.5 n-Rooks

This applies to s★ puzzles on (4s+2)×(4s+2) grids (e.g., 6×6 1★, 10×10 2★). Here, we'll consider 10×10 2★ puzzles. If we subdivide a 10×10 grid into a 5×5 grid of 2×2s, the 2×2s that don't contain stars will form an n-rooks configuration (i.e., exactly one in every row and column). For example, with the following 2★ star configuration (ignoring shapes):

This is due to there being four stars across a pair of rows (or columns): Should there be two (5×5 n-rooks grid-aligned) empty 2×2s across a pair of rows, we would only fit three stars there.

The applicability of the n-rooks property is well-demonstrated in the following 10×10 2★ puzzle by Maho Yokota:

Consider the following composite shape in the center:

This region has four stars and is minimally tiled with seven 2×2s. It must therefore contain three empty 2×2s in its minimal tiling. Because the shape's tiling is aligned with the 5×5 n-rooks grid, the three empty 2×2s will give us three of the five rooks. Because these three rooks lie in the middle 3×3 of the 5×5 n-rooks grid, the remaining two must lie on opposite corners of the puzzle! Considering the simple shape in the top-right corner, we can identify both corner rooks:

Acknowledging that the remaining rooks lie in the central composite shape, a sea of squeezes reveals that all of these 2×2s contain a star:

Observing that we've identified both stars in the middle-right shape gets us some marks. The rest is an exercise for the reader—try it here!