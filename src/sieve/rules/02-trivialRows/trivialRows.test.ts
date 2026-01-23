import { describe, it, expect } from "vitest";
import trivialRows from "./trivialRows";
import { Board, CellState } from "../../helpers/types";

describe("2. Row Complete", () => {
  it("2.1 marks remaining cells when row complete", () => {
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

    const result = trivialRows(board, cells);

    expect(result).toBe(true);
    expect(cells).toEqual([
      ["star", "marked", "marked"],
      ["unknown", "unknown", "unknown"],
      ["unknown", "unknown", "unknown"],
    ]);
  });
});
