import { Board, CellState, Progress } from "./types";
import { neighbors } from "./neighbors";
import { BoardAnalysis } from "./boardAnalysis";

export function checkProgress(
  board: Board,
  cells: CellState[][],
  analysis: BoardAnalysis,
): Progress {
  const { size, rowStars, colStars, regions } = analysis;
  const stars = board.stars;
  let solved = true;

  for (let i = 0; i < size; i++) {
    let rowUnknowns = 0;
    let colUnknowns = 0;
    for (let j = 0; j < size; j++) {
      if (cells[i][j] === "unknown") rowUnknowns++;
      if (cells[j][i] === "unknown") colUnknowns++;
      if (cells[i][j] === "star") {
        for (const [nr, nc] of neighbors(i, j, size)) {
          if (cells[nr][nc] === "star") return "invalid";
        }
      }
    }
    if (rowStars[i] + rowUnknowns < stars || colStars[i] + colUnknowns < stars) {
      return "invalid";
    }
    if (rowStars[i] !== stars || colStars[i] !== stars) {
      solved = false;
    }
  }

  for (const region of regions.values()) {
    if (region.starsPlaced + region.unknownCoords.length < stars) {
      return "invalid";
    }
    if (region.starsPlaced !== stars) {
      solved = false;
    }
  }

  return solved ? "solved" : "valid";
}
