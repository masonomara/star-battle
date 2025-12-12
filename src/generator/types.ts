export type Cell = {
  row: number;
  col: number;
};

export type Shape = Cell[];

export type Grid = {
  size: number;
  shapes: Shape[];
};

export type LayoutConfig = {
  size: number;
  seed?: number;
};
