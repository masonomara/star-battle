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

    it("5.1.2 places stars when 2 unknowns, needs 2 stars", () => {
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
      expect(cells).toEqual([
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "star", "marked", "star"],
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

    it("5.2.2 places stars when 2 unknowns, needs 2 stars", () => {
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
      expect(cells).toEqual([
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "star", "unknown"],
        ["unknown", "unknown", "marked", "unknown"],
        ["unknown", "unknown", "star", "unknown"],
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

    it("5.3.2 places stars when 2 unknowns, needs 2 stars", () => {
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

      expect(result).toBe(true);
      expect(cells).toEqual([
        ["star", "marked", "unknown", "unknown"],
        ["marked", "star", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
      ]);
    });

    it("5.3.3 places star in L-shaped region", () => {
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

    it("5.3.4 places remaining star (has 1 star, 1 unknown)", () => {
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

    it("5.3.5 places star in scattered region", () => {
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

    it("5.3.6 places stars in multiple regions", () => {
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
      expect(cells).toEqual([
        ["marked", "unknown", "unknown", "marked"],
        ["star", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "marked"],
        ["marked", "unknown", "unknown", "star"],
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
    it("5.5.1 places stars in multiple rows", () => {
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
      expect(cells).toEqual([
        ["marked", "star", "marked", "marked"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["unknown", "unknown", "unknown", "unknown"],
        ["marked", "marked", "marked", "star"],
      ]);
    });

    it("5.5.2 places stars from row, column, and region together", () => {
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
      expect(cells).toEqual([
        ["marked", "marked", "marked"],
        ["star", "marked", "marked"],
        ["marked", "marked", "star"],
      ]);
    });
  });
});
