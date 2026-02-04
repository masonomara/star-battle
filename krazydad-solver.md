here is the puzzle to be solved:

```
10x2.0000001111200200111122220113314442011311444500033355555063775555566377558866639788866663978886669997
```

Here is the view source from crazy dad's sovler:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, user-scalable=no"
    />

    <title>Two Not Touch Solution by krazydad</title>
    <meta
      name="keywords"
      content="two not touch,puzzles,star battle,tnt,twonottouch,starbattle,puzzle,interactive puzzles,online puzzles,new york times,nyt"
    />
    <meta name="description" content="Free online Two Not Touch puzzles" />
    <meta
      name="google-site-verification"
      content="Rsnjvc47R6exz2SmoDutB66KqY6YgY8Qood4Vcra-hk"
    />
    <link
      href="https://fonts.googleapis.com/css?family=EB+Garamond&display=swap"
      rel="stylesheet"
      type="text/css"
    />
    <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css" />
    <link
      rel="stylesheet"
      type="text/css"
      href="css/bootstrap-responsive.min.css"
    />
    <link
      rel="stylesheet"
      type="text/css"
      href="css/bootstrap-toggle.min.css"
    />
    <link
      rel="stylesheet"
      type="text/css"
      href="css/jquery.bootstrap-touchspin.min.css"
    />
    <link rel="stylesheet" type="text/css" href="css/common.css" />

    <!-- original version used jquery 2.2.4  jqueryui 1.12.1 -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://code.jquery.com/jquery-migrate-3.5.2.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.14.1/jquery-ui.min.js"></script>

    <link rel="stylesheet" href="css/bootstrap-datepicker3.css" />

    <!-- dynamic style overrides  -->
    <style>
      /* dynamic styling */
      .header-notice {
        font-size: 1rem;
      }
      #canvascontainer {
        position: relative;
        width: 582px;
        min-height: 582px;
        margin: 0 auto;
        margin-bottom: 30px;
        padding: 0;
      }
      #stepcontainer {
        position: absolute;
        top: 580px;
        left: 0px;
        width: 332px;
        height: 32px;
        opacity: 0.8;
        font-size: 16px;
        text-align: left;
        font-family:
          Bookman,
          TimesNewRoman,
          Times New Roman,
          Times,
          Baskerville,
          Georgia,
          serif;
      }
      #stepnav {
        position: absolute;
        top: 580px;
        left: 332px;
        width: 268px;
        height: 32px;
        opacity: 0.8;
        font-size: 12px;
        text-align: left;
        font-family:
          Bookman,
          TimesNewRoman,
          Times New Roman,
          Times,
          Baskerville,
          Georgia,
          serif;
      }
      #spinnercontainer {
        position: absolute;
        top: 100px;
        left: 0px;
        width: 582px;
        text-align: center;
      }
      div#puzzledate {
        font-size: 1.8rem;
      }
      input[type="text"]#date-input {
        width: 280px;
        border: none;
        background: transparent;
        float: none;
        margin-left: 0;
        cursor: pointer;
      }
      .web-underscore {
        text-decoration: underline;
      }
      body {
        display: none;
      }
    </style>
    <script>
      var gPuzzleWidth = 576;
      var gPuzzleHeight = gPuzzleWidth;
      var gGridWidth = 10;
      var gGridHeight = 10;
      var gCurDiff = "M";
      var pRec = {
        puzzleID: "Literal",
        puzz_data: {
          version: 1.3,
          gw: 10,
          gh: 10,
          stars: 2,
          layout:
            "AAAAAABBBBCAACAABBBBCCCCABBDDBEEECABBDBBEEEFAAADDDFFFFFAGDHHFFFFFGGDHHFFIIGGGDJHIIIGGGGDJHIIIGGGJJJH",
          answer:
            "0010100000100000100000010000101000010000001000010000001000010100001000000100001001000100000000000101",
          puzzleID: "Literal",
        },
        steps: [
          {
            step: 1,
            dots: "B4",
            his: "A4,C4,A5,B5,C5",
            rhi: "Cage-5",
            hi4s: "B4",
            reasons: ["CLEAR B4:  it crowds Cage-5 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 2,
            dots: "B4,B5",
            his: "A4,C4,A5,C5",
            rhi: "Cage-5",
            hi4s: "B5",
            reasons: ["CLEAR B5:  it crowds Cage-5 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 3,
            dots: "B4,B5,H9",
            his: "I8,I9,G10,H10,I10",
            rhi: "Cage-10",
            hi4s: "H9",
            reasons: ["CLEAR H9:  it crowds Cage-10 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 4,
            dots: "B4,B5,H9,D5,D4",
            his: "C4,C5",
            rhi: "Cage-5",
            hi4s: "D5,D4",
            reasons: [
              "CLEAR D4:  it crowds Cage-5 (subclump)",
              "CLEAR D5:  it crowds Cage-5 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 5,
            dots: "B4,B5,H9,D5,D4,C2",
            his: "D2,C3,D3",
            rhi: "Cage-3",
            hi4s: "C2",
            reasons: ["CLEAR C2:  it crowds Cage-3 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 6,
            dots: "B4,B5,H9,D5,D4,C2,B2",
            his: "A2,A3,B3",
            rhi: "Cage-3",
            hi4s: "B2",
            reasons: ["CLEAR B2:  it crowds Cage-3 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 7,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9",
            his: "J8,J9,J10",
            rhi: "Cage-8",
            hi4s: "I9",
            reasons: ["CLEAR I9:  it crowds Cage-8 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 8,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9",
            his: "C8,D8,C9,C10",
            rhi: "Cage-9",
            hi4s: "D9",
            reasons: ["CLEAR D9:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 9,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9",
            his: "I8,I10",
            rhi: "Cage-10",
            hi4s: "J9",
            reasons: ["CLEAR J9:  it crowds Cage-10 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 10,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7",
            his: "A1,B1,C1,D1,E1,F1,G1,H1,I1,J1,A2,D2,E2,F2,G2,H2,I2,J2,A3,B3,C3,D3,E3,F3,G3,H3,I3,J3,A4,C4,E4,F4,G4,H4,I4,J4,A5,C5,E5,F5,G5,H5,I5,J5",
            rhi: "Cage-1,Cage-2,Cage-3,Cage-4,Cage-5",
            hi4s: "H8,F6,H6,H7",
            reasons: [
              "CLEAR F6: not in a container cabal formed by Row-1,Row-2,Row-3,Row-4,Row-5 and Cage-1,Cage-2,Cage-3,Cage-4,Cage-5",
              "CLEAR H6: not in a container cabal formed by Row-1,Row-2,Row-3,Row-4,Row-5 and Cage-1,Cage-2,Cage-3,Cage-4,Cage-5",
              "CLEAR H7: not in a container cabal formed by Row-1,Row-2,Row-3,Row-4,Row-5 and Cage-1,Cage-2,Cage-3,Cage-4,Cage-5",
              "CLEAR H8: not in a container cabal formed by Row-1,Row-2,Row-3,Row-4,Row-5 and Cage-1,Cage-2,Cage-3,Cage-4,Cage-5",
            ],
            caption:
              "The remaining open squares in five rows fit within the five highlighted regions. These form a container-cabal that must contain all the stars for those regions. The remaining squares in the regions can be cleared.",
          },
          {
            step: 11,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4",
            his: "H3,I3,H4,H5,I5,J5",
            rhi: "Cage-4",
            hi4s: "I4",
            reasons: ["CLEAR I4:  it crowds Cage-4 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 12,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6",
            his: "H5,I5,J5",
            rhi: "Cage-4",
            hi4s: "I6",
            reasons: ["CLEAR I6:  it crowds Cage-4 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 13,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7",
            his: "J6,J7,I8,J8",
            rhi: "Row-6,Row-7,Row-8,Row-9",
            hi4s: "I7",
            reasons: [
              "CLEAR I7:  it crowds Row-6,Row-7,Row-8,Row-9 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 14,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4",
            his: "J6,J7,J8,J10",
            rhi: "Cage-8",
            hi4s: "J5,J1,J2,J3,J4",
            reasons: [
              "CLEAR J1: not in a container cabal formed by Cage-8 and Col-j",
              "CLEAR J2: not in a container cabal formed by Cage-8 and Col-j",
              "CLEAR J3: not in a container cabal formed by Cage-8 and Col-j",
              "CLEAR J4: not in a container cabal formed by Cage-8 and Col-j",
              "CLEAR J5: not in a container cabal formed by Cage-8 and Col-j",
            ],
            caption:
              "The remaining open squares in the highlighted region fit within one column. The column contains all the stars for the region, so the remaining squares in the column can be cleared.",
          },
          {
            step: 15,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4",
            his: "H3,I3,H5,I5",
            rhi: "Cage-4",
            hi4s: "H4",
            reasons: ["CLEAR H4:  it crowds Cage-4 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 16,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2",
            his: "H3,I3",
            rhi: "Cage-4",
            hi4s: "I2,H2",
            reasons: [
              "CLEAR H2:  it crowds Cage-4 (subclump)",
              "CLEAR I2:  it crowds Cage-4 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 17,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7",
            his: "J6,I8,J8",
            rhi: "Row-6,Row-7,Row-8,Row-9",
            hi4s: "J7",
            reasons: [
              "CLEAR J7:  it crowds Row-6,Row-7,Row-8,Row-9 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 18,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5",
            stars: "J6",
            his: "J1,J2,J3,J4,J5,J6,J7,J8,J9,J10",
            rhi: "Col-j",
            hi4s: "I5,J6",
            reasons: [
              "STAR J6: Col-j contains an at-most-1 tuplet",
              "CLEAR I5: adjacent to star",
            ],
            caption:
              "The highlighted column contains two squares that can contain at most one star, leaving a cell that must contain the second star in the column. We can also eliminate an adjacent square.",
          },
          {
            step: 19,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5",
            stars: "J6,H5",
            his: "H3,I3,H4,H5,I5,J5,H6,H7,H8,H9",
            rhi: "Cage-4",
            hi4s: "G6,G4,G5,H5",
            reasons: [
              "STAR H5: Cage-4 contains an at-most-1 tuplet",
              "CLEAR G4: adjacent to star",
              "CLEAR G5: adjacent to star",
              "CLEAR G6: adjacent to star",
            ],
            caption:
              "The highlighted region contains two squares that can contain at most one star, leaving a cell that must contain the second star in the region. We can also eliminate some adjacent squares.",
          },
          {
            step: 20,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3",
            stars: "J6,H5",
            his: "A4,C4",
            rhi: "Row-4",
            hi4s: "B3",
            reasons: ["CLEAR B3:  it crowds Row-4 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 21,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9",
            stars: "J6,H5",
            his: "A2,A3,A4,A5",
            rhi: "Col-a",
            hi4s: "A10,A1,A6,A7,A8,A9",
            reasons: [
              "CLEAR A1: not in a reserved area formed by (A2,A3,A4,A5)",
              "CLEAR A6: not in a reserved area formed by (A2,A3,A4,A5)",
              "CLEAR A7: not in a reserved area formed by (A2,A3,A4,A5)",
              "CLEAR A8: not in a reserved area formed by (A2,A3,A4,A5)",
              "CLEAR A9: not in a reserved area formed by (A2,A3,A4,A5)",
              "CLEAR A10: not in a reserved area formed by (A2,A3,A4,A5)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the column. All other cells can be cleared.",
          },
          {
            step: 22,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9",
            stars: "J6,H5",
            his: "C8,D8,B9,B10,C10",
            rhi: "Cage-9",
            hi4s: "C9",
            reasons: ["CLEAR C9:  it crowds Cage-9 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 23,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8",
            stars: "J6,H5",
            his: "E9,F9,G9",
            rhi: "Row-9",
            hi4s: "F10,F8",
            reasons: [
              "CLEAR F8:  it crowds Row-9 (None)",
              "CLEAR F10:  it crowds Row-9 (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 24,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7",
            stars: "J6,H5",
            his: "C8,D8",
            rhi: "Cage-9",
            hi4s: "D7,C7",
            reasons: [
              "CLEAR C7:  it crowds Cage-9 (subclump)",
              "CLEAR D7:  it crowds Cage-9 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 25,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8",
            stars: "J6,H5",
            his: "F7,G7",
            rhi: "Row-6,Row-7",
            hi4s: "G8",
            reasons: ["CLEAR G8:  it crowds Row-6,Row-7 (subclump)"],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 26,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8",
            stars: "J6,H5",
            his: "C8,B9",
            rhi: "Cage-9",
            hi4s: "B8",
            reasons: ["CLEAR B8:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 27,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8",
            stars: "J6,H5",
            his: "D8,B9",
            rhi: "Cage-9",
            hi4s: "C8",
            reasons: ["CLEAR C8:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 28,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8",
            stars: "J6,H5,D8",
            his: "C8,D8,A9,B9,C9,A10,B10,C10",
            rhi: "Cage-9",
            hi4s: "E9,E7,E8,D8",
            reasons: [
              "STAR D8: because it makes a singleton subclump in Cage-9",
              "CLEAR E7: adjacent to star",
              "CLEAR E8: adjacent to star",
              "CLEAR E9: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 29,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6",
            stars: "J6,H5,D8,B7",
            his: "A7,B7,C7,D7,E7,F7,G7,H7,I7,J7",
            rhi: "Row-7",
            hi4s: "C6,B6,B7",
            reasons: [
              "STAR B7: because it makes a singleton subclump in Row-7",
              "CLEAR B6: adjacent to star",
              "CLEAR C6: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted row. We can also eliminate some adjacent squares.",
          },
          {
            step: 30,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10",
            stars: "J6,H5,D8,B7,B9",
            his: "A9,B9,C9,D9,E9,F9,G9,H9,I9,J9",
            rhi: "Row-9",
            hi4s: "C10,B10,B9",
            reasons: [
              "STAR B9: because it makes a singleton subclump in Row-9",
              "CLEAR B10: adjacent to star",
              "CLEAR C10: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted row. We can also eliminate some adjacent squares.",
          },
          {
            step: 31,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1",
            stars: "J6,H5,D8,B7,B9",
            his: "B1,B2,B3,B4,B5,B6,B7,B8,B9,B10",
            rhi: "Col-b",
            hi4s: "B1",
            reasons: ["CLEAR B1: Col-b is already full of stars"],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 32,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5",
            stars: "J6,H5,D8,B7,B9",
            his: "D6,E6",
            rhi: "Row-6",
            hi4s: "E5",
            reasons: ["CLEAR E5:  it crowds Row-6 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 33,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10",
            stars: "J6,H5,D8,B7,B9",
            his: "F9,G9",
            rhi: "Row-9",
            hi4s: "G10",
            reasons: ["CLEAR G10:  it crowds Row-9 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 34,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8",
            stars: "J6,H5,D8,B7,B9,I8",
            his: "I8,I9,G10,H10,I10",
            rhi: "Cage-10",
            hi4s: "J8,I8",
            reasons: [
              "STAR I8: because it makes a singleton subclump in Cage-10",
              "CLEAR J8: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted region. We can also eliminate an adjacent square.",
          },
          {
            step: 35,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10",
            stars: "J6,H5,D8,B7,B9,I8,J10",
            his: "J1,J2,J3,J4,J5,J6,J7,J8,J9,J10",
            rhi: "Col-j",
            hi4s: "I10,J10",
            reasons: [
              "STAR J10: Col-j is otherwise cleared",
              "CLEAR I10: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 36,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10",
            his: "I8,I9,G10,H10,I10",
            rhi: "Cage-10",
            hi4s: "G9,H10",
            reasons: [
              "STAR H10: Cage-10 is otherwise cleared",
              "CLEAR G9: adjacent to star",
            ],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 37,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9",
            his: "A9,B9,C9,D9,E9,F9,G9,H9,I9,J9",
            rhi: "Row-9",
            hi4s: "E10,F9",
            reasons: [
              "STAR F9: Row-9 is otherwise cleared",
              "CLEAR E10: adjacent to star",
            ],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 38,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9",
            his: "A10,B10,C10,D10,E10,F10,G10,H10,I10,J10",
            rhi: "Row-10",
            hi4s: "D10",
            reasons: ["CLEAR D10: Row-10 is already full of stars"],
            caption:
              "The highlighted row has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 39,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9",
            his: "H1,H2,H3,H4,H5,H6,H7,H8,H9,H10",
            rhi: "Col-h",
            hi4s: "H3,H1",
            reasons: [
              "CLEAR H1: Col-h is already full of stars",
              "CLEAR H3: Col-h is already full of stars",
            ],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 40,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3",
            his: "H3,I3,H4,H5,I5,J5,H6,H7,H8,H9",
            rhi: "Cage-4",
            hi4s: "I3",
            reasons: ["STAR I3: Cage-4 is otherwise cleared"],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 41,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3",
            his: "I1,I2,I3,I4,I5,I6,I7,I8,I9,I10",
            rhi: "Col-i",
            hi4s: "I1",
            reasons: ["CLEAR I1: Col-i is already full of stars"],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 42,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3",
            his: "G1,G2,G3",
            rhi: "Col-g",
            hi4s: "F2",
            reasons: ["CLEAR F2:  it crowds Col-g (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 43,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3",
            his: "C1,D1,E1",
            rhi: "Row-1",
            hi4s: "D2",
            reasons: ["CLEAR D2:  it crowds Row-1 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 44,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3",
            his: "E2,G2",
            rhi: "Row-2",
            hi4s: "F3,F1",
            reasons: [
              "CLEAR F1:  it crowds Row-2 (None)",
              "CLEAR F3:  it crowds Row-2 (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 45,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3",
            his: "A3,C3,D3",
            rhi: "Row-3",
            hi4s: "G3,E3",
            reasons: [
              "CLEAR E3: not in a reserved area formed by (A3,C3,D3)",
              "CLEAR G3: not in a reserved area formed by (A3,C3,D3)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the row. All other cells can be cleared.",
          },
          {
            step: 46,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7",
            his: "G1,G2,G3,G4,G5,G6,G7,G8,G9,G10",
            rhi: "Col-g",
            hi4s: "F7,G7",
            reasons: [
              "STAR G7: because it makes a singleton subclump in Col-g",
              "CLEAR F7: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted column. We can also eliminate an adjacent square.",
          },
          {
            step: 47,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4",
            his: "G1,H1,I1,J1,G2,H2,I2,J2,F3,G3,J3,F4,G4,I4,J4",
            rhi: "Cage-2",
            hi4s: "F5,E4,F4",
            reasons: [
              "STAR F4: because it makes a singleton subclump in Cage-2",
              "CLEAR E4: adjacent to star",
              "CLEAR F5: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 48,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1",
            his: "D1,E1,E2",
            rhi: "Cage-1",
            hi4s: "D1,C1",
            reasons: [
              "STAR C1: Cage-1 contains a trivial shape [17]",
              "CLEAR D1: adjacent to star",
            ],
            caption:
              "This star only fits here in the highlighted region. We can also eliminate an adjacent square.",
          },
          {
            step: 49,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6",
            his: "E1,E2,E3,E4,E5,E6,E7,E8,E9,E10",
            rhi: "Col-e",
            hi4s: "D6,E6",
            reasons: [
              "STAR E6: because it makes a singleton subclump in Col-e",
              "CLEAR D6: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted column. We can also eliminate an adjacent square.",
          },
          {
            step: 50,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6,C4,E2,C3",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3",
            his: "D1,D2,D3,D4,D5,D6,D7,D8,D9,D10",
            rhi: "Col-d",
            hi4s: "C4,E2,C3,D3",
            reasons: [
              "STAR D3: Col-d is otherwise cleared",
              "CLEAR E2: adjacent to star",
              "CLEAR C3: adjacent to star",
              "CLEAR C4: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate the adjacent squares.",
          },
          {
            step: 51,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6,C4,E2,C3",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3,E1",
            his: "E1,E2,E3,E4,E5,E6,E7,E8,E9,E10",
            rhi: "Col-e",
            hi4s: "E1",
            reasons: ["STAR E1: Col-e is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 52,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6,C4,E2,C3,G1",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3,E1",
            his: "A1,B1,C1,D1,E1,F1,G1,H1,I1,J1",
            rhi: "Row-1",
            hi4s: "G1",
            reasons: ["CLEAR G1: Row-1 is already full of stars"],
            caption:
              "The highlighted row has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 53,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6,C4,E2,C3,G1,A3",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3,E1,G2,A2",
            his: "A2,B2,C2,D2,E2,F2,G2,H2,I2,J2",
            rhi: "Row-2",
            hi4s: "A3,G2,A2",
            reasons: [
              "STAR A2: Row-2 is otherwise cleared",
              "CLEAR A3: adjacent to star",
              "STAR G2: Row-2 is otherwise cleared",
            ],
            caption:
              "The highlighted row has two cells remaining where we can place its stars. So we place those stars and eliminate an adjacent square.",
          },
          {
            step: 54,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6,C4,E2,C3,G1,A3,A5",
            stars: "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3,E1,G2,A2,A4",
            his: "A4,B4,C4,D4,E4,F4,G4,H4,I4,J4",
            rhi: "Row-4",
            hi4s: "A5,A4",
            reasons: [
              "STAR A4: Row-4 is otherwise cleared",
              "CLEAR A5: adjacent to star",
            ],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 55,
            dots: "B4,B5,H9,D5,D4,C2,B2,I9,D9,J9,H8,F6,H6,H7,I4,I6,I7,J5,J1,J2,J3,J4,H4,I2,H2,J7,I5,G6,G4,G5,B3,A10,A1,A6,A7,A8,A9,C9,F10,F8,D7,C7,G8,B8,C8,E9,E7,E8,C6,B6,C10,B10,B1,E5,G10,J8,I10,G9,E10,D10,H3,H1,I1,F2,D2,F3,F1,G3,E3,F7,F5,E4,D1,D6,C4,E2,C3,G1,A3,A5",
            stars:
              "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3,E1,G2,A2,A4,C5",
            his: "A5,B5,C5,D5,E5,F5,G5,H5,I5,J5",
            rhi: "Row-5",
            hi4s: "C5",
            reasons: ["STAR C5: Row-5 is otherwise cleared"],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 56,
            stars:
              "J6,H5,D8,B7,B9,I8,J10,H10,F9,I3,G7,F4,C1,E6,D3,E1,G2,A2,A4,C5",
            caption: "Ta-da!",
          },
        ],
      };
      var puzzleID = "KD_TNT_10x10M_V2026-B02-P04";
    </script>
  </head>
  <body>
    <div class="container" id="outercontainer">
      <div class="site-header">
        <a href="/"
          ><img src="/img/kz_whitelogo_large_v3.png" width="140px" alt="logo"
        /></a>
        <p class="header-notice">
          Feeling left-out? Join our
          <a href="https://discord.gg/HCdjUTyXrY">Discord community</a>!
        </p>
      </div>
      <!-- row -->

      <div class="col-sm-12 text-center">
        <div id="puzzletitle">Two Not Touch Solution</div>
        <!-- omit this if it's a literal puzzle -->

        <div id="estatus"></div>
        <!-- error status -->

        <div class="unselectable" id="canvascontainer">
          <canvas id="puzzlecontainer" class="unselectable"></canvas>
          <div class="unselectable" id="stepcontainer">Step 1 of 35</div>
          <div class="unselectable" id="stepnav">
            <div class="btn-group dropup puzzlebuttons" id="puzzlebuttons">
              <button
                type="button"
                class="btn nav-btn"
                id="tool_left"
                title="Go to Previous Step"
              >
                <img class="tool" src="img/playprev_32.png" alt="Left" />
              </button>
              <button
                type="button"
                class="btn nav-btn"
                id="tool_right"
                title="Go to Next Step"
              >
                <img class="tool" src="img/playnext_32.png" alt="Right" />
              </button>
              <button
                type="button"
                class="btn dropdown-toggle nav-btn"
                data-toggle="dropdown"
                role="button"
                aria-expanded="false"
              >
                <img
                  class="tool"
                  id="tool_help"
                  src="img/hamburger_32.png"
                  title="Additional Options"
                  alt="Help"
                />
              </button>
              <ul class="dropdown-menu" role="menu">
                <li><a href="/">More Puzzles...</a></li>
                <li>
                  <a href="/twonottouch/beg_tutorial/">Beginner Tutorial</a>
                </li>
                <li>
                  <a href="/twonottouch/adv_tutorial/">Advanced Tutorial</a>
                </li>
                <li><a href="javascript:exportImage();">Printable Image</a></li>
              </ul>
            </div>
          </div>
          <div class="unselectable" id="spinnercontainer">
            <img src="img/ajax-loader.gif" alt="Loading" />
          </div>

          <div id="pcaption">
            Ash nazg durbatulûk. Ash nazg gimbatul. Ash nazg thrakatulûk. Agh
            burzum-ishi krimpatul.
          </div>
          <!-- end pcaption -->
        </div>

        <p></p>
      </div>
      <!-- end center container -->
    </div>
    <!-- end outer container -->

    <!-- date form -->
    <!--
<div class="bootstrap-iso">
 <div class="container-fluid" id="sandbox-container">
  <div class="row">
   <div class="col-md-6 col-sm-6 col-xs-12">

   <div class="input-append date">
       <input id="date-input" type="text" class="span2"><span class="add-on"><i class="icon-th"></i></span>
   </div>    

    </div>
  </div>    
 </div>
</div>
-->

    <div class="row-fluid">
      <div class="span12">
        <div class="well footer-box">
          <div class="row privacy-links">
            <div class="span12">
              <p><a href="/contactme/">Contact Krazydad</a></p>
              <p><a href="https://discord.gg/HCdjUTyXrY">Discord server</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script src="js/bootstrap.min.js"></script>
    <script src="js/bootstrap-toggle.min.js"></script>
    <script src="js/jquery.bootstrap-touchspin.min.js"></script>
    <script src="js/step_overrides.js"></script>
    <script src="js/step_display.js"></script>
    <script src="js/bootstrap-datepicker.min.js"></script>
  </body>
</html>
```

Here is the results when we try to solve the puzzle:

```bash
Region grid:
0 0 0 0 0 0 1 1 1 1
2 0 0 2 0 0 1 1 1 1
2 2 2 2 0 1 1 3 3 1
4 4 4 2 0 1 1 3 1 1
4 4 4 5 0 0 0 3 3 3
5 5 5 5 5 0 6 3 7 7
5 5 5 5 5 6 6 3 7 7
5 5 8 8 6 6 6 3 9 7
8 8 8 6 6 6 6 3 9 7
8 8 8 6 6 6 9 9 9 7

--- Cycle 1: Tiling Adjacency Marks (level 3) ---
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. X . . . . . . . .
. X . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 2: Tiling Overhang Marks (level 3) ---
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. X . X . . . . . .
. X . X . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 3: Tiling Overhang Marks (level 3) ---
. . . . . . . . . .
. X X . . . . . . .
. . . . . . . . . .
. X . X . . . . . .
. X . X . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 4: Region Confinement (Row) (level 4) ---
. . . . . . . . . .
. X X . . . . . . .
. . . . . . . . . .
. X . X . . . . . .
. X . X . . . . . .
. . . . . X . X . .
. . . . . . . X . .
. . . . . . . X . .
. . . . . . . X . .
. . . . . . . . . .

--- Cycle 5: Adjacent Region Capacity (level 6) ---
. . . . . . . . . .
. X X . . . . . . .
. . . . . . . . . .
. X . X . . . . X .
. X . X . . . . . .
. . . . . X . X X .
. . . . . . . X . .
. . . . . . . X . .
. . . X . . . X X X
. . . . . . . . . .

=== STUCK ===
```

Look at where our puzzle gets stuck, (around krazydad step 13) we know that a star CANNOT be placed in row 8 row 6 (0-indexed) because a placed star there will block column 9 row 5, column 9 row 6, and column 9 row 7, and column 8 row 7. column 8 row 7 being blocked forces both stars in region 9 to be on row 9, making region 7 unsolvable.

Which of our existing rules shoudl catch this? What is this called? this feels a little multichained/guessy to me

