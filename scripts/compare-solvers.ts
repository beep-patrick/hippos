import { parseCsvLevel } from '../src/parseCsvLevel.js';
import { initState, moveLog, moveHippo, moveHippoObstacle, checkWin } from '../src/gameState.js';
import { solveLevel as solve1, type SolverMove as SM1 } from '../src/solver.js';
import { solveLevel as solve2, type SolverMove as SM2 } from '../src/solver2.js';
import levelsJson from '../src/levels/levels.generated.json' assert { type: 'json' };

type AnyMove = SM1 | SM2;

function verify(levelEntry: { name: string; csv: string }, path: AnyMove[] | undefined): boolean {
  if (!path) return false;
  const level = parseCsvLevel(levelEntry.name, levelEntry.name, levelEntry.csv);
  const state = initState(level);
  for (const move of path) {
    if (move.type === 'hippo') {
      if (!moveHippo(state, move.dr, move.dc)) return false;
    } else if (move.type === 'log') {
      if (!moveLog(state, move.id, move.newRow, move.newCol)) return false;
    } else {
      if (!moveHippoObstacle(state, move.id, move.newRow, move.newCol)) return false;
    }
  }
  return checkWin(state);
}

const levels = levelsJson as Array<{ name: string; csv: string }>;

console.log('Level | S1 moves | S2 moves | S1 states | S2 states | S1 time | S2 time | S1 valid | S2 valid');
console.log('------|----------|----------|-----------|-----------|---------|---------|----------|--------');

for (const entry of levels) {
  const level = parseCsvLevel(entry.name, entry.name, entry.csv);

  const t1 = Date.now();
  const r1 = solve1(level);
  const d1 = Date.now() - t1;

  const t2 = Date.now();
  const r2 = solve2(level);
  const d2 = Date.now() - t2;

  const v1 = r1.solvable ? verify(entry, r1.path) : false;
  const v2 = r2.solvable ? verify(entry, r2.path) : false;

  const m1 = r1.solvable ? String(r1.moves) : 'N/A';
  const m2 = r2.solvable ? String(r2.moves) : 'N/A';

  console.log(
    `${entry.name.padEnd(5)} | ${m1.padStart(8)} | ${m2.padStart(8)} | ` +
    `${r1.statesExplored.toLocaleString().padStart(9)} | ${r2.statesExplored.toLocaleString().padStart(9)} | ` +
    `${(d1 + 'ms').padStart(7)} | ${(d2 + 'ms').padStart(7)} | ` +
    `${String(v1).padStart(8)} | ${String(v2).padStart(6)}`
  );
}
