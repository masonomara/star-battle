import { describe, it, expect } from "vitest";
import { trivialStarMarks, trivialRowComplete, trivialColComplete, trivialRegionComplete, forcedPlacement } from "./rules";
import { Board, CellState } from "./types";

describe("Trivial Marks", () => {
  it("Marks all cells that share an edge or corner with a star", () => {
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

  it("Handles star in corner (3 neighbors)", () => {
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

  it("Handles star on edge (5 neighbors)", () => {
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

  it("Returns null if no changes made", () => {
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

  it("Marks neighbors of multiple stars (2-star puzzle)", () => {
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

describe("Trivial Row Complete", () => {
  it("Marks the remainder of a row once it has that many stars (1-star)", () => {
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

  it("Marks the remainder of a row once it has that many stars (2-star)", () => {
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

  it("Returns null when no row is complete", () => {
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

  it("Returns null when complete row has no unknowns left", () => {
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

  it("Marks multiple rows when both are complete", () => {
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

describe("Trivial Col Complete", () => {
  it("Marks the remainder of a column once it has that many stars (1-star)", () => {
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

  it("Marks the remainder of a column once it has that many stars (2-star)", () => {
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

  it("Returns null when no column is complete", () => {
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

  it("Returns null when complete column has no unknowns left", () => {
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

  it("Marks multiple columns when both are complete", () => {
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

describe("Trivial Region Complete", () => {
  it("Marks the remainder of a region once it has that many stars (1-star)", () => {
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

  it("Marks the remainder of a region once it has that many stars (2-star)", () => {
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

  it("Returns null when no region is complete", () => {
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

  it("Returns null when complete region has no unknowns left", () => {
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

  it("Marks multiple regions when both are complete", () => {
    // 3 regions: 0 = top-left 2x2, 1 = top-right 2x2, 2 = bottom row
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [2, 2, 2, 2],
      ],
      stars: 1,
    };

    // Region 0 and region 2 both have 1 star
    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toEqual([
      ["star", "marked", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown"],
      ["marked", "star", "marked", "marked"],
    ]);
  });

  it("Handles L-shaped region", () => {
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

describe("Forced Placement", () => {
  describe("Row forced placement", () => {
    it("Places star when row has exactly 1 unknown and needs 1 star", () => {
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

    it("Places stars when row has exactly 2 unknowns and needs 2 stars", () => {
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

    it("Places remaining star when row has 1 star and 1 unknown", () => {
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

  describe("Column forced placement", () => {
    it("Places star when column has exactly 1 unknown and needs 1 star", () => {
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

    it("Places stars when column has exactly 2 unknowns and needs 2 stars", () => {
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

    it("Places remaining star when column has 1 star and 1 unknown", () => {
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

  describe("Region forced placement", () => {
    it("Places star when region has exactly 1 unknown and needs 1 star", () => {
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

    it("Places stars when region has exactly 2 unknowns and needs 2 stars", () => {
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

    it("Places remaining star in L-shaped region", () => {
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

    it("Places remaining star when region has 1 star and 1 unknown", () => {
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

    it("Places star in scattered (non-contiguous) region", () => {
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

    it("Places stars in multiple regions simultaneously", () => {
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

  describe("No forced placement", () => {
    it("Returns null when no row/col/region has forced placement", () => {
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

    it("Returns null when row has more unknowns than needed", () => {
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

    it("Returns null when row already has all stars", () => {
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

  describe("Multiple forced placements", () => {
    it("Places stars in multiple rows simultaneously", () => {
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

    it("Places stars from row, column, and region constraints together", () => {
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
