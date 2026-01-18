# Star Battle Generator and Puzzles

**Star Battle** is an object placement puzzle app that has daily/weekly/monthly puzzles and a library of puzzles.

## CURRENT STATUS

Thinking through technical architecture

## TODOS

- Define each production rule
  - Write a function for it
  - Write a test for each function
- Create a puzzle generator
- Create a puzzle solver

## CORE DOCS

- `specs/00-initial-planning.md`
- `specs/01-puzzle-generator.md`
- `specs/02-initial-architecture.md`

## Tech Stack

- React Native - Mobile app
- Cloudflare Workers (Durable Objects) - Storage and backend functions, anonymous auth

_See `specs/02-initial-architecture.md` for full details_

## Planned Tech Flow

1. DURABLE OBJECT with ALARM triggers at scheduled times (daily at midnight, weekly on Monday, monthly on 1st)
2. ALARM handler invokes a WORKER to run the puzzle generator algorithm
3. WORKER then runs `layout()` and `solve()` in a loop until a valid puzzle is found
4. WORKER then writes the solved puzzle definition to R2 with a key like `daily/2025-12-11.json`
5. WORKER finally updates KV with puzzle metadata for fast CDN access

## File Structure

- `/docs`
  - `/specs` - all specification documents. Each specification builds upon the previous one.
    - `numbered docs` - spec-based development

## Nomenclature

`00` - Ordering of documents.
