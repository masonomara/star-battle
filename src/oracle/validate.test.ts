import { describe, it, expect } from "vitest";
import { Board, CellState } from "../sieve/helpers/types";
import { bruteForce } from "./bruteForce";
import {
  validateDeductions,
  testRule,
  fuzzTestRule,
  formatCells,
} from "./validate";

// Import all rules to test
import trivialNeighbors from "../sieve/rules/01-trivialNeighbors/trivialNeighbors";
import trivialRows from "../sieve/rules/02-trivialRows/trivialRows";
import trivialColumns from "../sieve/rules/03-trivialColumns/trivialColumns";
import trivialRegions from "../sieve/rules/04-trivialRegions/trivialRegions";
import forcedPlacement from "../sieve/rules/05-forcedPlacement/forcedPlacement";
import twoByTwoTiling from "../sieve/rules/06-twoByTwoTiling/twoByTwoTiling";
import oneByNConfinement from "../sieve/rules/07-oneByNConfinement/oneByNConfinement";
import exclusion from "../sieve/rules/08-exclusion/exclusion";
import undercounting from "../sieve/rules/10-undercounting/undercounting";
import overcounting from "../sieve/rules/11-overcounting/overcounting";

describe("validateDeductions", () => {
  it("accepts valid mark deduction", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [2, 2, 3, 3],
        [2, 2, 3, 3],
      ],
      stars: 1,
    };
    const allSolutions = bruteForce(board);

    // Place a star at (0,0)
    const cellsBefore: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    // Mark neighbors - this should be valid
    const cellsAfter: CellState[][] = [
      ["star", "marked", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = validateDeductions(
      board,
      cellsBefore,
      cellsAfter,
      allSolutions
    );
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("detects false positive mark", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [2, 2, 3, 3],
        [2, 2, 3, 3],
      ],
      stars: 1,
    };
    const allSolutions = bruteForce(board);

    const cellsBefore: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    // Incorrectly mark (0,0) - but it's a valid star position in some solutions
    const cellsAfter: CellState[][] = [
      ["marked", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = validateDeductions(
      board,
      cellsBefore,
      cellsAfter,
      allSolutions
    );

    // Check if (0,0) is actually a star in any solution
    const hasStarAt00 = allSolutions.some((s) => s[0][0] === "star");
    if (hasStarAt00) {
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("false_positive_mark");
    }
  });
});

describe("Rule validation against oracle", () => {
  // Test board that we know is solvable
  const testBoard: Board = {
    grid: [
      [0, 0, 0, 1, 1, 1],
      [0, 0, 0, 1, 1, 1],
      [2, 2, 2, 3, 3, 3],
      [2, 2, 2, 3, 3, 3],
      [4, 4, 4, 5, 5, 5],
      [4, 4, 4, 5, 5, 5],
    ],
    stars: 2,
  };

  describe("trivialNeighbors", () => {
    it("produces no false positives from empty state", () => {
      const result = testRule(trivialNeighbors, testBoard);
      expect(result.valid).toBe(true);
    });

    it("produces no false positives with placed star", () => {
      const solutions = bruteForce(testBoard, 1);
      if (solutions.length === 0) return; // Skip if unsolvable

      // Find a star position from a valid solution
      let starR = -1,
        starC = -1;
      outer: for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          if (solutions[0][r][c] === "star") {
            starR = r;
            starC = c;
            break outer;
          }
        }
      }

      const cells: CellState[][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => "unknown" as CellState)
      );
      cells[starR][starC] = "star";

      const result = testRule(trivialNeighbors, testBoard, cells);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(trivialNeighbors, testBoard, 50, 12345);
      if (failures.length > 0) {
        console.log("trivialNeighbors failures:");
        for (const f of failures) {
          console.log(`Iteration ${f.iteration}:`);
          console.log(formatCells(f.cells));
          console.log("Errors:", f.result.errors);
        }
      }
      expect(failures.length).toBe(0);
    });
  });

  describe("trivialRows", () => {
    it("produces no false positives", () => {
      const result = testRule(trivialRows, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(trivialRows, testBoard, 50, 12345);
      expect(failures.length).toBe(0);
    });
  });

  describe("trivialColumns", () => {
    it("produces no false positives", () => {
      const result = testRule(trivialColumns, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(trivialColumns, testBoard, 50, 12345);
      expect(failures.length).toBe(0);
    });
  });

  describe("trivialRegions", () => {
    it("produces no false positives", () => {
      const result = testRule(trivialRegions, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(trivialRegions, testBoard, 50, 12345);
      expect(failures.length).toBe(0);
    });
  });

  describe("forcedPlacement", () => {
    it("produces no false positives", () => {
      const result = testRule(forcedPlacement, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(forcedPlacement, testBoard, 50, 12345);
      expect(failures.length).toBe(0);
    });
  });

  describe("twoByTwoTiling", () => {
    it("produces no false positives", () => {
      const result = testRule(twoByTwoTiling, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(twoByTwoTiling, testBoard, 50, 12345);
      if (failures.length > 0) {
        console.log("twoByTwoTiling failures:");
        for (const f of failures) {
          console.log(`Iteration ${f.iteration}:`);
          console.log(formatCells(f.cells));
          console.log("Errors:", f.result.errors);
        }
      }
      expect(failures.length).toBe(0);
    });
  });

  describe("oneByNConfinement", () => {
    it("produces no false positives", () => {
      const result = testRule(oneByNConfinement, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(oneByNConfinement, testBoard, 50, 12345);
      if (failures.length > 0) {
        console.log("oneByNConfinement failures:");
        for (const f of failures) {
          console.log(`Iteration ${f.iteration}:`);
          console.log(formatCells(f.cells));
          console.log("Errors:", f.result.errors);
        }
      }
      expect(failures.length).toBe(0);
    });
  });

  describe("exclusion", () => {
    it("produces no false positives", () => {
      const result = testRule(exclusion, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(exclusion, testBoard, 50, 12345);
      if (failures.length > 0) {
        console.log("exclusion failures:");
        for (const f of failures) {
          console.log(`Iteration ${f.iteration}:`);
          console.log(formatCells(f.cells));
          console.log("Errors:", f.result.errors);
        }
      }
      expect(failures.length).toBe(0);
    });
  });

  describe("undercounting", () => {
    it("produces no false positives", () => {
      const result = testRule(undercounting, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(undercounting, testBoard, 50, 12345);
      if (failures.length > 0) {
        console.log("undercounting failures:");
        for (const f of failures) {
          console.log(`Iteration ${f.iteration}:`);
          console.log(formatCells(f.cells));
          console.log("Errors:", f.result.errors);
        }
      }
      expect(failures.length).toBe(0);
    });
  });

  describe("overcounting", () => {
    it("produces no false positives", () => {
      const result = testRule(overcounting, testBoard);
      expect(result.valid).toBe(true);
    });

    it("passes fuzz test", () => {
      const failures = fuzzTestRule(overcounting, testBoard, 50, 12345);
      if (failures.length > 0) {
        console.log("overcounting failures:");
        for (const f of failures) {
          console.log(`Iteration ${f.iteration}:`);
          console.log(formatCells(f.cells));
          console.log("Errors:", f.result.errors);
        }
      }
      expect(failures.length).toBe(0);
    });
  });
});

describe("Comprehensive rule validation", () => {
  // Test with various board configurations
  const boards: { name: string; board: Board }[] = [
    {
      name: "4x4 1-star simple",
      board: {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      },
    },
    {
      name: "5x5 1-star",
      board: {
        grid: [
          [0, 0, 0, 1, 1],
          [0, 0, 1, 1, 1],
          [2, 2, 2, 3, 3],
          [2, 2, 3, 3, 3],
          [4, 4, 4, 4, 4],
        ],
        stars: 1,
      },
    },
    {
      name: "6x6 1-star",
      board: {
        grid: [
          [0, 0, 0, 1, 1, 1],
          [0, 0, 0, 1, 1, 1],
          [2, 2, 2, 3, 3, 3],
          [2, 2, 2, 3, 3, 3],
          [4, 4, 4, 5, 5, 5],
          [4, 4, 4, 5, 5, 5],
        ],
        stars: 1,
      },
    },
  ];

  const rules = [
    { name: "trivialNeighbors", fn: trivialNeighbors },
    { name: "trivialRows", fn: trivialRows },
    { name: "trivialColumns", fn: trivialColumns },
    { name: "trivialRegions", fn: trivialRegions },
    { name: "forcedPlacement", fn: forcedPlacement },
    { name: "twoByTwoTiling", fn: twoByTwoTiling },
    { name: "oneByNConfinement", fn: oneByNConfinement },
    { name: "exclusion", fn: exclusion },
    { name: "undercounting", fn: undercounting },
    { name: "overcounting", fn: overcounting },
  ];

  for (const { name: boardName, board } of boards) {
    describe(boardName, () => {
      for (const { name: ruleName, fn } of rules) {
        it(`${ruleName} is sound`, () => {
          const failures = fuzzTestRule(fn, board, 20, 42);
          if (failures.length > 0) {
            console.log(`\n${ruleName} failed on ${boardName}:`);
            const f = failures[0];
            console.log(formatCells(f.cells));
            console.log("Errors:", f.result.errors);
          }
          expect(failures.length).toBe(0);
        });
      }
    });
  }
});
