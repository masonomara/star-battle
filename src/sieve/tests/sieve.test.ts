import { describe, expect, it } from "vitest";
import { layout } from "../generator";

describe("layout", () => {
  it("produces identical boards for the same seed", () => {
    const seed = 12345;
    const first = layout(10, 2, seed);
    const second = layout(10, 2, seed);

    expect(first.grid).toEqual(second.grid);
    expect(first.stars).toEqual(second.stars);
  });
});
