export type Orientation = 'horizontal' | 'vertical';

export interface Log {
  id: string;
  orientation: Orientation;
  row: number;    // top-left cell row (0-indexed, 0 = top)
  col: number;    // top-left cell col (0-indexed)
  length: number; // number of cells (2–5)
}

export interface Level {
  id: string;
  label: string;
  rows: number;
  cols: number;
  logs: Log[];
  hippoStart: { row: number; col: number };
  mamaCol: number; // column where mama hippo waits (win = reach row 0 at this col)
}

export interface GameState {
  level: Level;
  logs: Log[];    // current (mutable) positions
  hippoPos: { row: number; col: number };
  moves: number;
  won: boolean;
}
