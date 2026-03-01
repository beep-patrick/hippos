import { parseLevel } from '../parseLevel';

// 10×10 introductory level — blocking chain.
//
// Solution (~12 moves):
//   1. Slide log-d aside          — clears col 5 on row 6 (warmup)
//   2. Slide log-b up or down     — clears col 1 on row 3 (the "aha": log-b is what's blocking log-a)
//   3. Slide log-a left to col=0  — clears col 5 on row 3
//   4. Walk hippo up col 5 to (0,5) — win!
//
// log-a (len=5) cannot escape right: rightmost valid anchor is col=5,
// which still covers col 5. Left is the only escape, blocked by log-b.

export const level1 = parseLevel('level1', 'Level 1', `
  . . . . . M . . . .
  . . . . . . . . . .
  . B . . . . . . . .
  . B A A A A A . . .
  . . . . . . . . . .
  . . . . . . . . . .
  . . . . D D D . . .
  . . . . . . . . . .
  . . . . . . . . . .
  . . . . . H . . . .
`, `
  . . . . ~ ~ ~ ~ . .
  . . . . ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ ~ . .
  . . . ~ ~ ~ ~ . . .
  . . . ~ ~ ~ ~ . . .
`);
