## Framework

React Native

## State Management

Local First with Cloud backup

- Works offline (local is source of truth)
- sync happens invisibly when online
- Silent account setup (how silent can this get?)
- can recover progress on new device
- backend for storage (cloudflare)
- need account system
- conflict resolution if some user plays offline on two devices (edge case; just have most recently played version override)
- optional account creation acts like first entering online and syncs all data
- feasible to store in anonymous auth and then becomes public when they create an account? That way it survives app restart, can upgrade without losing data, and users can restore on uninstall
- do we make account mandatory for purchases? (thinking no)

## Server Syncing

- need to sync purchases (handled by app store; maybe not my problem)
- puzzle completion
- puzzle status
- daily/weekly/monthly puzzle times
- streaks
- settings
- current puzzle state for each puzzle

## Puzzle solver

- solver bundled in app (client-side); used for both hint system and difficulty validation
- hints: run one cycle, return rule used, cells changed, and template-based explanation
  - do not auto-apply the marks; show faded mark for user to fill in
- difficulty rating stored in puzzle metadata

## Puzzle Storage and Delivery

- pregenerate puzzle packs (stored as JSON/binary/SBN)
- daily/weekly/monthly: how to deliver? Downstream decision
- do we hold the seed info, or SBN info and generate the puzzle client side? Or do we hold everything server side, or do users just download the puzzle onto their device when they click it, or is everything light enough to just include in the download?
- this impacts storage space and downstream to next decision
- how do we store the puzzle packs?

## Progression

- within each free puzzle pack, puzzles unlock sequentially (complete puzzle 1 to unlock puzzle 2, etc.)
- "unlock all puzzles" purchase bypasses this gate—all puzzles in free packs become immediately accessible
- paid puzzle packs are a future feature (not in v1)
- win state when a puzzle is complete

## In puzzle mechanics

- board renderer (grid, regions, stars, and marks)
- touch input: tap to cycle empty, star, x, and empty. Must have haptics.
- gesture handling via react-native-gesture-handler (RNGH):
  - movement threshold: TapGestureHandler's maxDist (default 10pt, configurable) prevents taps from firing during scrolls
  - gesture priority: simultaneousHandlers and waitFor props give declarative control over tap vs pan vs pinch conflicts
  - short hold delay: minDurationMs on TapGestureHandler (configurable, default 0) to require brief hold before tap registers
  - pinch-to-zoom: PinchGestureHandler for larger boards that exceed screen size
  - all gestures run on native thread (no JS-thread race conditions)
- auto-x around placed stars (toggle on and off; default on)
- Highlight errors (configurable: off/on)
- Undo/redo buttons
- Win state detection/animation
- timer: pause on background, with option to hide it in settings
- clear board

## Puzzle mechanics settings

- undo
- redo
- hint
- clear board
- settings
  - pin toolbar
  - show board coordinates
  - hide timer
  - highlight errors
  - auto-place x
  - thicker borders (default off)
  - colored regions (default off)
- toolbar appears like FAB with options to toggle between the empty -> mark -> star -> empty tap cycle, just stars, just marks, just clear, and then a color toggle to highlight cells (green, red, yellow, blue, and gray)

## App settings

- theme (light, dark, or midnight)
- remove ads (IAP)
- all subscription options
- buy hints
- privacy policy
- email support
- restore purchases
- create account
- sound (on/off)
- haptic feedback (on/off)
- reset progress

## Hint system

- run solver one cycle, get next deduction
- template-based explanation: each solver rule maps to a hand-written plain-language template (no AI dependency — free, instant, deterministic)
- each user gets three hints; unlimited hints are available for subscription; hint packs available for purchase
- show which cells changed and why; do not mark for user; show faded star/mark where it should go, and let user tap it

## Progression system

- tracks puzzles completed and packs finished
- tracks daily/weekly/monthly streaks (stored locally; synced if account exists)
- tracks locked puzzles

## Monetization

- banner ads: always visible, not rewarded (explore AdMob and AppLovin)
- in app purchases:
  - remove ads (one time purchase)
  - unlock all puzzles (one time purchase; bypasses sequential unlock within free packs)
  - hint packages: 3 free hints total, then pay (each hint ~$0.50; discounts on larger bundles; unlimited hint option)
  - pro package: bundle unlimited hints, all puzzles unlocked, and remove ads
- paid puzzle packs: future feature (tiered pricing by difficulty; not in v1)
- receipt validation (server side or 3rd-party like RevenueCat)
- restore purchases flow

## Local storage

- puzzle progress (per puzzle cell states, time, and completion status)
- settings (auto x, error highlighting, and theme)
- purchase status (remove ads, unlock all, hints, pro package)
- streak data
- all synced to server either anonymously or via account

## Analytics (minimal)

- puzzles started/completed by difficulty
- hint usage rates
- conversion points (where users buy/subscribe, snapshot of their profile, time on app, how many puzzles completed, etc.)
- Crash Reporting

## Error Handling

- Puzzle won't load: show "Sorry partner, this puzzle is having trouble loading" with tap to retry
- Hint fails: show "Sorry partner, this hint is giving us trouble right now" (template-based hints are deterministic, so failures are rare — only on solver/network issues)
- Network fails: silent (local-first means this is invisible; sync retries on next connection)
- Hint count only decrements after successful response, not before request

## UI/UX Navigation

- Home: freeplay and daily/weekly/monthly challenges
- Freeplay (library): puzzle packs by difficulty
- Settings: preferences, account, and restore purchases
- no tutorial; intro pack is 20 puzzles, 5×5 to 8×8, all free; mechanics learned through play

## Theming

- monochrome base
- light, dark, and midnight themes

## Streaks

- Show streaks on homepage on buttons to go to daily/weekly/monthly puzzle

## MVP Priorities
