export type Cell = {
  row: number;
  col: number;
};

export type Region = Cell[];

export type Grid = {
  size: number;
  regions: Region[];
};

export type LayoutConfig = {
  size: number;
  seed?: number;
};
