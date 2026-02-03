here is the puzzle to be solved:

```
10x2.0111122222011222222300111144330111144433001554443306655577330666577788066656778866666666886666999998
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
            "ABBBBCCCCCABBCCCCCCDAABBBBEEDDABBBBEEEDDAABFFEEEDDAGGFFFHHDDAGGGFHHHIIAGGGFGHHIIGGGGGGGGIIGGGGJJJJJI",
          answer:
            "0100010000000100000110000001000010010000100000001000010010000100000010000010100000100000010000100100",
          puzzleID: "Literal",
        },
        steps: [
          {
            step: 1,
            dots: "J10,A10,B10,C10,D10",
            his: "E10,F10,G10,H10,I10",
            rhi: "Cage-10",
            hi4s: "J10,A10,B10,C10,D10",
            reasons: [
              "CLEAR A10: not in a container cabal formed by Cage-10 and Row-10",
              "CLEAR B10: not in a container cabal formed by Cage-10 and Row-10",
              "CLEAR C10: not in a container cabal formed by Cage-10 and Row-10",
              "CLEAR D10: not in a container cabal formed by Cage-10 and Row-10",
              "CLEAR J10: not in a container cabal formed by Cage-10 and Row-10",
            ],
            caption:
              "The remaining open squares in the highlighted region fit within one row. The row contains all the stars for the region, so the remaining squares in the row can be cleared.",
          },
          {
            step: 2,
            dots: "J10,A10,B10,C10,D10,G4",
            his: "G3,H3,F4,H4,F5,G5,H5",
            rhi: "Cage-5",
            hi4s: "G4",
            reasons: ["CLEAR G4:  it crowds Cage-5 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 3,
            dots: "J10,A10,B10,C10,D10,G4,G7",
            his: "G6,H6,F7,H7,G8,H8",
            rhi: "Cage-8",
            hi4s: "G7",
            reasons: ["CLEAR G7:  it crowds Cage-8 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 4,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8",
            his: "I7,J7,J8,I9,J9",
            rhi: "Cage-9",
            hi4s: "I8",
            reasons: ["CLEAR I8:  it crowds Cage-9 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 5,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8",
            his: "I7,J7,I9,J9",
            rhi: "Cage-9",
            hi4s: "J8",
            reasons: ["CLEAR J8:  it crowds Cage-9 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 6,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9",
            his: "G10,H10,I10",
            rhi: "Row-10",
            hi4s: "H9",
            reasons: ["CLEAR H9:  it crowds Row-10 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 7,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9",
            his: "E10,F10,G10",
            rhi: "Row-10",
            hi4s: "F9",
            reasons: ["CLEAR F9:  it crowds Row-10 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 8,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7",
            his: "F6,E7,E8",
            rhi: "Cage-6",
            hi4s: "F7",
            reasons: ["CLEAR F7:  it crowds Cage-6 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 9,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7",
            his: "G6,H6,G8,H8",
            rhi: "Cage-8",
            hi4s: "H7",
            reasons: ["CLEAR H7:  it crowds Cage-8 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 10,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9",
            his: "G8,H8",
            rhi: "Cage-8",
            hi4s: "G9",
            reasons: ["CLEAR G9:  it crowds Cage-8 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 11,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5",
            his: "G6,H6",
            rhi: "Cage-8",
            hi4s: "H5,G5",
            reasons: [
              "CLEAR G5:  it crowds Cage-8 (subclump)",
              "CLEAR H5:  it crowds Cage-8 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 12,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4",
            his: "F4,F5",
            rhi: "Cage-5",
            hi4s: "E5,E4",
            reasons: [
              "CLEAR E4:  it crowds Cage-5 (subclump)",
              "CLEAR E5:  it crowds Cage-5 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 13,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10",
            his: "I9,J9",
            rhi: "Cage-9",
            hi4s: "I10",
            reasons: ["CLEAR I10:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 14,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6",
            his: "I7,J7",
            rhi: "Cage-9",
            hi4s: "I6",
            reasons: ["CLEAR I6:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 15,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9",
            his: "E10,F10",
            rhi: "Row-10",
            hi4s: "E9",
            reasons: ["CLEAR E9:  it crowds Row-10 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 16,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6",
            his: "I7,J7",
            rhi: "Cage-9",
            hi4s: "J6",
            reasons: ["CLEAR J6:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 17,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2",
            his: "J2,I3,J3",
            rhi: "Cage-4",
            hi4s: "I2",
            reasons: ["CLEAR I2:  it crowds Cage-4 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 18,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1",
            his: "J2,I3,J3,I4,J4,I5,J5,I7,J7,I9,J9",
            rhi: "Cage-4,Cage-9",
            hi4s: "I1,J1",
            reasons: [
              "CLEAR J1: not in a container cabal formed by Cage-4,Cage-9 and Col-j,Col-i",
              "CLEAR I1: not in a container cabal formed by Cage-4,Cage-9 and Col-j,Col-i",
            ],
            caption:
              "The remaining open squares in the two highlighted regions fit within two columns. These form a container-cabal that must contain all the stars for those columns. The remaining squares in the columns can be cleared.",
          },
          {
            step: 19,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1",
            his: "F1,D2,E2,F2",
            rhi: "Cage-3",
            hi4s: "E1",
            reasons: ["CLEAR E1:  it crowds Cage-3 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 20,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3",
            his: "A1,A2,A3,A4,A5,A6,A7,A8,A9,B1,B2,B3,B4,B5,B6,B7,B8,B9,C1,C2,C3,C4,C5,C6,C7,C8,C9",
            rhi: "Cage-1,Cage-7,Cage-2",
            hi4s: "D4,D7,D8,F8,D9,D1,D3,E3,F3",
            reasons: [
              "CLEAR D7: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR D8: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR F8: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR D9: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR D1: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR D3: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR E3: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR F3: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
              "CLEAR D4: not in a container cabal formed by Col-a,Col-b,Col-c and Cage-1,Cage-7,Cage-2",
            ],
            caption:
              "The remaining open squares in three columns fit within the three highlighted regions. These form a container-cabal that must contain all the stars for those regions. The remaining squares in the regions can be cleared.",
          },
          {
            step: 21,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2",
            stars: "D2",
            his: "D1,D2,D3,D4,D5,D6,D7,D8,D9,D10",
            rhi: "Col-d",
            hi4s: "C3,C1,C2,E2,D2",
            reasons: [
              "STAR D2: because it makes a singleton subclump in Col-d",
              "CLEAR C1: adjacent to star",
              "CLEAR C2: adjacent to star",
              "CLEAR E2: adjacent to star",
              "CLEAR C3: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted column. We can also eliminate some adjacent squares.",
          },
          {
            step: 22,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5",
            stars: "D2",
            his: "D5,D6",
            rhi: "Col-d",
            hi4s: "C6,C5",
            reasons: [
              "CLEAR C5:  it crowds Col-d (None)",
              "CLEAR C6:  it crowds Col-d (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 23,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8",
            stars: "D2",
            his: "C7,C8,C9",
            rhi: "Col-c",
            hi4s: "B8",
            reasons: ["CLEAR B8:  it crowds Col-c (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 24,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6",
            stars: "D2",
            his: "D5,D6",
            rhi: "Col-d",
            hi4s: "E6",
            reasons: ["CLEAR E6:  it crowds Col-d (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 25,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10",
            stars: "D2,E10",
            his: "E1,E2,E3,E4,E5,E6,E7,E8,E9,E10",
            rhi: "Col-e",
            hi4s: "F10,E10",
            reasons: [
              "STAR E10: because it makes a singleton subclump in Col-e",
              "CLEAR F10: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted column. We can also eliminate an adjacent square.",
          },
          {
            step: 26,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3",
            stars: "D2,E10",
            his: "B2,B4,C4",
            rhi: "Cage-2",
            hi4s: "B3",
            reasons: ["CLEAR B3:  it crowds Cage-2 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 27,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2",
            stars: "D2,E10",
            his: "F1,G1,H1",
            rhi: "Row-1",
            hi4s: "G2",
            reasons: ["CLEAR G2:  it crowds Row-1 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 28,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5",
            stars: "D2,E10",
            his: "B4,C4",
            rhi: "Cage-2",
            hi4s: "B5",
            reasons: ["CLEAR B5:  it crowds Cage-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 29,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1",
            stars: "D2,E10",
            his: "B1,B2",
            rhi: "Cage-2",
            hi4s: "A1",
            reasons: ["CLEAR A1:  it crowds Cage-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 30,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9",
            stars: "D2,E10",
            his: "A2,A3,A4,A5,A6,A7,A8",
            rhi: "Cage-1",
            hi4s: "A9",
            reasons: [
              "CLEAR A9: not in a container cabal formed by Cage-1 and Col-a",
            ],
            caption:
              "The remaining open squares in the highlighted region fit within one column. The column contains all the stars for the region, so the remaining square in the column can be cleared.",
          },
          {
            step: 31,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8",
            stars: "D2,E10",
            his: "B9,C9",
            rhi: "Row-9",
            hi4s: "C8",
            reasons: ["CLEAR C8:  it crowds Row-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 32,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2",
            stars: "D2,E10",
            his: "B1,B2",
            rhi: "Cage-2",
            hi4s: "A2",
            reasons: ["CLEAR A2:  it crowds Cage-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 33,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9",
            stars: "D2,E10,C9",
            his: "C1,C2,C3,C4,C5,C6,C7,C8,C9,C10",
            rhi: "Col-c",
            hi4s: "B9,C9",
            reasons: [
              "STAR C9: Col-c contains an at-most-1 tuplet",
              "CLEAR B9: adjacent to star",
            ],
            caption:
              "The highlighted column contains two squares that can contain at most one star, leaving a cell that must contain the second star in the column. We can also eliminate an adjacent square.",
          },
          {
            step: 34,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1",
            stars: "D2,E10,C9",
            his: "G3,H3,H4,G6,G8,H6,H8,G10,H10",
            rhi: "Col-g,Col-h",
            hi4s: "H2,G1,H1",
            reasons: [
              "CLEAR G1: not in a reserved area formed by (G3,H3,H4,G6,G8,H6,H8,G10,H10)",
              "CLEAR H1: not in a reserved area formed by (G3,H3,H4,G6,G8,H6,H8,G10,H10)",
              "CLEAR H2: not in a reserved area formed by (G3,H3,H4,G6,G8,H6,H8,G10,H10)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the columns. All other cells can be cleared.",
          },
          {
            step: 35,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2",
            stars: "D2,E10,C9,F1,B1",
            his: "A1,B1,C1,D1,E1,F1,G1,H1,I1,J1",
            rhi: "Row-1",
            hi4s: "F2,B2,F1,B1",
            reasons: [
              "STAR B1: Row-1 is otherwise cleared",
              "CLEAR B2: adjacent to star",
              "STAR F1: Row-1 is otherwise cleared",
              "CLEAR F2: adjacent to star",
            ],
            caption:
              "The highlighted row has two cells remaining where we can place its stars. So we place those stars and eliminate the adjacent squares.",
          },
          {
            step: 36,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3",
            stars: "D2,E10,C9,F1,B1,J2",
            his: "A2,B2,C2,D2,E2,F2,G2,H2,I2,J2",
            rhi: "Row-2",
            hi4s: "J3,I3,J2",
            reasons: [
              "STAR J2: Row-2 is otherwise cleared",
              "CLEAR I3: adjacent to star",
              "CLEAR J3: adjacent to star",
            ],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star and eliminate the adjacent squares.",
          },
          {
            step: 37,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4",
            stars: "D2,E10,C9,F1,B1,J2,A3",
            his: "A3,B3,C3,D3,E3,F3,G3,H3,I3,J3",
            rhi: "Row-3",
            hi4s: "B4,A4,A3",
            reasons: [
              "STAR A3: because it makes a singleton subclump in Row-3",
              "CLEAR A4: adjacent to star",
              "CLEAR B4: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted row. We can also eliminate some adjacent squares.",
          },
          {
            step: 38,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4",
            his: "B1,C1,D1,E1,B2,C2,C3,D3,E3,F3,B4,C4,D4,E4,C5",
            rhi: "Cage-2",
            hi4s: "D5,C4",
            reasons: [
              "STAR C4: Cage-2 is otherwise cleared",
              "CLEAR D5: adjacent to star",
            ],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 39,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4",
            his: "C1,C2,C3,C4,C5,C6,C7,C8,C9,C10",
            rhi: "Col-c",
            hi4s: "C7",
            reasons: ["CLEAR C7: Col-c is already full of stars"],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 40,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6",
            his: "D1,D2,D3,D4,D5,D6,D7,D8,D9,D10",
            rhi: "Col-d",
            hi4s: "E7,D6",
            reasons: [
              "STAR D6: Col-d is otherwise cleared",
              "CLEAR E7: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 41,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8",
            his: "E1,E2,E3,E4,E5,E6,E7,E8,E9,E10",
            rhi: "Col-e",
            hi4s: "E8",
            reasons: ["STAR E8: Col-e is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 42,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8",
            his: "D5,E5,D6,E6,F6,E7,E8",
            rhi: "Cage-6",
            hi4s: "F6",
            reasons: ["CLEAR F6: Cage-6 is already full of stars"],
            caption:
              "The highlighted region has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 43,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8",
            his: "G3,H3",
            rhi: "Row-3",
            hi4s: "H4",
            reasons: ["CLEAR H4:  it crowds Row-3 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 44,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8",
            his: "B6,B7",
            rhi: "Col-b",
            hi4s: "A7,A6",
            reasons: [
              "CLEAR A6:  it crowds Col-b (None)",
              "CLEAR A7:  it crowds Col-b (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 45,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7",
            his: "A7,B7,C7,D7,E7,F7,G7,H7,I7,J7",
            rhi: "Row-7",
            hi4s: "A8,B6,B7",
            reasons: [
              "STAR B7: because it makes a singleton subclump in Row-7",
              "CLEAR B6: adjacent to star",
              "CLEAR A8: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted row. We can also eliminate some adjacent squares.",
          },
          {
            step: 46,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5",
            his: "A1,A2,A3,A4,A5,A6,A7,A8,A9,A10",
            rhi: "Col-a",
            hi4s: "A5",
            reasons: ["STAR A5: Col-a is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 47,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5",
            his: "I7,I9",
            rhi: "Col-i",
            hi4s: "H8",
            reasons: ["CLEAR H8:  it crowds Col-i (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 48,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8",
            his: "A8,B8,C8,D8,E8,F8,G8,H8,I8,J8",
            rhi: "Row-8",
            hi4s: "G8",
            reasons: ["STAR G8: Row-8 is otherwise cleared"],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 49,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3",
            his: "H1,H2,H3,H4,H5,H6,H7,H8,H9,H10",
            rhi: "Col-h",
            hi4s: "I4,G3,H3",
            reasons: [
              "STAR H3: Col-h contains an at-most-1 tuplet",
              "CLEAR G3: adjacent to star",
              "CLEAR I4: adjacent to star",
            ],
            caption:
              "The highlighted column contains two squares that can contain at most one star, leaving a cell that must contain the second star in the column. We can also eliminate some adjacent squares.",
          },
          {
            step: 50,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3,J5,J4,J7,H6",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7",
            his: "I1,I2,I3,I4,I5,I6,I7,I8,I9,I10",
            rhi: "Col-i",
            hi4s: "J5,J4,J7,H6,I5,I7",
            reasons: [
              "STAR I7: Col-i contains an at-most-1 tuplet",
              "CLEAR H6: adjacent to star",
              "CLEAR J7: adjacent to star",
              "STAR I5: Col-i contains an at-most-1 tuplet",
              "CLEAR J4: adjacent to star",
              "CLEAR J5: adjacent to star",
            ],
            caption:
              "The highlighted column contains two squares that can contain at most one star, leaving a cell that must contain the second star in the column. We can also eliminate some adjacent squares.",
          },
          {
            step: 51,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3,J5,J4,J7,H6,F5",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7,F4",
            his: "A4,B4,C4,D4,E4,F4,G4,H4,I4,J4",
            rhi: "Row-4",
            hi4s: "F5,F4",
            reasons: [
              "STAR F4: Row-4 is otherwise cleared",
              "CLEAR F5: adjacent to star",
            ],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 52,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3,J5,J4,J7,H6,F5",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7,F4,G6",
            his: "A6,B6,C6,D6,E6,F6,G6,H6,I6,J6",
            rhi: "Row-6",
            hi4s: "G6",
            reasons: ["STAR G6: Row-6 is otherwise cleared"],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 53,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3,J5,J4,J7,H6,F5,G10",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7,F4,G6",
            his: "G1,G2,G3,G4,G5,G6,G7,G8,G9,G10",
            rhi: "Col-g",
            hi4s: "G10",
            reasons: ["CLEAR G10: Col-g is already full of stars"],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 54,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3,J5,J4,J7,H6,F5,G10,I9",
            stars: "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7,F4,G6,H10",
            his: "H1,H2,H3,H4,H5,H6,H7,H8,H9,H10",
            rhi: "Col-h",
            hi4s: "I9,H10",
            reasons: [
              "STAR H10: Col-h is otherwise cleared",
              "CLEAR I9: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 55,
            dots: "J10,A10,B10,C10,D10,G4,G7,I8,J8,H9,F9,F7,H7,G9,H5,G5,E5,E4,I10,I6,E9,J6,I2,I1,J1,E1,D4,D7,D8,F8,D9,D1,D3,E3,F3,C3,C1,C2,E2,C6,C5,B8,E6,F10,B3,G2,B5,A1,A9,C8,A2,B9,H2,G1,H1,F2,B2,J3,I3,B4,A4,D5,C7,E7,F6,H4,A7,A6,A8,B6,H8,I4,G3,J5,J4,J7,H6,F5,G10,I9",
            stars:
              "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7,F4,G6,H10,J9",
            his: "J1,J2,J3,J4,J5,J6,J7,J8,J9,J10",
            rhi: "Col-j",
            hi4s: "J9",
            reasons: ["STAR J9: Col-j is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 56,
            stars:
              "D2,E10,C9,F1,B1,J2,A3,C4,D6,E8,B7,A5,G8,H3,I5,I7,F4,G6,H10,J9",
            caption: "Ta-da!",
          },
        ],
      };
      var puzzleID = "KD_TNT_10x10M_V2026-B02-P03";
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
masonomara@Masons-MacBook-Pro starbattle % head -1 unsolved_clean.sbf | npx tsx src/sieve/cli.ts --sbf /dev/stdin --trace


============================================================
Puzzle 1: 10x2.0111122222011222222300111144330111144433001554443306655577330666577788066656778866666666886666999998
============================================================
Region grid:
0 1 1 1 1 2 2 2 2 2
0 1 1 2 2 2 2 2 2 3
0 0 1 1 1 1 4 4 3 3
0 1 1 1 1 4 4 4 3 3
0 0 1 5 5 4 4 4 3 3
0 6 6 5 5 5 7 7 3 3
0 6 6 6 5 7 7 7 8 8
0 6 6 6 5 6 7 7 8 8
6 6 6 6 6 6 6 6 8 8
6 6 6 6 9 9 9 9 9 8

--- Cycle 1: 2×2 Tiling (level 1) ---
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . X X X X . .
. . . . . . . . X .

--- Cycle 2: 1×n Confinement (level 1) ---
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . X X X X . .
X X X X . . . . X X

--- Cycle 3: 2×2 Tiling (level 1) ---
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . X X
. . . . X X X X . .
X X X X . . . . X X

--- Cycle 4: Finned Counts (level 5) ---
. . X X X . . . X X
. . X . X . X . X .
. . X X X X . . . .
. . . X X . X . . .
. . X . X . . . . .
. . X . X X . . X X
. . . X . X X . . .
. X . X . X . . X X
. . . X X X X X . .
X X X X . X . . X X

--- Cycle 5: Forced Placement (level 0) ---
. . X X X . . . X X
. . X . X . X . X .
. . X X X X . . . .
. . . X X . X . . .
. . X . X . . . . .
. . X . X X . . X X
. . . X . X X . . .
. X . X . X . . X X
. . . X X X X X . .
X X X X ★ X . . X X

--- Cycle 6: Forced Placement (level 0) ---
. . X X X . . . X X
. . X ★ X . X . X .
. . X X X X . . . .
. . . X X . X . . .
. . X . X . . . . .
. . X . X X . . X X
. . . X . X X . . .
. X . X . X . . X X
. . . X X X X X . .
X X X X ★ X . . X X

--- Cycle 7: 2×2 Tiling (level 1) ---
. . X X X . . . X X
. . X ★ X . X . X .
. . X X X X . . . .
. . . X X . X . . .
. . X . X . . . . .
. . X . X X . . X X
. . . X . X X X . .
. X . X . X . . X X
. . . X X X X X . .
X X X X ★ X . . X X

--- Cycle 8: Finned Counts (level 5) ---
X . X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . . .
. . . X X . X . . .
. X X . X . X X . .
. . X . X X . . X X
X . . X . X X X . .
. X . X . X . . X X
. X . X X X X X . .
X X X X ★ X . . X X

--- Cycle 9: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . . .
. . . X X . X . . .
. X X . X . X X . .
. . X . X X . . X X
X . . X . X X X . .
. X . X . X . . X X
. X . X X X X X . .
X X X X ★ X . . X X

--- Cycle 10: 1×n Confinement (level 1) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . . .
. . . X X . X . . .
. X X . X . X X . .
. . X . X X . . X X
X . . X . X X X . .
. X . X . X . . X X
X X . X X X X X . .
X X X X ★ X . . X X

--- Cycle 11: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . . .
. . . X X . X . . .
. X X . X . X X . .
. . X . X X . . X X
X . . X . X X X . .
. X . X . X . . X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 12: Star Neighbors (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . . .
. . . X X . X . . .
. X X . X . X X . .
. . X . X X . . X X
X . . X . X X X . .
. X X X . X . . X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 13: Finned Counts (level 5) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . X X
X X . X X . X X . .
. X X . X . X X . .
X . X . X X . . X X
X . X X . X X X . .
. X X X . X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 14: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . X X
X X ★ X X . X X . .
. X X . X . X X . .
X . X . X X . . X X
X . X X . X X X . .
. X X X . X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 15: Star Neighbors (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X . X . X X . . X X
X . X X . X X X . .
. X X X . X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 16: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X . X ★ X X . . X X
X . X X . X X X . .
. X X X . X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 17: Star Neighbors (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X . X ★ X X . . X X
X . X X X X X X . .
. X X X . X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 18: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
. X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X . X ★ X X . . X X
X . X X X X X X . .
. X X X ★ X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 19: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
★ X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X . X ★ X X . . X X
X . X X X X X X . .
. X X X ★ X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 20: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
★ X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X . X ★ X X . . X X
X ★ X X X X X X . .
. X X X ★ X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 21: Star Neighbors (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
★ X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X . X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 22: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
★ X X X X X . . X X
X X ★ X X . X X . .
. X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X ★ X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 23: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X .
★ X X X X X . . X X
X X ★ X X . X X . .
★ X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X ★ X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 24: Forced Placement (level 0) ---
X ★ X X X . X . X X
X X X ★ X . X . X ★
★ X X X X X . . X X
X X ★ X X . X X . .
★ X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X ★ X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 25: Row Complete (level 0) ---
X ★ X X X . X . X X
X X X ★ X X X X X ★
★ X X X X X . . X X
X X ★ X X . X X . .
★ X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X ★ X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 26: Forced Placement (level 0) ---
X ★ X X X ★ X . X X
X X X ★ X X X X X ★
★ X X X X X . . X X
X X ★ X X . X X . .
★ X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X ★ X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

--- Cycle 27: Row Complete (level 0) ---
X ★ X X X ★ X X X X
X X X ★ X X X X X ★
★ X X X X X . . X X
X X ★ X X . X X . .
★ X X X X . X X . .
X X X ★ X X . . X X
X ★ X X X X X X . .
X X X X ★ X ★ X X X
X X ★ X X X X X . .
X X X X ★ X . . X X

=== STUCK ===
Processed 1 puzzles in 0.35s

Rule Usage Summary:
  Forced Placement      (L0): 13 times (100% of puzzles)
  Star Neighbors        (L0): 4 times (100% of puzzles)
  Row Complete          (L0): 2 times (100% of puzzles)
  Column Complete       (L0): 0 times (0% of puzzles)
  Region Complete       (L0): 0 times (0% of puzzles)
  2×2 Tiling            (L3): 3 times (100% of puzzles)
  1×n Confinement       (L3): 2 times (100% of puzzles)
  Finned Counts         (L5): 3 times (100% of puzzles)
  Composite Regions     (L6): 0 times (0% of puzzles)

Difficulty distribution:
  Easy (1-20):    0 puzzles
  Medium (21-40): 0 puzzles
  Hard (41+):     0 puzzles

Solve rate: 0/1 (0%)
```

Investigate which functions from our production rules coudl possibly be failing, specifically look at KrazyDad's step 49 the key deviation from our solver. i think forcedPlacement or another rule shoudl eb able to handle this mark at step 49
