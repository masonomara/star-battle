# Competitor Analysis

## johnhsrao/star-battle-puzzle

**Repository**: https://github.com/johnhsrao/star-battle-puzzle

### Overview

| Aspect         | **This Codebase**                     | **johnhsrao**                |
| -------------- | ------------------------------------- | ---------------------------- |
| **Purpose**    | Solver + Generator                    | Playable web UI              |
| **Solving**    | 12 production rules, DLX algorithm    | None (validation only)       |
| **Generation** | Full pipeline with difficulty scoring | Loads puzzle files from disk |
| **Scope**      | Ambitious, research-grade             | Simple, pedagogical          |

### What They Do Better

1. **Clean Web Interface**
   - Playable in-browser with canvas rendering
   - Visual feedback, difficulty settings
   - Simpler user experience for playing puzzles

2. **Cleaner ADT Design**
   - Immutable `Puzzle` and `Point` classes with `readonly` fields
   - `ReadonlySet`/`ReadonlyMap` enforces immutability at type level
   - Simpler mental model for puzzle state

3. **Server/Client Architecture**
   - Proper separation for web deployment
   - HTTP-based puzzle loading

4. **Lower Complexity Ceiling**
   - Easier to understand, extend, and maintain
   - Good for a class project or learning TypeScript

### What We Do Better

1. **Actually Solves Puzzles**
   - 12 production rules from trivial to advanced
   - DLX algorithm for exact cover problems (2×2 tiling)
   - No guessing/backtracking - pure human-like deduction

2. **Puzzle Generation**
   - Creates novel puzzles with configurable size/stars
   - Difficulty scoring based on rule complexity + cycles
   - Sieve pipeline filters solvable puzzles

3. **Algorithm Sophistication**
   - Strip detection, confinement analysis
   - Undercounting/overcounting constraints
   - Hypothetical exclusion testing
   - Forced cell identification via tiling intersections

4. **Difficulty Calibration**
   - `maxLevel * 2 + floor(cycles / 5)` formula
   - Can generate puzzles of target difficulty

5. **Deterministic Reproducibility**
   - Seeded RNG for puzzle generation
   - Same seed → same puzzle

### Ideas to Take/Remix

1. **Web Playable Interface**
   - Their canvas-based UI could wrap our solver
   - Add "hint" button that runs one rule cycle and highlights the deduction
   - Show which rule was applied (educational)

2. **Immutable Type Patterns**

   ```typescript
   // Their pattern worth adopting:
   readonly regions: ReadonlyMap<number, ReadonlySet<Point>>

   // vs our mutable:
   cells: CellState[][]
   ```

   Consider immutable board state with copy-on-write for rules.

3. **Server Architecture for Puzzle Service**
   - Expose generator via HTTP API
   - `/generate?size=10&stars=2&difficulty=5`
   - Return puzzle JSON for any frontend to consume

4. **Puzzle File Format**
   - They load `.puzzle` files from disk
   - Could standardize a format for sharing/importing puzzles

### Improvement Opportunities

1. **Performance (Critical)**
   - 10×10 taking 90+ seconds is a blocker
   - DLX early termination once minimum found
   - Precompute region cell maps once per cycle
   - Numeric coordinate keys (`row * size + col`) vs string `"r,c"`

2. **Web UI Layer**
   - Steal their canvas approach
   - Make hints show rule explanations
   - Step-through mode for learning

3. **Hybrid Hint System**
   - Their "difficulty" setting is fake (just changes spinning animation)
   - Our rules could power real hints:
     - Easy: only apply Level 1-2 rules
     - Hard: show no hints
     - Learn: explain each deduction

4. **Puzzle Import/Export**
   - Parse their `.puzzle` format
   - Export generated puzzles for their UI
   - Cross-compatibility

### Bottom Line

**They built a puzzle player. We built a puzzle engine.**

Their codebase is a good reference for:

- Clean TypeScript ADTs
- Simple web UI patterns
- What a "minimum viable" Star Battle app looks like

Our codebase is more valuable for:

- Algorithmic work
- Research into constraint satisfaction
- Generating difficulty-calibrated puzzles

**Remix opportunity**: Our engine + their UI = educational puzzle app with real hints that explain human solving techniques.

---

## StarBattleLab/starbattlelab.github.io

**Repository**: https://github.com/StarBattleLab/starbattlelab.github.io
**Live Demo**: https://starbattlelab.github.io/Main/

### Overview

| Aspect         | **This Codebase**                     | **StarBattleLab**                           |
| -------------- | ------------------------------------- | ------------------------------------------- |
| **Purpose**    | Solver + Generator                    | Full-featured web playground                |
| **Solving**    | 12 production rules, DLX algorithm    | Backtracking + basic constraint propagation |
| **Generation** | Full pipeline with difficulty scoring | Server-side (Python), client decodes        |
| **UI**         | CLI only                              | Polished browser app with themes/mobile     |
| **Scope**      | Algorithm-focused                     | Product-focused                             |

### What They Do Better

1. **Polished Web Experience**
   - Multiple interaction modes (star marking, free drawing, region borders)
   - Customizable themes and color picker
   - Responsive design for desktop and mobile
   - Full undo/redo across all actions

2. **Smart Assists (Auto-X)**
   - Auto-mark adjacent cells around placed stars
   - Auto-fill rows/columns/regions when they hit star capacity
   - Batched compound actions for clean undo

3. **Puzzle Sharing**
   - Star Battle Notation (SBN) format for import/export
   - Compact encoding: dimension + star count + region borders as bitstrings
   - BFS reconstruction of grid from border data

4. **Client-Side Performance**
   - All solving runs in browser (no server roundtrips)
   - Memoization of valid placement combinations
   - Most-constrained-first heuristic for backtracking

5. **Local Storage Persistence**
   - Saves puzzle progress between sessions
   - History serialized as compact character-encoded strings

### What We Do Better

1. **Human-Like Solving (No Guessing)**
   - They use backtracking as fallback
   - We use pure constraint propagation with 12 production rules
   - Our puzzles are guaranteed solvable without trial-and-error

2. **Advanced Deduction Rules**
   - They implement: adjacency, row/col/region completion, forced placement
   - We add: 2×2 tiling (DLX), 1×N confinement, undercounting/overcounting, exclusion, pressured exclusion
   - Our Level 3-5 rules are absent from their solver

3. **Difficulty Scoring**
   - They have no difficulty metric
   - We track `maxLevel` and `cycles` to compute difficulty 1-10
   - Can generate puzzles of target difficulty

4. **Puzzle Generation**
   - They rely on server-side Python generation
   - We generate entirely in TypeScript with seeded RNG
   - Full control over generation parameters

5. **Deterministic Reproducibility**
   - Same seed → same puzzle
   - Important for testing and sharing specific puzzles

### Ideas to Take/Remix

1. **SBN Format**
   - Their compact notation is clever
   - Region borders as bitstrings + BFS reconstruction
   - Could adopt for puzzle sharing/embedding

2. **Auto-X Feature**
   - Toggleable automatic marking of obvious exclusions
   - Good UX for casual players
   - Our Level 1 rules could power this

3. **Compound Action Batching**
   - Group related changes for clean undo/redo
   - Single undo step for "place star + mark 8 neighbors"

4. **Most-Constrained-First Heuristic**
   - They pick region with fewest valid combinations first
   - We could use similar ordering if we ever add backtracking fallback

5. **Mobile-First Responsive Design**
   - Their UI works well on phones
   - Touch-friendly interaction patterns

### Key Differences in Solving Approach

| Aspect         | **This Codebase**           | **StarBattleLab**   |
| -------------- | --------------------------- | ------------------- |
| **Philosophy** | Never guess                 | Guess when stuck    |
| **Fallback**   | Fail if rules insufficient  | Backtracking search |
| **Rules**      | 12 levels of deduction      | ~4 basic rules      |
| **DLX**        | Yes (2×2 tiling)            | No                  |
| **Difficulty** | Measured by rule complexity | Not tracked         |

### Bottom Line

**They built a polished product. We built a sophisticated engine.**

Their codebase is valuable for:

- UX patterns (undo/redo, auto-assists, themes)
- Puzzle serialization format (SBN)
- Mobile-responsive design
- What a complete Star Battle app looks like

Our codebase is stronger for:

- Algorithm correctness (no guessing)
- Advanced human-like deductions
- Difficulty calibration
- Research and education about constraint satisfaction

**Remix opportunity**: Adopt their SBN format and Auto-X UX, but power hints with our 12 production rules. Users could see exactly which human technique solves each step.

---

## gjohnhazel/StarBattleSolver

**Repository**: https://github.com/gjohnhazel/StarBattleSolver
**Live Demo**: https://star-battle-solver.replit.app/

### Overview

| Aspect         | **This Codebase**                     | **gjohnhazel**                          |
| -------------- | ------------------------------------- | --------------------------------------- |
| **Purpose**    | Solver + Generator                    | Hint system + Puzzle creator            |
| **Solving**    | 12 production rules, DLX algorithm    | ~10 pattern-based hints (no full solve) |
| **Generation** | Full pipeline with difficulty scoring | Manual draw mode only                   |
| **UI**         | CLI only                              | React + Tailwind web app                |
| **Stack**      | TypeScript CLI                        | TypeScript + React + Drizzle ORM + Vite |

### What They Do Better

1. **Educational Hint System**
   - Hints explain the strategy, not just the answer
   - Progressive difficulty: basic → sandwich → shape patterns
   - Good for teaching human solving techniques

2. **Shape Pattern Recognition**
   - L-shapes: 4-cell L-regions force edge placement
   - T-shapes: 4-cell T-configurations force corner placement
   - 3×3 squares: centers marked empty (adjacency)
   - 6-cell rectangles: center cells eliminated

3. **Puzzle Creation Mode**
   - Draw boundaries to create custom puzzles
   - Visual boundary editor (horizontal/vertical lines)
   - Save/load puzzles to localStorage

4. **Modern Web Stack**
   - React with Zustand state management
   - Tailwind CSS styling
   - Drizzle ORM for persistence
   - Vite bundling

5. **Auto-X on Star Placement**
   - Placing a star automatically marks 8 neighbors
   - Same as our Level 1 trivialNeighbors rule

### What We Do Better

1. **Complete Solving (vs Hints Only)**
   - They provide hints, we solve to completion
   - They can get stuck; we either solve or know it's unsolvable
   - No backtracking fallback needed

2. **Advanced Constraint Rules**
   - They lack: 2×2 tiling, 1×N confinement, undercounting/overcounting, exclusion
   - Their "multi-unit constraints" are simpler than our Level 3-5 rules
   - No DLX algorithm for exact cover problems

3. **Puzzle Generation**
   - They only have manual puzzle creation
   - We generate random valid puzzles programmatically
   - Difficulty scoring and target generation

4. **Algorithmic Rigor**
   - Their approach is heuristic-driven pattern matching
   - We use formal constraint propagation
   - Our rules are based on Kris Pengy's production rule research

5. **Determinism**
   - Seeded RNG for reproducible generation
   - Same seed → same puzzle

### Their Solving Strategies (Mapped to Ours)

| Their Strategy         | Our Equivalent                  | Notes                              |
| ---------------------- | ------------------------------- | ---------------------------------- |
| Basic row/column       | trivialRows/Columns (L1)        | Same                               |
| Forced placement       | forcedPlacement (L1)            | Same                               |
| Sandwich patterns      | —                               | We don't have this explicitly      |
| L-shape/T-shape        | —                               | We don't have shape-specific rules |
| Single-line region     | oneByNConfinement (L4)          | Similar concept                    |
| 6-cell rectangle       | —                               | We handle via tiling instead       |
| Multi-unit constraints | undercounting/overcounting (L2) | Ours more general                  |
| Regional quotas        | trivialRegions (L1)             | Same                               |

### Ideas to Take/Remix

1. **Named Shape Patterns**
   - Their L-shape/T-shape rules are intuitive for users
   - Could add as "friendly names" for our deductions
   - "This is an L-shape pattern" vs "2×2 tiling forced cell"

2. **Sandwich Pattern**
   - Spacing rule we don't explicitly have
   - Worth investigating if it catches cases our rules miss

3. **Hint Explanations**
   - They focus on teaching, not just solving
   - Our rules could generate human-readable explanations
   - "Row 3 needs 1 more star, only cell (3,7) is available"

4. **Puzzle Draw Mode**
   - Visual boundary editor for custom puzzles
   - Nice for users who want to input puzzles from newspapers/books

5. **Zustand State Management**
   - Clean reactive state pattern
   - Could adopt if we build a web UI

### Key Differences

| Aspect              | **This Codebase**         | **gjohnhazel**     |
| ------------------- | ------------------------- | ------------------ |
| **Goal**            | Solve completely          | Provide hints      |
| **Stuck behavior**  | Fail or report unsolvable | User keeps trying  |
| **Rule basis**      | Formal constraint theory  | Intuitive patterns |
| **Generation**      | Automatic                 | Manual only        |
| **Fixed grid size** | Configurable              | 10×10 with 2 stars |

### Bottom Line

**They built a teaching tool. We built a solving engine.**

Their codebase is valuable for:

- Intuitive shape-based pattern names (L, T, sandwich)
- Hint explanation UX
- Puzzle draw/creation interface
- Modern React/Zustand patterns

Our codebase is stronger for:

- Complete solving without hints
- Advanced rules (DLX, confinement, exclusion)
- Puzzle generation with difficulty control
- Algorithmic foundation

**Remix opportunity**: Use their shape pattern names as "friendly explanations" for our deductions. Add their draw mode for puzzle input. Their educational focus + our algorithmic depth = best learning tool.
