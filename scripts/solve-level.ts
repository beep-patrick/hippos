import { parseCsvLevel } from '../src/parseCsvLevel.js';
import { solveLevel } from '../src/solver.js';
import levelsJson from '../src/levels/levels.generated.json' assert { type: 'json' };

const levelName = process.argv[2] ?? '4';
const entry = (levelsJson as Array<{ name: string; csv: string }>).find(l => l.name === levelName);
if (!entry) { console.error(`Level ${levelName} not found`); process.exit(1); }

const level = parseCsvLevel(entry.name, `Level ${entry.name}`, entry.csv);
console.log(`Level ${levelName}: ${level.rows - 2} rows × ${level.cols} cols, ${level.logs.length} logs, ${level.hippoObstacles.length} obstacle hippos`);
console.log('Solving...');

const t0 = Date.now();
const maxStates = Number(process.argv[3] ?? 500_000);
const result = solveLevel(level, { maxStates });
const elapsed = Date.now() - t0;

console.log(`States explored: ${result.statesExplored.toLocaleString()} (${elapsed}ms)`);
if (result.solvable) {
  console.log(`✓ Solvable in ${result.moves} log/obstacle slides`);
  console.log(`  Full path (${result.path!.length} steps):`);
  for (const move of result.path!) {
    if (move.type === 'hippo') {
      const dir = move.dr === -1 ? '↑' : move.dr === 1 ? '↓' : move.dc === -1 ? '←' : '→';
      console.log(`    hippo ${dir}`);
    } else {
      const pos = move.type === 'log'
        ? `→ (${move.newRow},${move.newCol})`
        : `→ (${move.newRow},${move.newCol})`;
      console.log(`    ${move.type} ${move.id} ${pos}`);
    }
  }
} else {
  console.log(`✗ Not solvable within ${maxStates.toLocaleString()} states`);
}
