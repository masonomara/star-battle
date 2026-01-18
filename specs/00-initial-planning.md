# Star Battle Mobile App

## Examples

- "Queens" was launched May 2024 on LinkedIn. Became most popular of LinkedIn's three games. Turned weekly users into daily users.
- New York Times (Wordle publishers) added "Two Not Touch" - the same game, different name. Both just for internal use.
- "Star Battle" is a recognized name of the game. There's a fragmented market. Most popular star battle puzzle app (Hoshi) has 59,000 downloads.


_"Star Battle can be classified as an object placement puzzle. Some people refer to it as a cross between Sudoku and Minesweeper."_

## Moat

**Star Battle Generators**
For reliable daily/weekly/monthly puzzles and ability to run ads, I either needed to buy a huge commercial liscence or build a puzzle generator.

- This is not an easily generatized puzzle and theres no good generators available online.
- I beleive this is why this isnt a very popular game

## Monetization

- Ads exist - always shown at bottom of screen
- Remove ads one-time purchase ($2.99)
- No video ads
- Architecture decision for ads/monetization will follow UX & product decisions. What is easiest to get up and running and App Store compliant?

## Features

**Puzzles**

- DAILY/WEEKLY/MONTHLY Star Battles - one available per day/week/month
  - **4-star** 17x17 grid / DAILY
  - **5-star** 21x21 grid / WEEKLY
  - **6-star** 25x25 grid / MONTHLY
- LIBRARY Star Battles - 60 puzzles per category
  - **1-star** 5x5 grid
  - **1-star** 6x6 grid
  - **1-star** 8x8 grid
  - **2-star** 10x10 grid
  - **3-star** 14x14 grid

**Game Preferences**

_Game Preferences will be determined in tandem with creating the Solver's Product Rules. Ex: "Auto-place X's around the Star", "thicker borders"_

1. Auto place X around stars (Default True)
2. Highlight errors (Default True)
3. Thcker borders (Default False)

**Library**

Puzzles sorted by implicit difficulty ('**1-star** 5x5 grid' → '**3-star** 14x14 grid')

**Badges**

- Monthly puzzles give themed badges based on Moon name Ex. "Worm '25" "Harvest '25".
- Weekly Star Battle badges but are like "Highway Sign Tallies"
- Daily you dont get badges, you earn a "streak"

**Design Notes**

- Monochrome background
- Color Themes (tints)
- No login required - anonymous auth to track account, can create account to ensure progress and settings are saved and trasnferrable
- No usernames
- No tutorials
- Puzzle needs to load immediately
- Puzzles available offline
