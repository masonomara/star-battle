here is the puzzle to be solved:

```
10x2.0000111112003011111203304444220330455555000044455506067777778666777977866677797786777799778888877999
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
            "AAAABBBBBCAADABBBBBCADDAEEEECCADDAEFFFFFAAAAEEEFFFAGAGHHHHHHIGGGHHHJHHIGGGHHHJHHIGHHHHJJHHIIIIIHHJJJ",
          answer:
            "0000010001001000010000001000010100001000000010001010100000000000010100010100000000000010101001000000",
          puzzleID: "Literal",
        },
        steps: [
          {
            step: 1,
            dots: "J2,I1,I2",
            stars: "J1",
            his: "J2,I3,J3",
            rhi: "Cage-3",
            hi4s: "J2,I1,I2,J1",
            reasons: [
              "STAR J1: Cage-3 contains a trivial shape [14]",
              "CLEAR I1: adjacent to star",
              "CLEAR I2: adjacent to star",
              "CLEAR J2: adjacent to star",
            ],
            caption:
              "This star only fits here in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 2,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3",
            stars: "J1,C2",
            his: "B3,C3,B4,C4",
            rhi: "Cage-4",
            hi4s: "D3,B1,C1,D1,B2,D2,B3,C3,C2",
            reasons: [
              "STAR C2: Cage-4 contains a trivial shape [22]",
              "CLEAR B1: adjacent to star",
              "CLEAR C1: adjacent to star",
              "CLEAR D1: adjacent to star",
              "CLEAR B2: adjacent to star",
              "CLEAR D2: adjacent to star",
              "CLEAR B3: adjacent to star",
              "CLEAR C3: adjacent to star",
              "CLEAR D3: adjacent to star",
            ],
            caption:
              "This star only fits here in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 3,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4",
            stars: "J1,C2",
            his: "I3,J3",
            rhi: "Cage-3",
            hi4s: "J4,I4",
            reasons: [
              "CLEAR I4:  it crowds Cage-3 (None)",
              "CLEAR J4:  it crowds Cage-3 (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 4,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5",
            stars: "J1,C2",
            his: "B4,C4",
            rhi: "Cage-4",
            hi4s: "C5,B5",
            reasons: [
              "CLEAR B5:  it crowds Cage-4 (None)",
              "CLEAR C5:  it crowds Cage-4 (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 5,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4",
            stars: "J1,C2",
            his: "E3,F3,G3,E4,E5,F5,G5",
            rhi: "Cage-5",
            hi4s: "F4",
            reasons: ["CLEAR F4:  it crowds Cage-5 (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 6,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6",
            stars: "J1,C2",
            his: "I5,J5",
            rhi: "Cage-6",
            hi4s: "I6",
            reasons: ["CLEAR I6:  it crowds Cage-6 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 7,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5",
            stars: "J1,C2",
            his: "G4,H4,H5",
            rhi: "Cage-6",
            hi4s: "G5",
            reasons: ["CLEAR G5:  it crowds Cage-6 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 8,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3",
            stars: "J1,C2",
            his: "E3,F3,G3,H3,I3,J3",
            rhi: "Row-3",
            hi4s: "A3",
            reasons: [
              "CLEAR A3: not in a reserved area formed by (E3,F3,G3,H3,I3,J3)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the row. The other cell can be cleared.",
          },
          {
            step: 9,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6",
            stars: "J1,C2",
            his: "I5,J5",
            rhi: "Cage-6",
            hi4s: "J6",
            reasons: ["CLEAR J6:  it crowds Cage-6 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 10,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1",
            stars: "J1,C2",
            his: "E1,F1,G1,H1,E2,F2,G2,H2",
            rhi: "Row-1,Row-2",
            hi4s: "A2,A1",
            reasons: [
              "CLEAR A1: not in a reserved area formed by (E1,F1,G1,H1,E2,F2,G2,H2)",
              "CLEAR A2: not in a reserved area formed by (E1,F1,G1,H1,E2,F2,G2,H2)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the rows. All other cells can be cleared.",
          },
          {
            step: 11,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7",
            stars: "J1,C2",
            his: "A6,C6,A7,A8",
            rhi: "Row-6,Row-7,Row-8,Row-9",
            hi4s: "B7",
            reasons: [
              "CLEAR B7:  it crowds Row-6,Row-7,Row-8,Row-9 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 12,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8",
            stars: "J1,C2",
            his: "C7,D7,B8,D8,B9",
            rhi: "Row-7,Row-8,Row-9,Row-10",
            hi4s: "C8",
            reasons: [
              "CLEAR C8:  it crowds Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 13,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5",
            stars: "J1,C2",
            his: "A6",
            rhi: "Row-6,Row-7,Row-8,Row-9,Row-10",
            hi4s: "A5",
            reasons: [
              "CLEAR A5:  it crowds Row-6,Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 14,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6",
            stars: "J1,C2",
            his: "A6,C6",
            rhi: "Row-6,Row-7,Row-8,Row-9,Row-10",
            hi4s: "B6",
            reasons: [
              "CLEAR B6:  it crowds Row-6,Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 15,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9",
            stars: "J1,C2",
            his: "B8,B9,B10",
            rhi: "Col-b",
            hi4s: "C9,A9",
            reasons: [
              "CLEAR A9:  it crowds Col-b (None)",
              "CLEAR C9:  it crowds Col-b (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 16,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8",
            stars: "J1,C2",
            his: "H7,H8,G9,H9",
            rhi: "Cage-10",
            hi4s: "G8",
            reasons: ["CLEAR G8:  it crowds Cage-10 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 17,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7",
            stars: "J1,C2",
            his: "C6,D6,D7,B8,D8",
            rhi: "Row-6,Row-7,Row-8,Row-9,Row-10",
            hi4s: "C7",
            reasons: [
              "CLEAR C7:  it crowds Row-6,Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 18,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7",
            stars: "J1,C2",
            his: "D6,D7,D8",
            rhi: "Cage-7",
            hi4s: "E7",
            reasons: ["CLEAR E7:  it crowds Cage-7 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 19,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7",
            stars: "J1,C2",
            his: "A6",
            rhi: "Row-6,Row-7,Row-8,Row-9,Row-10",
            hi4s: "A7",
            reasons: [
              "CLEAR A7:  it crowds Row-6,Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 20,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9",
            stars: "J1,C2",
            his: "A8,A10,B10,C10",
            rhi: "Cage-9",
            hi4s: "B9",
            reasons: ["CLEAR B9:  it crowds Cage-9 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted region.",
          },
          {
            step: 21,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8",
            stars: "J1,C2",
            his: "D7,D8",
            rhi: "Row-7,Row-8,Row-9,Row-10",
            hi4s: "E8",
            reasons: [
              "CLEAR E8:  it crowds Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 22,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7",
            stars: "J1,C2",
            his: "C6,D6,D8",
            rhi: "Row-6,Row-7,Row-8,Row-9,Row-10",
            hi4s: "D7",
            reasons: [
              "CLEAR D7:  it crowds Row-6,Row-7,Row-8,Row-9,Row-10 (subclump)",
            ],
            caption:
              "The green cells must contain a star, otherwise the hilighted rows can't hold enough stars. We can eliminate a cell that would otherwise crowd the green cells.",
          },
          {
            step: 23,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8",
            stars: "J1,C2",
            his: "H7,I7,J7",
            rhi: "Row-7",
            hi4s: "I8",
            reasons: ["CLEAR I8:  it crowds Row-7 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 24,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6",
            stars: "J1,C2",
            his: "F7,G7,H7",
            rhi: "Row-7",
            hi4s: "G6",
            reasons: ["CLEAR G6:  it crowds Row-7 (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 25,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10",
            stars: "J1,C2",
            his: "F7,G7,H7,I7,J7,D9,E9,F9,G9,H9,I9,J9",
            rhi: "Cage-8,Cage-10",
            hi4s: "J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10",
            reasons: [
              "CLEAR E6: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR F6: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR H6: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR F8: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR J8: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR F10: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR G10: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR H8: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR H10: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR I10: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
              "CLEAR J10: not in a container cabal formed by Row-7,Row-9 and Cage-8,Cage-10",
            ],
            caption:
              "The remaining open squares in two rows fit within the two highlighted regions. These form a container-cabal that must contain all the stars for those regions. The remaining squares in the regions can be cleared.",
          },
          {
            step: 26,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6",
            stars: "J1,C2",
            his: "A8,B8,D8,A10,B10,C10,D10,E10",
            rhi: "Cage-9,Cage-7",
            hi4s: "D6",
            reasons: [
              "CLEAR D6: not in a container cabal formed by Row-8,Row-10 and Cage-9,Cage-7",
            ],
            caption:
              "The remaining open squares in two rows fit within the two highlighted regions. These form a container-cabal that must contain all the stars for those regions. The remaining square in the regions can be cleared.",
          },
          {
            step: 27,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5",
            stars: "J1,C2,C6,A6",
            his: "A6,B6,C6,D6,E6,F6,G6,H6,I6,J6",
            rhi: "Row-6",
            hi4s: "D5,C6,A6",
            reasons: [
              "STAR A6: Row-6 is otherwise cleared",
              "STAR C6: Row-6 is otherwise cleared",
              "CLEAR D5: adjacent to star",
            ],
            caption:
              "The highlighted row has two cells remaining where we can place its stars. So we place those stars and eliminate an adjacent square.",
          },
          {
            step: 28,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4",
            stars: "J1,C2,C6,A6",
            his: "C1,C2,C3,C4,C5,C6,C7,C8,C9,C10",
            rhi: "Col-c",
            hi4s: "C10,C4",
            reasons: [
              "CLEAR C4: Col-c is already full of stars",
              "CLEAR C10: Col-c is already full of stars",
            ],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 29,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4",
            stars: "J1,C2,C6,A6",
            his: "A1,B1,C1,D1,A2,B2,D2,A3,D3,A4,D4,A5,B5,C5,D5,A6,C6",
            rhi: "Cage-1",
            hi4s: "D4,A4",
            reasons: [
              "CLEAR A4: Cage-1 is already full of stars",
              "CLEAR D4: Cage-1 is already full of stars",
            ],
            caption:
              "The highlighted region has all its stars. We can eliminate its remaining squares.",
          },
          {
            step: 30,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4",
            stars: "J1,C2,C6,A6,B4",
            his: "C2,B3,C3,B4,C4",
            rhi: "Cage-4",
            hi4s: "B4",
            reasons: ["STAR B4: Cage-4 is otherwise cleared"],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 31,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8",
            stars: "J1,C2,C6,A6,B4,D8,B8",
            his: "B6,D6,B7,C7,D7,B8,C8,D8,B9",
            rhi: "Cage-7",
            hi4s: "E9,D9,A8,D8,B8",
            reasons: [
              "STAR B8: Cage-7 is otherwise cleared",
              "CLEAR A8: adjacent to star",
              "STAR D8: Cage-7 is otherwise cleared",
              "CLEAR D9: adjacent to star",
              "CLEAR E9: adjacent to star",
            ],
            caption:
              "The highlighted region has two cells remaining where we can place its stars. So we place those stars and eliminate the adjacent squares.",
          },
          {
            step: 32,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10",
            his: "A1,A2,A3,A4,A5,A6,A7,A8,A9,A10",
            rhi: "Col-a",
            hi4s: "B10,A10",
            reasons: [
              "STAR A10: Col-a is otherwise cleared",
              "CLEAR B10: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 33,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10",
            his: "D1,D2,D3,D4,D5,D6,D7,D8,D9,D10",
            rhi: "Col-d",
            hi4s: "E10,D10",
            reasons: [
              "STAR D10: Col-d is otherwise cleared",
              "CLEAR E10: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 34,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7",
            his: "H7,H8,G9,H9,H10,I10,J10",
            rhi: "Cage-10",
            hi4s: "I7,G7,H7",
            reasons: [
              "STAR H7: because it makes a singleton subclump in Cage-10",
              "CLEAR G7: adjacent to star",
              "CLEAR I7: adjacent to star",
            ],
            caption:
              "We must place a star here; otherwise there would be insufficient room for both stars in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 35,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7",
            his: "I3,I5",
            rhi: "Col-i",
            hi4s: "H4",
            reasons: ["CLEAR H4:  it crowds Col-i (None)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 36,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7",
            his: "E4,G4",
            rhi: "Row-4",
            hi4s: "F5,F3",
            reasons: [
              "CLEAR F3:  it crowds Row-4 (None)",
              "CLEAR F5:  it crowds Row-4 (None)",
            ],
            caption:
              "We can eliminate these cells that would otherwise prevent us from placing both stars in the highlighted row.",
          },
          {
            step: 37,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7",
            his: "E1,E2,E3",
            rhi: "Col-e",
            hi4s: "F2",
            reasons: ["CLEAR F2:  it crowds Col-e (subclump)"],
            caption:
              "We can eliminate a cell that would otherwise prevent us from placing both stars in the highlighted column.",
          },
          {
            step: 38,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7",
            his: "G1,G2,H1,H2,G4,H5,G9,H9",
            rhi: "Col-g,Col-h",
            hi4s: "H3,G3",
            reasons: [
              "CLEAR G3: not in a reserved area formed by (G1,G2,H1,H2,G4,H5,G9,H9)",
              "CLEAR H3: not in a reserved area formed by (G1,G2,H1,H2,G4,H5,G9,H9)",
            ],
            caption:
              "The reserved green squares must contain the remaining star(s) for the columns. All other cells can be cleared.",
          },
          {
            step: 39,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3",
            his: "E4",
            rhi: "Cage-5",
            hi4s: "E4,E2,E5,E3",
            reasons: [
              "STAR E3: Cage-5 contains a trivial shape [0]",
              "CLEAR E2: adjacent to star",
              "CLEAR E4: adjacent to star",
              "STAR E5: Cage-5 contains a trivial shape [0]",
            ],
            caption:
              "These stars can only go in these locations in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 40,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4",
            his: "A4,B4,C4,D4,E4,F4,G4,H4,I4,J4",
            rhi: "Row-4",
            hi4s: "H5,G4",
            reasons: [
              "STAR G4: Row-4 is otherwise cleared",
              "CLEAR H5: adjacent to star",
            ],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 41,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4",
            his: "E1,E2,E3,E4,E5,E6,E7,E8,E9,E10",
            rhi: "Col-e",
            hi4s: "E1",
            reasons: ["CLEAR E1: Col-e is already full of stars"],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 42,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1",
            his: "G1,H1,G2,H2",
            rhi: "Cage-2",
            hi4s: "G2,G1,F1",
            reasons: [
              "STAR F1: Cage-2 contains a trivial shape [25]",
              "CLEAR G1: adjacent to star",
              "CLEAR G2: adjacent to star",
            ],
            caption:
              "This star only fits here in the highlighted region. We can also eliminate some adjacent squares.",
          },
          {
            step: 43,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1",
            his: "A1,B1,C1,D1,E1,F1,G1,H1,I1,J1",
            rhi: "Row-1",
            hi4s: "H1",
            reasons: ["CLEAR H1: Row-1 is already full of stars"],
            caption:
              "The highlighted row has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 44,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1,I3",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2",
            his: "A2,B2,C2,D2,E2,F2,G2,H2,I2,J2",
            rhi: "Row-2",
            hi4s: "I3,H2",
            reasons: [
              "STAR H2: Row-2 is otherwise cleared",
              "CLEAR I3: adjacent to star",
            ],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star and eliminate an adjacent square.",
          },
          {
            step: 45,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1,I3",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2,J3",
            his: "A3,B3,C3,D3,E3,F3,G3,H3,I3,J3",
            rhi: "Row-3",
            hi4s: "J3",
            reasons: ["STAR J3: Row-3 is otherwise cleared"],
            caption:
              "The highlighted row has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 46,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1,I3,H9,F9",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2,J3,G9",
            his: "G1,G2,G3,G4,G5,G6,G7,G8,G9,G10",
            rhi: "Col-g",
            hi4s: "H9,F9,G9",
            reasons: [
              "STAR G9: Col-g is otherwise cleared",
              "CLEAR F9: adjacent to star",
              "CLEAR H9: adjacent to star",
            ],
            caption:
              "The highlighted column has one cell remaining where we can place its second star. So we place the star and eliminate the adjacent squares.",
          },
          {
            step: 47,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1,I3,H9,F9,J9,J5",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2,J3,G9,I9,I5",
            his: "I1,I2,I3,I4,I5,I6,I7,I8,I9,I10",
            rhi: "Col-i",
            hi4s: "J9,J5,I9,I5",
            reasons: [
              "STAR I5: Col-i is otherwise cleared",
              "CLEAR J5: adjacent to star",
              "STAR I9: Col-i is otherwise cleared",
              "CLEAR J9: adjacent to star",
            ],
            caption:
              "The highlighted column has two cells remaining where we can place its stars. So we place those stars and eliminate the adjacent squares.",
          },
          {
            step: 48,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1,I3,H9,F9,J9,J5,J7",
            stars: "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2,J3,G9,I9,I5",
            his: "J1,J2,J3,J4,J5,J6,J7,J8,J9,J10",
            rhi: "Col-j",
            hi4s: "J7",
            reasons: ["CLEAR J7: Col-j is already full of stars"],
            caption:
              "The highlighted column has all its stars. We can eliminate its remaining square.",
          },
          {
            step: 49,
            dots: "J2,I1,I2,D3,B1,C1,D1,B2,D2,B3,C3,J4,I4,C5,B5,F4,I6,G5,A3,J6,A2,A1,B7,C8,A5,B6,C9,A9,G8,C7,E7,A7,B9,E8,D7,I8,G6,J10,E6,F6,H6,F8,J8,F10,G10,H8,H10,I10,D6,D5,C10,C4,D4,A4,E9,D9,A8,B10,E10,I7,G7,H4,F5,F3,F2,H3,G3,E4,E2,H5,E1,G2,G1,H1,I3,H9,F9,J9,J5,J7",
            stars:
              "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2,J3,G9,I9,I5,F7",
            his: "E6,F6,G6,H6,I6,J6,E7,F7,G7,I7,J7,E8,F8,G8,I8,J8,C9,D9,E9,F9,I9,J9,F10,G10",
            rhi: "Cage-8",
            hi4s: "F7",
            reasons: ["STAR F7: Cage-8 is otherwise cleared"],
            caption:
              "The highlighted region has one cell remaining where we can place its second star. So we place the star there.",
          },
          {
            step: 50,
            stars:
              "J1,C2,C6,A6,B4,D8,B8,A10,D10,H7,E5,E3,G4,F1,H2,J3,G9,I9,I5,F7",
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
Region grid:
0 0 0 0 1 1 1 1 1 2
0 0 3 0 1 1 1 1 1 2
0 3 3 0 4 4 4 4 2 2
0 3 3 0 4 5 5 5 5 5
0 0 0 0 4 4 4 5 5 5
0 6 0 6 7 7 7 7 7 7
8 6 6 6 7 7 7 9 7 7
8 6 6 6 7 7 7 9 7 7
8 6 7 7 7 7 9 9 7 7
8 8 8 8 8 7 7 9 9 9

--- Cycle 1: 2×2 Tiling (level 1) ---
. . . . . . . . X .
. . . . . . . . X X
. X X . . . . . . .
. . . . . . . . X X
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 2: Forced Placement (level 0) ---
. . . . . . . . X ★
. . . . . . . . X X
. X X . . . . . . .
. . . . . . . . X X
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 3: Forced Placement (level 0) ---
. . . . . . . . X ★
. . ★ . . . . . X X
. X X . . . . . . .
. . . . . . . . X X
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 4: Star Neighbors (level 0) ---
. X X X . . . . X ★
. X ★ X . . . . X X
. X X X . . . . . .
. . . . . . . . X X
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . . . .

--- Cycle 5: Finned Counts (level 5) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X . X X . X . . X X
X X X X . . X . . .
. X . X X X X X X X
X X X X X . . . . .
X . X . X . X . X .
X X X X X . . . . .
. X X . X . X . X .

--- Cycle 6: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X . X X . X . . X X
X X X X . . X . . .
★ X . X X X X X X X
X X X X X . . . . .
X . X . X . X . X .
X X X X X . . . . .
. X X . X . X . X .

--- Cycle 7: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X . X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X . X . X . X . X .
X X X X X . . . . .
. X X . X . X . X .

--- Cycle 8: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X . X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X . X . X . X . X .
X X X X X . . . . .
★ X X . X . X . X .

--- Cycle 9: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X . X . X . X . X .
X X X X X . . . . .
★ X X . X . X . X .

--- Cycle 10: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X ★ X . X . X . X .
X X X X X . . . . .
★ X X . X . X . X .

--- Cycle 11: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X ★ X ★ X . X . X .
X X X X X . . . . .
★ X X . X . X . X .

--- Cycle 12: Row Complete (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X . X . X . X .

--- Cycle 13: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X . X . X .

--- Cycle 14: Row Complete (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . . . .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 15: Forced Placement (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . . ★ . .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 16: Star Neighbors (level 0) ---
X X X X . . . . X ★
X X ★ X . . . . X X
X X X X . . . . . .
X ★ X X . X . . X X
X X X X . . X . . .
★ X ★ X X X X X X X
X X X X X . X ★ X .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 17: Finned Counts (level 5) ---
X X X X . . . . X ★
X X ★ X . X . . X X
X X X X . . . X . .
X ★ X X . X . X X X
X X X X . X X . . .
★ X ★ X X X X X X X
X X X X X . X ★ X .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 18: Finned Counts (level 5) ---
X X X X . . . . X ★
X X ★ X . X X . X X
X X X X . X . X . .
X ★ X X . X . X X X
X X X X . X X . . .
★ X ★ X X X X X X X
X X X X X . X ★ X .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 19: Composite Regions (level 6) ---
X X X X X . . . X ★
X X ★ X . X X . X X
X X X X . X . X . .
X ★ X X . X . X X X
X X X X . X X . . .
★ X ★ X X X X X X X
X X X X X ★ X ★ X .
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 20: Row Complete (level 0) ---
X X X X X . . . X ★
X X ★ X . X X . X X
X X X X . X . X . .
X ★ X X . X . X X X
X X X X . X X . . .
★ X ★ X X X X X X X
X X X X X ★ X ★ X X
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

--- Cycle 21: Composite Regions (level 6) ---
X X X X X . . X X ★
X X ★ X . X X . X X
X X X X . X . X . .
X ★ X X . X . X X X
X X X X . X X . . .
★ X ★ X X X X X X X
X X X X X ★ X ★ X X
X ★ X ★ X X X X X X
X X X X X . . . . .
★ X X ★ X X X X X X

=== STUCK ===
```

Look at where our puzzle gets stuck, we know that a star must be placed in eiuther row 8 column 6 (o-indexed) or row 8 column 7 to satisfy region 9

We know a star must be palced in either row 3 column 6 or row 4 column 7 to satisy region 5. 

We know that we mtst place a star in either row 0 column 6, row 0 column 7, row 1 column 6, or row 1 column 7 to satisy region 1.


given that, we can elimiate row 2 column 7 and row 2 column 8 because two more tsars can be fit in region 4's row 4.

Why are our current rules not picking this up?

