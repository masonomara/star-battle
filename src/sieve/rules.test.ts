import { describe, it, expect } from "vitest";
import {
  trivialStarMarks,
  trivialRowComplete,
  trivialColComplete,
  trivialRegionComplete,
  forcedPlacement,
  twoByTwoTiling,
} from "./rules";
import { Board, CellState } from "./types";

describe("1. Star Neighbors", () => {
  it("1.1 marks all 8 neighbors", () => {
    // 3x3 board, star in center
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialStarMarks(board, cells);

    // All 8 neighbors should be marked
    expect(result).toEqual([
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ]);
  });

  it("1.2 handles corner ★ (3 neighbors)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("1.3 handles edge ★ (5 neighbors)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toEqual([
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("1.4 returns null if no changes", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Star already has all neighbors marked
    const cells: CellState[][] = [
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toBeNull();
  });

  it("1.5 marks neighbors of multiple ★s (2★)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      stars: 2,
    };

    // Two stars placed far apart - both should have neighbors marked
    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "star"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "marked", "marked"],
      ["unknown", "unknown", "unknown", "marked", "star"],
      ["unknown", "unknown", "unknown", "marked", "marked"],
    ]);
  });
});

describe("2. Row Complete", () => {
  it("2.1 marks remaining cells when row complete (1★)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Row 0 has 1 star, should mark the rest of that row
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("2.2 marks remaining cells when row complete (2★)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      stars: 2,
    };

    // Row 1 has 2 stars, should mark the rest of that row
    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toEqual([
      ["unknown", "unknown", "unknown", "unknown"],
      ["star", "marked", "star", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("2.3 returns null when no row complete", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 2,
    };

    // No row has 2 stars yet
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toBeNull();
  });

  it("2.4 returns null when no unknowns left", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Row 0 has 1 star but all other cells already marked
    const cells: CellState[][] = [
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toBeNull();
  });

  it("2.5 marks multiple rows simultaneously", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Row 0 and row 2 both have 1 star
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "star"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["marked", "marked", "star"],
    ]);
  });
});

describe("3. Column Complete", () => {
  it("3.1 marks remaining cells when column complete (1★)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Col 0 has 1 star, should mark the rest of that column
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ]);
  });

  it("3.2 marks remaining cells when column complete (2★)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      stars: 2,
    };

    // Col 1 has 2 stars, should mark the rest of that column
    const cells: CellState[][] = [
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toEqual([
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "marked", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "marked", "unknown", "unknown"],
    ]);
  });

  it("3.3 returns null when no column complete", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 2,
    };

    // No column has 2 stars yet
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toBeNull();
  });

  it("3.4 returns null when no unknowns left", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Col 0 has 1 star but all other cells already marked
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toBeNull();
  });

  it("3.5 marks multiple columns simultaneously", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    // Col 0 and col 2 both have 1 star
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "star"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toEqual([
      ["star", "unknown", "marked"],
      ["marked", "unknown", "marked"],
      ["marked", "unknown", "star"],
    ]);
  });
});

describe("4. Region Complete", () => {
  it("4.1 marks remaining cells when region complete (1★)", () => {
    // Region 0 = left column, Region 1 = right two columns
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 1,
    };

    // Region 0 has 1 star, should mark rest of region 0
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ]);
  });

  it("4.2 marks remaining cells when region complete (2★)", () => {
    // Region 0 = top two rows, Region 1 = bottom two rows
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    // Region 0 has 2 stars, should mark rest of region 0
    const cells: CellState[][] = [
      ["star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toEqual([
      ["star", "marked", "star", "marked"],
      ["marked", "marked", "marked", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("4.3 returns null when no region complete", () => {
    // Region 0 = left column, Region 1 = right two columns
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 2,
    };

    // Neither region has 2 stars yet
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBeNull();
  });

  it("4.4 returns null when no unknowns left", () => {
    // Region 0 = left column, Region 1 = right two columns
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 1,
    };

    // Region 0 has 1 star but all other cells already marked
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBeNull();
  });

  it("4.5 marks multiple regions simultaneously", () => {
    // 3 irregular regions:
    // Region 0: L-shape top-left (3 cells)
    // Region 1: irregular middle-right (6 cells)
    // Region 2: bottom area (7 cells)
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 1, 1, 1],
        [2, 2, 2, 1],
        [2, 2, 2, 2],
      ],
      stars: 1,
    };

    // Region 0 and region 2 both have 1 star
    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "unknown"],
      ["marked", "star", "marked", "unknown"],
      ["marked", "marked", "marked", "marked"],
    ]);
  });

  it("4.6 handles L-shaped region", () => {
    // Region 0 = L-shape, Region 1 = fills the rest
    // Grid layout:
    //   0 1 1
    //   0 1 1
    //   0 0 1
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 0, 1],
      ],
      stars: 1,
    };

    // Region 0 (L-shaped) has 1 star at [0,0]
    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    // Should mark all other cells in L-shaped region 0: [1,0], [2,0], [2,1]
    expect(result).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "marked", "unknown"],
    ]);
  });
});

describe("5. Forced Placement", () => {
  describe("5.1 Row forced placement", () => {
    it("5.1.1 places ★ when 1 unknown, needs 1★", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      // Row 0 has 1 unknown, needs 1 star
      const cells: CellState[][] = [
        ["marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "star", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("5.1.2 places ★s when 2 unknowns, needs 2★", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      // Row 1 has 2 unknowns, needs 2 stars
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "star", "marked", "star"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.1.3 places remaining ★ (has 1★, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      // Row 0 has 1 star already, 1 unknown, needs 1 more star
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["star", "marked", "star", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.2 Column forced placement", () => {
    it("5.2.1 places ★ when 1 unknown, needs 1★", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      // Col 0 has 1 unknown, needs 1 star
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("5.2.2 places ★s when 2 unknowns, needs 2★", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      // Col 2 has 2 unknowns, needs 2 stars
      const cells: CellState[][] = [
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "star", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "star", "unknown"],
      ]);
    });

    it("5.2.3 places remaining ★ (has 1★, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      // Col 0 has 1 star already, 1 unknown, needs 1 more star
      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.3 Region forced placement", () => {
    it("5.3.1 places ★ when 1 unknown, needs 1★", () => {
      // Region 0 = left column, Region 1 = right two columns
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 1, 1],
        ],
        stars: 1,
      };

      // Region 0 has 1 unknown at [1,0], needs 1 star
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("5.3.2 places ★s when 2 unknowns, needs 2★", () => {
      // Region 0 = top-left 2x2, Region 1 = rest
      // Designed so no row/col accidentally triggers (each has 3+ unknowns)
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // Region 0 (top-left 2x2) has 2 unknowns at [0,0] and [1,1], needs 2 stars
      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["star", "marked", "unknown", "unknown"],
        ["marked", "star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.3 places ★ in L-shaped region", () => {
      // Region 0 = L-shape, Region 1 = fills the rest
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 0, 1],
        ],
        stars: 1,
      };

      // Region 0 (L-shaped) has 1 unknown at [2,1], needs 1 star
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "star", "unknown"],
      ]);
    });

    it("5.3.4 places remaining ★ (has 1★, 1 unknown)", () => {
      // Region 0 = left two cols, Region 1 = right three cols
      // 5x5 grid ensures each row/col has 3+ unknowns
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 1, 1],
        ],
        stars: 2,
      };

      // Region 0 has 1 star already at [0,0], 1 unknown at [4,1], needs 1 more
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "star", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.5 places ★ in scattered region", () => {
      // Region 0 = 4 corners (non-contiguous), Region 1 = everything else
      // Grid layout (4x4 to avoid row/col triggers):
      //   0 1 1 0
      //   1 1 1 1
      //   1 1 1 1
      //   0 1 1 0
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [0, 1, 1, 0],
        ],
        stars: 1,
      };

      // Region 0 (4 corners) has 1 unknown at [3,3], needs 1 star
      // Each row/col has 3+ unknowns so they don't trigger
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "star"],
      ]);
    });

    it("5.3.6 places ★s in multiple regions", () => {
      // 4 vertical stripe regions in a 4x4 grid
      // Each row has 3+ unknowns so rows don't trigger
      const board: Board = {
        grid: [
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
        ],
        stars: 1,
      };

      // Region 0 and Region 3 both have exactly 1 unknown, regions 1 and 2 have more
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["star", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "star"],
      ]);
    });
  });

  describe("5.4 No forced placement", () => {
    it("5.4.1 returns null when nothing forced", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      // All rows/cols have more unknowns than needed stars
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBeNull();
    });

    it("5.4.2 returns null when more unknowns than needed", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      // Row 0 has 2 unknowns but only needs 1 star
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBeNull();
    });

    it("5.4.3 returns null when row already has all ★s", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      // Row 0 already has its star
      const cells: CellState[][] = [
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBeNull();
    });
  });

  describe("5.5 Multiple forced placements", () => {
    it("5.5.1 places ★s in multiple rows", () => {
      // 4x4 grid so columns don't accidentally trigger (each col has 3+ unknowns)
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };

      // Row 0 and row 3 both have exactly 1 unknown
      const cells: CellState[][] = [
        ["marked", "unknown", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "star", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "star"],
      ]);
    });

    it("5.5.2 places ★s from row, column, and region together", () => {
      // Region 0 = top-left 2x2, Region 1 = rest
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };

      // Row 2 col 2 is forced by row, col 0 row 1 forced by region 0
      const cells: CellState[][] = [
        ["marked", "marked", "marked"],
        ["unknown", "marked", "marked"],
        ["marked", "marked", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toEqual([
        ["marked", "marked", "marked"],
        ["star", "marked", "marked"],
        ["marked", "marked", "star"],
      ]);
    });
  });
});

describe("6. The 2×2", () => {
  describe("6.1 Single cell in tile forces star", () => {
    it("6.1.1 places ★ when tile has 1 cell in region", () => {
      // 6×6 2★ puzzle with 5 regions
      // Region 0: 2×2 block with a tail at [2,1]
      //   0 0 1 1 1 1
      //   0 0 1 1 1 1
      //   2 0 1 1 3 3
      //   2 2 2 3 3 3
      //   2 2 4 4 4 4
      //   2 4 4 4 4 4
      // Region 0 cells: [0,0], [0,1], [1,0], [1,1], [2,1] - contiguous
      // Tile [0,0] covers the 2×2 block (4 cells)
      // Tile [1,0] covers [2,1] but other cells are outside region 0
      // 2 tiles, 2★ → tight bound, [2,1] must be star
      const board: Board = {
        grid: [
          [0, 0, 1, 1, 1, 1],
          [0, 0, 1, 1, 1, 1],
          [2, 0, 1, 1, 3, 3],
          [2, 2, 2, 3, 3, 3],
          [2, 2, 4, 4, 4, 4],
          [2, 4, 4, 4, 4, 4],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      // [2,1] is the tail - only region 0 cell in its covering tile
      expect(result).not.toBeNull();
      expect(result![2][1]).toBe("star");
    });

    it("6.1.2 places ★ when tile has 1 unknown (others marked)", () => {
      // Region tiles with N tiles, needs N stars
      // One tile has 3 cells marked, 1 unknown → unknown is star
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 4,
      };

      // 4×4 single region needs 4 tiles (each 2×2 quadrant)
      // 4 tiles = 4 stars needed, each tile has exactly 1 star
      // If one tile has 3 cells marked, the 4th must be a star
      const cells: CellState[][] = [
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).not.toBeNull();
      expect(result![1][1]).toBe("star");
    });
  });

  describe("6.2 No deduction cases", () => {
    it("6.2.1 returns null when tiles > stars needed", () => {
      // Region that needs 3 tiles but only 2★ puzzle
      // Tiles give upper bound of 3, but we need 2, no forced placement
      const board: Board = {
        grid: [
          [0, 1, 0, 1],
          [1, 1, 1, 1],
          [0, 1, 0, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // Region 0: [0,0], [0,2], [2,0], [2,2] - 4 corners
      // Each corner needs its own tile (they're isolated)
      // 4 tiles for 2★ → just upper bound, no deduction

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).toBeNull();
    });

    it("6.2.2 returns null when multiple cells viable in each tile", () => {
      // 2×2 region in 1★ puzzle - 1 tile, 1 star, but 4 cells viable
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).toBeNull();
    });

    it("6.2.3 returns null when region already has stars placed", () => {
      // Region has its stars, nothing to deduce
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).toBeNull();
    });
  });

  describe("6.3 Complex region shapes", () => {
    it("6.3.1 places ★s in disconnected region cells", () => {
      // Region 0: two isolated cells [0,0] and [2,2]
      //   0 . .
      //   . . .
      //   . . 0
      // Each cell needs its own tile → 2 tiles
      // 2★ puzzle → each tile has exactly 1 star
      // Each tile has only 1 region cell → both must be stars
      const board: Board = {
        grid: [
          [0, 1, 1],
          [1, 1, 1],
          [1, 1, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).not.toBeNull();
      expect(result![0][0]).toBe("star");
      expect(result![2][2]).toBe("star");
    });

    it("6.3.2 places ★s in vertical strip with marks", () => {
      // Region 0: column 0 (4 cells), needs 2 tiles
      // With [0,0] and [2,0] marked, each tile has 1 unknown
      //   X . . .      (X = marked)
      //   ? . . .      (? = must be star)
      //   X . . .
      //   ? . . .
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).not.toBeNull();
      expect(result![1][0]).toBe("star");
      expect(result![3][0]).toBe("star");
    });
  });

  describe("6.4 Interaction with existing stars", () => {
    it("6.4.1 returns null when remaining cells have multiple options", () => {
      // Region 0 has 1 star, needs 1 more
      // Remaining unknowns [0,2] and [1,2] tile with 1 tile
      // But tile has 2 viable cells → no forced placement
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [0, 0, 0, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).toBeNull();
    });
  });
});
