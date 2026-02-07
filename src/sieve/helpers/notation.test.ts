import { describe, it, expect } from "vitest";
import {
  encodePuzzleString,
  decodePuzzleString,
  boardFromPuzzleString,
  isValidPuzzleString,
  encodeSolution,
  encodePuzzle,
  coordToCell,
  cellToCoord,
  rowName,
  colName,
  regionName,
} from "./notation";
import { Board } from "./types";

describe("encodePuzzleString / decodePuzzleString", () => {
  const board: Board = {
    grid: [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ],
    stars: 1,
  };

  it("encodes a board to letter-based layout", () => {
    const str = encodePuzzleString(board);
    expect(str).toBe("4x1.AABBAABBCCDDCCDD");
  });

  it("round-trips encode/decode", () => {
    const str = encodePuzzleString(board);
    const decoded = decodePuzzleString(str);
    expect(decoded.board).toEqual(board);
  });

  it("encodes with metadata", () => {
    const str = encodePuzzleString(board, {
      seed: 42,
      difficulty: 7,
      maxLevel: 4,
      cycles: 12,
    });
    expect(str).toBe("4x1.AABBAABBCCDDCCDD.s42d7l4c12");
  });

  it("decodes metadata", () => {
    const { metadata } = decodePuzzleString(
      "4x1.AABBAABBCCDDCCDD.s42d7l4c12",
    );
    expect(metadata.seed).toBe(42);
    expect(metadata.difficulty).toBe(7);
    expect(metadata.maxLevel).toBe(4);
    expect(metadata.cycles).toBe(12);
  });

  it("accepts lowercase input", () => {
    const decoded = decodePuzzleString("4x1.aabbaabbccddccdd");
    expect(decoded.board).toEqual(board);
  });
});

describe("boardFromPuzzleString", () => {
  it("extracts board from puzzle string", () => {
    const board = boardFromPuzzleString("4x1.AABBAABBCCDDCCDD");
    expect(board.stars).toBe(1);
    expect(board.grid[0]).toEqual([0, 0, 1, 1]);
    expect(board.grid[3]).toEqual([2, 2, 3, 3]);
  });
});

describe("isValidPuzzleString", () => {
  it("returns true for valid strings", () => {
    expect(isValidPuzzleString("4x1.AABBAABBCCDDCCDD")).toBe(true);
  });

  it("returns false for invalid strings", () => {
    expect(isValidPuzzleString("garbage")).toBe(false);
    expect(isValidPuzzleString("4x1.AAAA")).toBe(false); // wrong length
    expect(isValidPuzzleString("4x1.AAAAAAAAAAAAAAAA")).toBe(false); // only 1 region
  });
});

describe("encodeSolution", () => {
  it("encodes a solution with seed and solver stats", () => {
    const str = encodeSolution({
      board: {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      },
      seed: 99,
      maxLevel: 3,
      cycles: 8,
      cells: [],
    });
    expect(str).toBe("4x1.AABBAABBCCDDCCDD.s99l3c8");
  });
});

describe("encodePuzzle", () => {
  it("encodes a puzzle with difficulty", () => {
    const str = encodePuzzle({
      board: {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      },
      seed: 99,
      difficulty: 5,
      maxLevel: 3,
      cycles: 8,
      cells: [],
    });
    expect(str).toBe("4x1.AABBAABBCCDDCCDD.s99d5l3c8");
  });
});

describe("10x10 puzzle string", () => {
  const puzzleStr =
    "10x2.AAAABBBBBCAADABBBBBCADDAEEEECCADDAEFFFFFAAAAEEEFFFAGAGHHHHHHIGGGHHHJHHIGGGHHHJHHIGHHHHJJHHIIIIIHHJJJ";

  it("decodes a 10x10 puzzle", () => {
    const { board } = decodePuzzleString(puzzleStr);
    expect(board.stars).toBe(2);
    expect(board.grid.length).toBe(10);
    expect(board.grid[0]).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 1, 2]);
  });

  it("round-trips a 10x10 puzzle", () => {
    const { board } = decodePuzzleString(puzzleStr);
    const reEncoded = encodePuzzleString(board);
    expect(reEncoded).toBe(puzzleStr);
  });
});

describe("display notation helpers", () => {
  describe("coordToCell", () => {
    it("converts corners", () => {
      expect(coordToCell([0, 0])).toBe("A1");
      expect(coordToCell([0, 9])).toBe("J1");
      expect(coordToCell([9, 0])).toBe("A10");
      expect(coordToCell([9, 9])).toBe("J10");
    });

    it("converts middle cells", () => {
      expect(coordToCell([4, 4])).toBe("E5");
      expect(coordToCell([2, 7])).toBe("H3");
    });
  });

  describe("cellToCoord", () => {
    it("parses cell notation", () => {
      expect(cellToCoord("A1")).toEqual([0, 0]);
      expect(cellToCoord("J10")).toEqual([9, 9]);
      expect(cellToCoord("E5")).toEqual([4, 4]);
    });

    it("round-trips with coordToCell", () => {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          expect(cellToCoord(coordToCell([r, c]))).toEqual([r, c]);
        }
      }
    });
  });

  describe("rowName", () => {
    it("formats row names", () => {
      expect(rowName(0)).toBe("Row-1");
      expect(rowName(9)).toBe("Row-10");
    });
  });

  describe("colName", () => {
    it("formats column names", () => {
      expect(colName(0)).toBe("Col-a");
      expect(colName(9)).toBe("Col-j");
    });
  });

  describe("regionName", () => {
    it("formats region names", () => {
      expect(regionName(0)).toBe("Cage-1");
      expect(regionName(9)).toBe("Cage-10");
    });
  });
});
