import type { Level } from '../types';

// 10×10 introductory level.
//
// Grid (0-indexed, row 0 = top):
//
//   0123456789
// 0 ..........   ← hippo must reach here (any col)
// 1 ..........
// 2 .HHHHH....   H = horizontal log (cols 1–5, len 5)
// 3 ..........
// 4 ...VVV....   V = vertical log (rows 4–6, col 3, len 3)
// 5 ..HHHH...    H2 = horizontal log (cols 2–5, len 4)  -- wait, col 3 occupied by V
//               Actually let me place them without overlap.
//
// Revised clean layout:
//
//   0123456789
// 0 ..........
// 1 ..........
// 2 .HHHHH....   log-a: horizontal, row=2, col=1, len=5
// 3 ..........
// 4 .......VV.   log-b: vertical,   row=4, col=7, len=3 (rows 4-6)
// 5 .HHH......   log-c: horizontal, row=5, col=1, len=3
// 6 ..........
// 7 ....HHHH..   log-d: horizontal, row=7, col=4, len=4
// 8 ..........
// 9 .....H....   hippo starts at row=9, col=5
//
// Hippo is at (9,5). To reach row 0 it needs to pass through col 5.
// log-a blocks col 1-5 on row 2.  Player must slide log-a right (or left)
// to open col 5.  log-c and log-d provide minor detour obstacles.

export const level1: Level = {
  id: 'level1',
  label: 'Level 1',
  rows: 10,
  cols: 10,
  logs: [
    { id: 'log-a', orientation: 'horizontal', row: 2, col: 1, length: 5 },
    { id: 'log-b', orientation: 'vertical',   row: 4, col: 7, length: 3 },
    { id: 'log-c', orientation: 'horizontal', row: 5, col: 1, length: 3 },
    { id: 'log-d', orientation: 'horizontal', row: 7, col: 4, length: 4 },
  ],
  hippoStart: { row: 9, col: 5 },
  mamaCol: 5,
};
