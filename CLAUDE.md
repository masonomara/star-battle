When speaking about production rules, try to emulate my own language, like how I talk abotu Production Rules in @primer.md

@primer.md has evertything you need to knwo abotu the "ethos" of the system

Make everything as simple as possible when you are coding, Everything shoudl focus on being as atomic as possible.

When you chat, speak clearly and concisely. You can speak high level.

Ultimate goal is to get `npx tsx src/sieve/cli.ts --file puzzles.sbn` to 100% solve as fast as possible.


# Puzzle Notation

Standard notation for referencing Star Battle puzzles, cells, and containers. Based on krazydad's Two Not Touch format.

---

## Cells

**Format:** `{Column}{Row}` — column letter (A-J), row number (1-10).

Origin is top-left. Columns go left-to-right, rows go top-to-bottom.

```
     A   B   C   D   E   F   G   H   I   J
  1  A1  B1  C1  D1  E1  F1  G1  H1  I1  J1
  2  A2  B2  C2  D2  E2  F2  G2  H2  I2  J2
  3  A3  B3  C3  D3  E3  F3  G3  H3  I3  J3
  ...
 10  A10 B10 C10 D10 E10 F10 G10 H10 I10 J10
```

**To solver coords:** `A1` = `(row=0, col=0)`, `J10` = `(row=9, col=9)`.

- `row = number - 1`
- `col = letter charCode - 65` (A=0, B=1, ..., J=9)

---

## Containers

| Type   | Notation              | Examples                         |
| ------ | --------------------- | -------------------------------- |
| Row    | `Row-{n}`             | `Row-1` (top), `Row-10` (bottom) |
| Column | `Col-{a}` (lowercase) | `Col-a` (left), `Col-j` (right)  |
| Region | `Cage-{n}`            | `Cage-1` through `Cage-10`       |

Regions are numbered by the order they appear in the layout string (first letter encountered = Cage-1, second new letter = Cage-2, etc.). In practice, krazydad labels them A-J in the layout and Cage-1 = A, Cage-2 = B, ..., Cage-10 = J.

**To solver IDs:** `Cage-1` = region 0, `Cage-N` = region N-1.

---

## Layout String

100 characters (for 10x10), read left-to-right top-to-bottom. Each character is the region letter for that cell.

```
AAAABBBBBCAADABBBBBCADDAEEEECCADDAEFFFFFAAAAEEEFFFAGAGHHHHHHIGGGHHHJHHIGGGHHHJHHIGHHHHJJHHIIIIIHHJJJ
```

Row-by-row breakdown:

```
Row 1:  A A A A B B B B B C
Row 2:  A A D A B B B B B C
Row 3:  A D D A E E E E C C
Row 4:  A D D A E F F F F F
Row 5:  A A A A E E E F F F
Row 6:  A G A G H H H H H H
Row 7:  I G G G H H H J H H
Row 8:  I G G G H H H J H H
Row 9:  I G H H H H J J H H
Row 10: I I I I I H H J J J
```

**Puzzle string format:** `{size}x{stars}.{layout}[.{metadata}]`

The layout uses these letters directly. Example: `10x2.AAAABBBBBCAADABBBBBCADDAEEEECCADD...`

Optional metadata tokens follow a second dot: `s{seed}`, `d{difficulty}`, `l{maxLevel}`, `c{cycles}`.

---

## Puzzle ID

**Format:** `KD_TNT_{size}{difficulty}_V{volume}-B{book}-P{puzzle}`

| Field      | Values                | Example            |
| ---------- | --------------------- | ------------------ |
| size       | `10x10`               | grid dimensions    |
| difficulty | `E`, `M`, `H`         | Easy, Medium, Hard |
| volume     | year or volume number | `V2026`            |
| book       | 2-digit book number   | `B02`              |
| puzzle     | 2-digit puzzle number | `P06`              |

Example: `KD_TNT_10x10M_V2026-B02-P06` = 10x10 Medium, Volume 2026, Book 2, Puzzle 6.

---

## Answer String

100 characters of `0` and `1`, left-to-right top-to-bottom. `1` = star, `0` = no star.

```
0000010001001000010000001000010100001000000010001010100000000000010100010100000000000010101001000000
```

---

## Quick Conversion Reference

| Krazydad  | Solver      | Notes           |
| --------- | ----------- | --------------- |
| `A1`      | `(0, 0)`    | top-left        |
| `E5`      | `(4, 4)`    | center-ish      |
| `J10`     | `(9, 9)`    | bottom-right    |
| `Row-1`   | row index 0 |                 |
| `Col-a`   | col index 0 |                 |
| `Cage-1`  | region 0    | layout letter A |
| `Cage-10` | region 9    | layout letter J |
