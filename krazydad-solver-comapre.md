here is the puzzle to be solved:

```
10x2.0000011111000021212203332222220033442525603444255566347444886734749889677779989966666998996666699999
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
            "AAAAABBBBBAAAACBCBCCADDDCCCCCCAADDEECFCFGADEEECFFFGGDEHEEEIIGHDEHEJIIJGHHHHJJIJJGGGGGJJIJJGGGGGJJJJJ",
          answer:
            "0000001010100010000000100010001000000001000010010000100000010000010100010100000000000100100101000000",
          puzzleID: "Literal",
        },
        steps: [
          {
            step: 1,
            dots: "I4",
            his: "H4,J4,H5,I5,J5",
            rhi: "Cage-6",
            hi4s: "I4",
            reasons: ["CLEAR I4:  it crowds Cage-6 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 2,
            dots: "I4,I5",
            his: "H4,J4,H5,J5",
            rhi: "Cage-6",
            hi4s: "I5",
            reasons: ["CLEAR I5:  it crowds Cage-6 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 3,
            dots: "I4,I5,H10,H1,H2,H3,H6",
            his: "H4,H5,H7,H8,H9",
            rhi: "Col-h",
            hi4s: "H10,H1,H2,H3,H6",
            reasons: [
              "CLEAR H1: not in a reserved area formed by (H4,H5,H7,H8,H9)",
              "CLEAR H2: not in a reserved area formed by (H4,H5,H7,H8,H9)",
              "CLEAR H3: not in a reserved area formed by (H4,H5,H7,H8,H9)",
              "CLEAR H6: not in a reserved area formed by (H4,H5,H7,H8,H9)",
              "CLEAR H10: not in a reserved area formed by (H4,H5,H7,H8,H9)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the column. All other cells can be cleared.",
          },
          {
            step: 4,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8",
            his: "H7,H8,H9",
            rhi: "Col-h",
            hi4s: "I8,G8",
            reasons: [
              "CLEAR G8:  it crowds Col-h (subclump)",
              "CLEAR I8:  it crowds Col-h (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 5,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2",
            his: "F1,G1,F2",
            rhi: "Cage-2",
            hi4s: "G2",
            reasons: ["CLEAR G2:  it crowds Cage-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 6,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2",
            his: "I1,J1",
            rhi: "Cage-2",
            hi4s: "J2,I2",
            reasons: [
              "CLEAR I2:  it crowds Cage-2 (subclump)",
              "CLEAR J2:  it crowds Cage-2 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 7,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4",
            his: "H4,H5",
            rhi: "Cage-6",
            hi4s: "G5,G4",
            reasons: [
              "CLEAR G4:  it crowds Cage-6 (subclump)",
              "CLEAR G5:  it crowds Cage-6 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 8,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2",
            his: "E2,E3,F3,G3",
            rhi: "Cage-3",
            hi4s: "F2",
            reasons: ["CLEAR F2:  it crowds Cage-3 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 9,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1",
            his: "F1,G1,I1,J1",
            rhi: "Cage-2",
            hi4s: "E1,A1,B1,C1,D1",
            reasons: [
              "CLEAR A1: not in a container cabal formed by Cage-2 and Row-1",
              "CLEAR B1: not in a container cabal formed by Cage-2 and Row-1",
              "CLEAR C1: not in a container cabal formed by Cage-2 and Row-1",
              "CLEAR D1: not in a container cabal formed by Cage-2 and Row-1",
              "CLEAR E1: not in a container cabal formed by Cage-2 and Row-1",
            ],
            caption:
              "The remaining open squares in the highlighted region fit within one row. The row contains all the stars for the region, so the remaining squares in the row can be cleared.",
          },
          {
            step: 10,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3",
            his: "C2,D2,E2",
            rhi: "Row-2",
            hi4s: "D3",
            reasons: ["CLEAR D3:  it crowds Row-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 11,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3",
            his: "A2,B2,C2",
            rhi: "Row-2",
            hi4s: "B3",
            reasons: ["CLEAR B3:  it crowds Row-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 12,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6",
            his: "C5,C6,C7",
            rhi: "Cage-4",
            hi4s: "D6,B6",
            reasons: [
              "CLEAR B6:  it crowds Cage-4 (subclump)",
              "CLEAR D6:  it crowds Cage-4 (subclump)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 13,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7",
            his: "I6,J6,I7",
            rhi: "Cage-9",
            hi4s: "J7",
            reasons: ["CLEAR J7:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 14,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7",
            his: "E6,E7,D8,E8",
            rhi: "Cage-8",
            hi4s: "D7",
            reasons: ["CLEAR D7:  it crowds Cage-8 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 15,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7",
            his: "B7,B8,C8,D8",
            rhi: "Col-a,Col-b,Col-c,Col-d",
            hi4s: "C7",
            reasons: [
              "CLEAR C7:  it crowds Col-a,Col-b,Col-c,Col-d (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted columns can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 16,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5",
            his: "C4,D4,C5,C6",
            rhi: "Cage-4",
            hi4s: "D5",
            reasons: ["CLEAR D5:  it crowds Cage-4 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 17,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5",
            his: "C5,C6",
            rhi: "Cage-4",
            hi4s: "B5",
            reasons: ["CLEAR B5:  it crowds Cage-4 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 18,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7",
            his: "F6,G6,F7",
            rhi: "Cage-5",
            hi4s: "G7",
            reasons: ["CLEAR G7:  it crowds Cage-5 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 19,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8",
            his: "B7,B8,D8",
            rhi: "Col-a,Col-b,Col-c,Col-d",
            hi4s: "C8",
            reasons: [
              "CLEAR C8:  it crowds Col-a,Col-b,Col-c,Col-d (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted columns can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 20,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7",
            his: "B7,B8",
            rhi: "Col-a,Col-b,Col-c,Col-d",
            hi4s: "A8,A7",
            reasons: [
              "CLEAR A7:  it crowds Col-a,Col-b,Col-c,Col-d (subclump)",
              "CLEAR A8:  it crowds Col-a,Col-b,Col-c,Col-d (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted columns can't hold enough stars. We can eliminate these cells that would otherwise crowd the green cells.",
          },
          {
            step: 21,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9",
            his: "B8,D8",
            rhi: "Col-a,Col-b,Col-c,Col-d",
            hi4s: "C9",
            reasons: [
              "CLEAR C9:  it crowds Col-a,Col-b,Col-c,Col-d (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted columns can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 22,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4",
            his: "C3,E3,C4,E4,C5,E5",
            rhi: "Col-a,Col-b,Col-c,Col-d,Col-e",
            hi4s: "D4",
            reasons: [
              "CLEAR D4:  it crowds Col-a,Col-b,Col-c,Col-d,Col-e (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted columns can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 23,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2",
            his: "C3,C4,C5,C6",
            rhi: "Cage-4",
            hi4s: "C10,C2",
            reasons: [
              "CLEAR C2: not in a container cabal formed by Cage-4 and Col-c",
              "CLEAR C10: not in a container cabal formed by Cage-4 and Col-c",
            ],
            caption:
              "The remaining open squares in the highlighted region fit within one column. The column contains all the stars for the region, so the remaining squares in the column can be cleared.",
          },
          {
            step: 24,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4",
            his: "C3,C4,C5",
            rhi: "Col-c",
            hi4s: "B4",
            reasons: ["CLEAR B4:  it crowds Col-c (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 25,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9",
            his: "D8,D9,D10",
            rhi: "Col-d",
            hi4s: "E9",
            reasons: ["CLEAR E9:  it crowds Col-d (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 26,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3",
            his: "D2,E2",
            rhi: "Row-2",
            hi4s: "E3",
            reasons: ["CLEAR E3:  it crowds Row-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 27,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3",
            his: "A2,B2",
            rhi: "Row-2",
            hi4s: "A3",
            reasons: ["CLEAR A3:  it crowds Row-2 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 28,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7",
            his: "A2,A4,A5,A6,A9,A10,B2,B7,B8,B9,B10,D2,D8,D9,D10",
            rhi: "Cage-1,Cage-7,Cage-8",
            hi4s: "E8,E10,E6,E7",
            reasons: [
              "CLEAR E10: not in a container cabal formed by Col-a,Col-b,Col-d and Cage-1,Cage-7,Cage-8",
              "CLEAR E6: not in a container cabal formed by Col-a,Col-b,Col-d and Cage-1,Cage-7,Cage-8",
              "CLEAR E7: not in a container cabal formed by Col-a,Col-b,Col-d and Cage-1,Cage-7,Cage-8",
              "CLEAR E8: not in a container cabal formed by Col-a,Col-b,Col-d and Cage-1,Cage-7,Cage-8",
            ],
            caption:
              "The remaining open squares in three columns fit within the three highlighted regions. These form a container-cabal that must contain all the stars for those regions. The remaining squares in the regions can be cleared.",
          },
          {
            step: 29,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2",
            stars: "E2",
            his: "E1,E2,E3,E4,E5,E6,E7,E8,E9,E10",
            rhi: "Col-e",
            hi4s: "F3,F1,D2,E2",
            reasons: [
              "STAR E2: because it makes a singleton subclump in Col-e",
              "CLEAR F1: adjacent to star",
              "CLEAR D2: adjacent to star",
              "CLEAR F3: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted column. We can also eliminate some adjacent squares.",
          },
          {
            step: 30,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9",
            stars: "E2,D10,D8",
            his: "D9",
            rhi: "Col-d",
            hi4s: "D9,D10,D8",
            reasons: [
              "STAR D8: Col-d contains a trivial shape [0]",
              "CLEAR D9: adjacent to star",
              "STAR D10: Col-d contains a trivial shape [0]",
            ],
            caption:
              "These stars can only go in these locations in the highlighted column. We can also eliminate an adjacent square.",
          },
          {
            step: 31,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9",
            stars: "E2,D10,D8,G1",
            his: "A1,B1,C1,D1,E1,F1,G1,H1,I1,J1",
            rhi: "Row-1",
            hi4s: "G1",
            reasons: [
              "STAR G1: because it makes a singleton subclump in Row-1",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted row.",
          },
          {
            step: 32,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5",
            stars: "E2,D10,D8,G1,A4",
            his: "A1,B1,C1,D1,E1,A2,B2,C2,D2,A3,A4,B4,B5",
            rhi: "Cage-1",
            hi4s: "A5,A4",
            reasons: [
              "STAR A4: because it makes a singleton subclump in Cage-1",
              "CLEAR A5: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted region. We can also eliminate an adjacent square.",
          },
          {
            step: 33,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4",
            stars: "E2,D10,D8,G1,A4",
            his: "E4,E5",
            rhi: "Col-e",
            hi4s: "F5,F4",
            reasons: [
              "CLEAR F4:  it crowds Col-e (None)",
              "CLEAR F5:  it crowds Col-e (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 34,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9",
            stars: "E2,D10,D8,G1,A4",
            his: "F8,F9,F10",
            rhi: "Col-f",
            hi4s: "G9",
            reasons: ["CLEAR G9:  it crowds Col-f (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 35,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2",
            stars: "E2,D10,D8,G1,A4,C3",
            his: "A3,B3,C3,D3,E3,F3,G3,H3,I3,J3",
            rhi: "Row-2,Row-3,Row-3",
            hi4s: "C4,B2,C3",
            reasons: [
              "STAR C3: because it makes a singleton subclump in Row-3",
              "CLEAR B2: adjacent to star",
              "CLEAR C4: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted row. We can also eliminate some adjacent squares.",
          },
          {
            step: 36,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2",
            stars: "E2,D10,D8,G1,A4,C3,A2",
            his: "A2,B2,C2,D2,E2,F2,G2,H2,I2,J2",
            rhi: "Row-2",
            hi4s: "A2",
            reasons: ["STAR A2: Row-2 is otherwise cleared"],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 37,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9",
            stars: "E2,D10,D8,G1,A4,C3,A2",
            his: "A1,A2,A3,A4,A5,A6,A7,A8,A9,A10",
            rhi: "Col-a",
            hi4s: "A10,A6,A9",
            reasons: [
              "CLEAR A6: Col-a is already full of stars",
              "CLEAR A9: Col-a is already full of stars",
              "CLEAR A10: Col-a is already full of stars",
            ],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 38,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5",
            stars: "E2,D10,D8,G1,A4,C3,A2",
            his: "E4,E5,H4,J4,H5,J5",
            rhi: "Row-4,Row-5",
            hi4s: "C5",
            reasons: [
              "CLEAR C5: not in a reserved area formed by (E4,E5,H4,J4,H5,J5)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the rows. The other cell can be cleared.",
          },
          {
            step: 39,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6",
            his: "C1,C2,C3,C4,C5,C6,C7,C8,C9,C10",
            rhi: "Col-c",
            hi4s: "B7,C6",
            reasons: [
              "STAR C6: Col-c is otherwise cleared",
              "CLEAR B7: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 40,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8",
            his: "E6,B7,E7,B8,C8,D8,E8",
            rhi: "Cage-8",
            hi4s: "B9,B8",
            reasons: [
              "STAR B8: Cage-8 is otherwise cleared",
              "CLEAR B9: adjacent to star",
            ],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 41,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8",
            his: "A8,B8,C8,D8,E8,F8,G8,H8,I8,J8",
            rhi: "Row-8",
            hi4s: "J8,F8,H8",
            reasons: [
              "CLEAR F8: Row-8 is already full of stars",
              "CLEAR H8: Row-8 is already full of stars",
              "CLEAR J8: Row-8 is already full of stars",
            ],
            caption:
              "The highlighted row has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 42,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10",
            his: "B1,B2,B3,B4,B5,B6,B7,B8,B9,B10",
            rhi: "Col-b",
            hi4s: "B10",
            reasons: ["STAR B10: Col-b is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 43,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10",
            his: "A10,B10,C10,D10,E10,F10,G10,H10,I10,J10",
            rhi: "Row-10",
            hi4s: "J10,F10,G10,I10",
            reasons: [
              "CLEAR F10: Row-10 is already full of stars",
              "CLEAR G10: Row-10 is already full of stars",
              "CLEAR I10: Row-10 is already full of stars",
              "CLEAR J10: Row-10 is already full of stars",
            ],
            caption:
              "The highlighted row has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 44,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10",
            his: "F9,I9,J9",
            rhi: "Cage-10",
            hi4s: "H9",
            reasons: [
              "CLEAR H9: not in a container cabal formed by Cage-10 and Row-9",
            ],
            caption:
              "The remaining open squares in the highlighted region fit within one row. The row contains all the stars for the region, so the remaining square in the row can be cleared.",
          },
          {
            step: 45,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7",
            his: "I6,I7",
            rhi: "Cage-9",
            hi4s: "J5,I7,G6,I6,J6,H7",
            reasons: [
              "STAR H7: Cage-9 contains a trivial shape [2]",
              "CLEAR G6: adjacent to star",
              "CLEAR I6: adjacent to star",
              "CLEAR I7: adjacent to star",
              "STAR J6: Cage-9 contains a trivial shape [2]",
              "CLEAR J5: adjacent to star",
            ],
            caption:
              "These stars can only go in these locations in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 46,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5",
            his: "A5,B5,C5,D5,E5,F5,G5,H5,I5,J5",
            rhi: "Row-5",
            hi4s: "H4,F6,E4,H5,E5",
            reasons: [
              "STAR E5: Row-5 is otherwise cleared",
              "CLEAR E4: adjacent to star",
              "CLEAR F6: adjacent to star",
              "STAR H5: Row-5 is otherwise cleared",
              "CLEAR H4: adjacent to star",
            ],
            caption:
              "The highlighted row has two cells remaining where we can place its stars. So we place those stars and eliminate the adjacent squares.",
          },
          {
            step: 47,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7",
            his: "A7,B7,C7,D7,E7,F7,G7,H7,I7,J7",
            rhi: "Row-7",
            hi4s: "F7",
            reasons: ["STAR F7: Row-7 is otherwise cleared"],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 48,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7,F9",
            his: "F1,F2,F3,F4,F5,F6,F7,F8,F9,F10",
            rhi: "Col-f",
            hi4s: "F9",
            reasons: ["STAR F9: Col-f is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 49,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7,F9,G3",
            his: "G1,G2,G3,G4,G5,G6,G7,G8,G9,G10",
            rhi: "Col-g",
            hi4s: "G3",
            reasons: ["STAR G3: Col-g is otherwise cleared"],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 50,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4,J3,I3",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7,F9,G3",
            his: "E2,G2,I2,J2,E3,F3,G3,H3,I3,J3,G4,I4,G5",
            rhi: "Cage-3",
            hi4s: "J3,I3",
            reasons: [
              "CLEAR I3: Cage-3 is already full of stars",
              "CLEAR J3: Cage-3 is already full of stars",
            ],
            caption:
              "The highlighted region has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 51,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4,J3,I3",
            stars: "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7,F9,G3,J4",
            his: "H4,J4,H5,I5,J5",
            rhi: "Cage-6",
            hi4s: "J4",
            reasons: ["STAR J4: Cage-6 is otherwise cleared"],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 52,
            dots: "I4,I5,H10,H1,H2,H3,H6,I8,G8,G2,J2,I2,G5,G4,F2,E1,A1,B1,C1,D1,D3,B3,D6,B6,J7,D7,C7,D5,B5,G7,C8,A8,A7,C9,D4,C10,C2,B4,E9,E3,A3,E8,E10,E6,E7,F3,F1,D2,D9,A5,F5,F4,G9,C4,B2,A10,A6,A9,C5,B7,B9,J8,F8,H8,J10,F10,G10,I10,H9,J5,I7,G6,I6,H4,F6,E4,J3,I3,J9,J1",
            stars:
              "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7,F9,G3,J4,I9,I1",
            his: "I1,I2,I3,I4,I5,I6,I7,I8,I9,I10",
            rhi: "Col-i",
            hi4s: "J9,J1,I9,I1",
            reasons: [
              "STAR I1: Col-i is otherwise cleared",
              "CLEAR J1: adjacent to star",
              "STAR I9: Col-i is otherwise cleared",
              "CLEAR J9: adjacent to star",
            ],
            caption:
              "The highlighted column has two cells remaining where we can place its stars. So we place those stars and eliminate the adjacent squares.",
          },
          {
            step: 53,
            stars:
              "E2,D10,D8,G1,A4,C3,A2,C6,B8,B10,J6,H7,H5,E5,F7,F9,G3,J4,I9,I1",
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
============================================================
Puzzle 1: 10x2.0000011111000021212203332222220033442525603444255566347444886734749889677779989966666998996666699999
============================================================
Region grid:
0 0 0 0 0 1 1 1 1 1
0 0 0 0 2 1 2 1 2 2
0 3 3 3 2 2 2 2 2 2
0 0 3 3 4 4 2 5 2 5
6 0 3 4 4 4 2 5 5 5
6 6 3 4 7 4 4 4 8 8
6 7 3 4 7 4 9 8 8 9
6 7 7 7 7 9 9 8 9 9
6 6 6 6 6 9 9 8 9 9
6 6 6 6 6 9 9 9 9 9

--- Cycle 1: 2×2 Tiling (level 1) ---
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . X . X .
. . . . . . X . X .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 2: Finned Counts (level 5) ---
. . . . . . . . . .
. . . . . X X . X .
. . . . . . . . . .
. . . . . . X . X .
. . . . . . X . X .
. . . . X . . X . .
. . X X . . . . . X
. . . . . . X . X .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 3: Finned Counts (level 5) ---
. . . . . . . . . .
. . . . . X X . X .
. . . X . X . . . .
. . . . . . X . X .
. . X X . . X . X .
. . . . X . . X . .
. . X X . . . . . X
. . . . . . X . X .
. . . . X . . . . .
. . . . . . . . . .

--- Cycle 4: Finned Counts (level 5) ---
. . . . . . . . . .
. . . . . X X . X .
. . . X . X . . . .
. X . . . . X . X .
. . X X . . X . X .
. . . . X . . X . .
. . X X X . . . . X
. . . . . . X . X .
. . . . X . . . . .
. . . . . . . . . .

--- Cycle 5: Finned Counts (level 5) ---
. . . . . . . . . .
. . . . . X X . X .
. . . X . X . . . .
. X . . . . X . X .
. . X X . . X . X .
. . . . X . . X . .
. . X X X . . . . X
X . . . . . X . X .
. . . X X . . . . .
. . . . . . . . . .

=== STUCK ===
```

I'm quite confused on how KrazyDad's step 3 (where our puzzle seems to diverge) is accomplished. Cna you explain it to me?
