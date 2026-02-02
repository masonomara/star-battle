## Rules

At the beginning, there were 14 rules

**Group 1 - Level 0: Trivial Rules**

1. Star Neighbors: Mark all 8 neighboring cells of a star
2. Row Compelte: When all stars in a row are placed, mark the remaining cells
3. Column compelte: When all stars in a column are placed, mark the remaining cells
4. Region complete: When all stars in a region are placed, mark the remaining cells
5. Forced placements: When the number of unknown cells in each row/column/region equals the number of stars needed to complete the row/column/region, place stars in the unknown cells

**Group 2 - Level 1: Exclusion**

6. Exclusion: Mark cells where placing a star would make a row/column/region unable to fit its required stars. Single depth search. Hypothesis test: "if I place a star here, can remaining cells still tile?"

**Group 3 - Level 1: Counting**

7. Overcounting
8. Undercounting

**Group 4 - Level 1: Grouping**

9. 2x2 tiling (for regions)
10. 1xn strips (strips confined to a single row/col)

**Group 5 - Level 1: Squeeze**

11. Squeeze: Tiling over pairs of rows or columns. (ex. 1 10x10 puzzle has two columns, both columns need 2 stars, the pair of columns needs 8 stars. Treat the pair of columns as a "ghost region" and see if any forced palcement or exclusion occurs)

**Group 6 - Level 2: Compounds**

12. pressured exclusion: uses exclusion + awareness of hard contrsaints from 1xn strips and
13. finned counts: hypotheeis test that marks cells that could create under/overcounting violations

**Group 7 - Level 2: Composite Regions**

14. composite regions: creates "ghost regions" from leftover cells from over/undercounting. this works so if a row pair needs exactly 2 stars, finding the mnimal tiling of thsie cells can force palcements

## Current State

- curretn produciton rules were solving 84% of puzzles, pressured exclusion was fundamentally broken

## Step 1: Fixed pressured exclusion

What I did:

- Removed prefilter funtiosn that were too limiting
- Cleaned up bug on 1xn application

Result:

Pressured exclusion usage on krazydad puzzle set with up from 0% to 40%
Only 16/1000 more puzzles were solved.
Is took less time to solve

## Step 2: Had to improve exlusion, explore bifurcation/backtracking

I reviewed the remaning unsolved puzzles (abotu 150 of them) I traced some unsolved puzzles and I was able to complete the first one I tried, but only htrough what I could only describing as "guessing". I learned it was mroe akin to "bifurcation"

I spent some tiem thinking about allowing bifurcation, and is bifurcation soemthing that human solvable puzzles shoudl allow? I decided the linewas too thin, and I wouldnt want to allow a programmed machien to use bifurcation unrestrained. which i learned is valid, but i think the line is too thin to allow a programmed machien to attempt, and I dont want to allow puzzles that arent 100% human solvable. Id rather be overly cautious to not abuse the program with backtracking. Some people like guessing in their puzles, ome do not. I do not. I can only create puzzle sin my own image.

I went and added a new rule that serves as a "bounded bifurcation":

**15) Deep Exclusion** (group 8 - level 3)

- Deep exclusion: Exlcusion but double depth rather than single depth (not unlimited). unlimited was too clsoe to backtracking, and didnt produce much better results

The results werent extremly better, but I felt was a good "final attempt", what a determined player would do. It didnt overlap too far into "guessing" for me. 

I set it up to easily modify the depth of search, I only found 1 puzzle that was able to be compelted by increasing the depth beyond 2, so i jsut kept it at 2 becuase anythign further felt like guessing/getting lucky.

I acknowledge that some puzzle players like to guess, but i figured the complexity of some other rules basicallys till allowed that same feeling. I valued not losing the turst of some pzuzle players who feel a puzzle is unsolvable over "guessy" players

## Step 3: Added banded exclusions

I re-reviewed kris de asis's rules becuase soemthignw as missing, i noted that her second sample puzzle here: https://www.puzzle-star-battle.com/?e=NToxNywzNzMsNTg3 was not being solved by my sovler. I could recognize the apttern and understood that the finned counts implementation was missing it, and that its a valid human rule that just wasnt expliccitely noted. 

**14) Pressured Counting** (group 6 - level 2, all other rules are renumbered)


Modified counting rules

Step 3 results:

got the puzzles down to just 14 unsolvable puzzles



## remainign state

cannot solve 14 puzzles, here are the reminign 14 puzzles I cant solve, here are results form otehr puzzle trackers online
