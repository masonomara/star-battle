import { describe, it, expect } from "vitest";
import {
  trivialStarMarks,
  trivialRowComplete,
  trivialColComplete,
  trivialRegionComplete,
  forcedPlacement,
  twoByTwoTiling,
  oneByNConfinement,
} from "./rules";
import { Board, CellState } from "./types";

describe("1. Star Neighbors", () => {
  it("1.1 marks all 8 neighbors", () => {
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

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ]);
  });

  it("1.2 handles corner star (3 neighbors)", () => {
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

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "unknown"],
      ["marked", "marked", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("1.3 handles edge star (5 neighbors)", () => {
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

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("1.4 returns false if no changes", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["marked", "marked", "marked"],
      ["marked", "star", "marked"],
      ["marked", "marked", "marked"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toBe(false);
  });

  it("1.5 marks neighbors of multiple stars (2 stars)", () => {
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

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown", "star"],
      ["unknown", "unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialStarMarks(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "unknown", "unknown", "unknown"],
      ["marked", "marked", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "marked", "marked"],
      ["unknown", "unknown", "unknown", "marked", "star"],
      ["unknown", "unknown", "unknown", "marked", "marked"],
    ]);
  });
});

describe("2. Row Complete", () => {
  it("2.1 marks remaining cells when row complete (1 star)", () => {
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

    const result = trivialRowComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });

  it("2.2 marks remaining cells when row complete (2 stars)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "unknown", "unknown", "unknown"],
      ["star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["unknown", "unknown", "unknown", "unknown"],
      ["star", "marked", "star", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("2.3 returns false when no row complete", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toBe(false);
  });

  it("2.4 returns false when no unknowns left", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toBe(false);
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

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "star"],
    ];

    const result = trivialRowComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["marked", "marked", "star"],
    ]);
  });
});

describe("3. Column Complete", () => {
  it("3.1 marks remaining cells when column complete (1 star)", () => {
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

    const result = trivialColComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ]);
  });

  it("3.2 marks remaining cells when column complete (2 stars)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "marked", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "marked", "unknown", "unknown"],
    ]);
  });

  it("3.3 returns false when no column complete", () => {
    const board: Board = {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toBe(false);
  });

  it("3.4 returns false when no unknowns left", () => {
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
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toBe(false);
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

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "star"],
    ];

    const result = trivialColComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "marked"],
      ["marked", "unknown", "marked"],
      ["marked", "unknown", "star"],
    ]);
  });
});

describe("4. Region Complete", () => {
  it("4.1 marks remaining cells when region complete (1 star)", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ]);
  });

  it("4.2 marks remaining cells when region complete (2 stars)", () => {
    const board: Board = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "star", "marked"],
      ["marked", "marked", "marked", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ]);
  });

  it("4.3 returns false when no region complete", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 2,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "star", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(false);
  });

  it("4.4 returns false when no unknowns left", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 1, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(false);
  });

  it("4.5 marks multiple regions simultaneously", () => {
    const board: Board = {
      grid: [
        [0, 0, 1, 1],
        [0, 1, 1, 1],
        [2, 2, 2, 1],
        [2, 2, 2, 2],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "unknown"],
      ["marked", "star", "marked", "unknown"],
      ["marked", "marked", "marked", "marked"],
    ]);
  });

  it("4.6 handles L-shaped region", () => {
    const board: Board = {
      grid: [
        [0, 1, 1],
        [0, 1, 1],
        [0, 0, 1],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown"],
      ["marked", "unknown", "unknown"],
      ["marked", "marked", "unknown"],
    ]);
  });

  it("4.7 handles scattered (non-contiguous) region", () => {
    const board: Board = {
      grid: [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [0, 1, 1, 0],
      ],
      stars: 1,
    };

    const cells: CellState[][] = [
      ["star", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
    ];

    const result = trivialRegionComplete(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "unknown", "unknown", "marked"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown", "unknown"],
      ["marked", "unknown", "unknown", "marked"],
    ]);
  });
});

describe("5. Forced Placement", () => {
  describe("5.1 Row forced placement", () => {
    it("5.1.1 places star when 1 unknown, needs 1 star", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "star", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ]);
    });

    it("5.1.2 places ONE star when 2 unknowns, needs 2 stars", () => {
      // Row 1 has unknowns at (1,1) and (1,3) - not adjacent
      // forcedPlacement places ONE star at a time
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,1)
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "star", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.1.3 places remaining star (has 1 star, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "star", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.2 Column forced placement", () => {
    it("5.2.1 places star when 1 unknown, needs 1 star", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("5.2.2 places ONE star when 2 unknowns, needs 2 stars", () => {
      // Col 2 has unknowns at (1,2) and (3,2) - not adjacent
      // forcedPlacement places ONE star at a time
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,2)
      expect(cells).toEqual([
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "star", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.2.3 places remaining star (has 1 star, 1 unknown)", () => {
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["star", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.3 Region forced placement", () => {
    it("5.3.1 places star when 1 unknown, needs 1 star", () => {
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "unknown", "unknown"],
        ["star", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ]);
    });

    it("5.3.2 returns false when 2 unknowns are diagonally adjacent", () => {
      // Region 0 has 2 unknowns at (0,0) and (1,1) - diagonally adjacent.
      // forcedPlacement correctly refuses to place stars since both would need
      // to be stars but they can't be adjacent. This is an unsolvable config.
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      // Returns false because unknowns are adjacent - can't both be stars
      expect(result).toBe(false);
      // No change to cells
      expect(cells).toEqual([
        ["unknown", "marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.3 returns false when 2 unknowns are orthogonally adjacent", () => {
      // Region 0 has 2 unknowns at (0,0) and (0,1) - horizontally adjacent.
      // forcedPlacement correctly refuses to place stars since both would need
      // to be stars but they can't be adjacent. This is an unsolvable config.
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      // Returns false because unknowns are adjacent - can't both be stars
      expect(result).toBe(false);
      // No change to cells
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.4 places star in L-shaped region", () => {
      const board: Board = {
        grid: [
          [0, 1, 1],
          [0, 1, 1],
          [0, 0, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "unknown", "unknown"],
        ["marked", "unknown", "unknown"],
        ["marked", "star", "unknown"],
      ]);
    });

    it("5.3.5 places remaining star (has 1 star, 1 unknown)", () => {
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

      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown"],
        ["marked", "star", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.6 places star in scattered region", () => {
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [0, 1, 1, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "star"],
      ]);
    });

    it("5.3.7 places ONE star when multiple regions have forced placements", () => {
      // Region 0 (col 0): only (1,0) unknown, forced
      // Region 3 (col 3): only (3,3) unknown, forced
      // Only ONE star placed per call - region 0 is found first
      const board: Board = {
        grid: [
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "marked"],
        ["unknown", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,0) from region 0
      expect(cells).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["star", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "unknown"],
      ]);
    });
  });

  describe("5.4 No forced placement", () => {
    it("5.4.1 returns false when nothing forced", () => {
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
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });

    it("5.4.2 returns false when more unknowns than needed", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });

    it("5.4.3 returns false when row already has all stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["star", "marked", "marked"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(false);
    });
  });

  describe("5.5 Multiple forced placements", () => {
    it("5.5.1 places ONE star when multiple rows have forced placements", () => {
      // Row 0: only (0,1) unknown, forced
      // Row 3: only (3,3) unknown, forced
      // Only ONE star placed - row 0 is checked first
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "unknown", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (0,1) from row 0
      expect(cells).toEqual([
        ["marked", "star", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "unknown"],
      ]);
    });

    it("5.5.2 places ONE star when row, column, region all have forced placements", () => {
      // Row 1: only (1,0) unknown, forced
      // Col 2: only (2,2) unknown, forced (also region 1)
      // Only ONE star placed - row check comes first, finds (1,0)
      const board: Board = {
        grid: [
          [0, 0, 1],
          [0, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["marked", "marked", "marked"],
        ["unknown", "marked", "marked"],
        ["marked", "marked", "unknown"],
      ];

      const result = forcedPlacement(board, cells);

      expect(result).toBe(true);
      // Only first star placed - (1,0) from row 1
      expect(cells).toEqual([
        ["marked", "marked", "marked"],
        ["star", "marked", "marked"],
        ["marked", "marked", "unknown"],
      ]);
    });
  });
});

describe("6. The 2×2 Tiling", () => {
  describe("6.1 Single-cell tile forces star", () => {
    it("6.1.1 places star when tile covers only one region cell (spec example_tiling_1b)", () => {
      // L-shaped region from spec example_tiling_1a/1b:
      // Region 0:  R R R    (row 0: cols 0,1,2)
      //            R R .    (row 1: cols 0,1)
      // In a 2★ puzzle, minTiles=2, so each tile has exactly 1 star.
      // One tile covers only cell (0,2) from the region → must be a star.
      const board: Board = {
        grid: [
          [0, 0, 0, 1],
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      expect(result).toBe(true);
      expect(cells[0][2]).toBe("star"); // single-cell tile forces this
    });

    it("6.1.2 does not place star if minTiles > stars needed", () => {
      // Region needs 1 star but minTiles=2 → no forced placement
      const board: Board = {
        grid: [
          [0, 0, 0],
          [0, 0, 1],
          [1, 1, 1],
        ],
        stars: 1,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown"],
      ];

      const result = twoByTwoTiling(board, cells);

      // Should not place any stars (minTiles=2 > stars=1 for region 0)
      expect(cells.flat().filter((c) => c === "star").length).toBe(0);
    });
  });

  describe("6.2 All tilings must agree", () => {
    it("6.2.1 does not place star if cell is single-coverage in only some tilings", () => {
      // Shape where different tilings have different single-cell tiles
      // Only place star if ALL tilings agree that cell has single coverage
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      // 2x4 region - can be tiled multiple ways
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      twoByTwoTiling(board, cells);

      // 2x4 can be tiled with 2 tiles, matching stars=2
      // But tilings vary, so no single cell is forced
      // (This test verifies no false positives)
      const stars = cells.flat().filter((c) => c === "star").length;
      expect(stars).toBe(0);
    });
  });

  describe("6.3 Marks from bounds", () => {
    it("6.3.1 marks cells when region cannot fit required stars", () => {
      // Region that can only fit 1 star (minTiles=1) but needs 2
      // This is actually unsolvable, but the rule could mark cells
      // For now, just test that it doesn't crash
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        stars: 2,
      };

      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      // Region 0 is just 2 cells (0,0) and (0,1) - can only hold 1 star max
      // But we need 2 stars per region → unsolvable
      // Rule shouldn't crash, just return false (no progress)
      const result = twoByTwoTiling(board, cells);
      expect(typeof result).toBe("boolean");
    });
  });
});

describe("7. The 1×n Confinement", () => {
  describe("7.1 Row confinement", () => {
    it("7.1.1 marks row remainder when region confined to single row (1 star)", () => {
      // Region 1 unknowns all in row 1 → mark rest of row 1
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [1, 1, 0, 0],
          [1, 1, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(board, cells);

      expect(result).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
    });

    it("7.1.2 marks row remainder when region confined to single row (2 stars)", () => {
      // Region 0 (L-shaped) unknowns all in row 2 → mark rest of row 2
      const board: Board = {
        grid: [
          [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1, 1, 1, 2, 1],
          [0, 0, 0, 1, 1, 1, 2, 2, 2, 2],
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(board, cells);

      expect(result).toBe(true);
      // The three 1s in row 2 should be marked
      expect(cells[2][3]).toBe("marked");
      expect(cells[2][4]).toBe("marked");
      expect(cells[2][5]).toBe("marked");
    });

    it("7.1.3 marks when two 1×n regions together fill row quota", () => {
      // Regions 1 and 2 each confined to row 1, together account for all stars
      const board: Board = {
        grid: [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [1, 1, 0, 0, 0, 0, 2, 2],
          [1, 1, 0, 0, 0, 0, 2, 2],
          [1, 1, 0, 0, 0, 0, 2, 2],
        ],
        stars: 2,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown", "unknown", "unknown", "marked", "marked"],
        ["marked", "marked", "unknown", "unknown", "unknown", "unknown", "marked", "marked"],
      ];

      const result = oneByNConfinement(board, cells);

      expect(result).toBe(true);
      expect(cells[1][2]).toBe("marked");
      expect(cells[1][3]).toBe("marked");
      expect(cells[1][4]).toBe("marked");
      expect(cells[1][5]).toBe("marked");
    });
  });

  describe("7.2 Column confinement", () => {
    it("7.2.1 marks column remainder when region confined to single column", () => {
      // Region 1 unknowns all in col 1 → mark rest of col 1
      const board: Board = {
        grid: [
          [0, 1, 1, 0],
          [0, 1, 1, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(board, cells);

      expect(result).toBe(true);
      expect(cells[2][1]).toBe("marked");
      expect(cells[3][1]).toBe("marked");
    });
  });

  describe("7.3 No confinement", () => {
    it("7.3.1 returns false when regions span multiple rows and columns", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [2, 2, 3, 3],
          [2, 2, 3, 3],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(board, cells);
      expect(result).toBe(false);
    });

    it("7.3.2 returns false when region already has all stars", () => {
      const board: Board = {
        grid: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["star", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
        ["marked", "marked", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(board, cells);
      expect(result).toBe(false);
    });

    it("7.3.3 returns false when 1×n spans entire row (nothing to mark)", () => {
      // Region 1 fills row 1 completely - nowhere else to mark
      const board: Board = {
        grid: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        stars: 1,
      };
      const cells: CellState[][] = [
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ];

      const result = oneByNConfinement(board, cells);
      expect(result).toBe(false);
    });
  });

  describe("7.4 Edge cases", () => {
    it("7.4.1 handles single-cell region (trivially confined)", () => {
      const board: Board = {
        grid: [
          [0, 1, 1, 1],
          [1, 1, 1, 1],
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

      const result = oneByNConfinement(board, cells);

      expect(result).toBe(true);
      expect(cells[0][1]).toBe("marked");
      expect(cells[0][2]).toBe("marked");
      expect(cells[0][3]).toBe("marked");
    });
  });
});
