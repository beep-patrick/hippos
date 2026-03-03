export type Orientation = 'horizontal' | 'vertical';

export interface Log {
  id: string;
  orientation: Orientation;
  row: number;    // top-left cell row (0-indexed, 0 = top)
  col: number;    // top-left cell col (0-indexed)
  length: number; // number of cells (2–50)
}

export interface HippoObstacle {
  id: string;
  orientation: Orientation;
  row: number;    // top-left cell row
  col: number;    // top-left cell col
  // always exactly 2 cells; can only slide within river cells
}

export interface Level {
  id: string;
  label: string;
  rows: number;
  cols: number;
  logs: Log[];
  hippoObstacles: HippoObstacle[];
  hippoStart: { row: number; col: number };
  mamaPos: { row: number; col: number }; // mama hippo's anchor (top-left) cell
  mamaWidth?: number;  // cells mama spans horizontally (default 1)
  mamaHeight?: number; // cells mama spans vertically (default 1)
  riverCells?: Set<string>; // "row,col" keys; undefined = whole grid is passable
  boulders?: Array<{ row: number; col: number }>; // immovable obstacles
  bleedTop?: number;    // impassable visual-bleed rows at top (default 0)
  bleedBottom?: number; // impassable visual-bleed rows at bottom (default 0)
}

export interface GameState {
  level: Level;
  logs: Log[];              // current (mutable) positions
  hippoObstacles: HippoObstacle[]; // current (mutable) positions
  hippoPos: { row: number; col: number };
  moves: number;
  won: boolean;
}
