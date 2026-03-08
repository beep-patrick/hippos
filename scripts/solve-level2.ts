import { parseCsvLevel } from '../src/parseCsvLevel.js';
import { solveLevel } from '../src/solver2.js';
import levelsJson from '../src/levels/levels.generated.json' assert { type: 'json' };

const levelName = process.argv[2];
const maxStates = Number(process.argv[3] ?? 500_000);

function solve(name: string, csv: string) {
  const level = parseCsvLevel(name, `Level ${name}`, csv);
  console.log(`\nLevel ${name}: ${level.rows - 2} rows x ${level.cols} cols, ${level.logs.length} logs, ${level.hippoObstacles.length} obstacle hippos`);
  console.log('Solving...');

  const t0 = Date.now();
  const result = solveLevel(level, { maxStates });
  const elapsed = Date.now() - t0;

  console.log(`States explored: ${result.statesExplored.toLocaleString()} (${elapsed}ms)`);
  if (result.solvable) {
    const pieceSteps = result.path!.filter(m => m.type !== 'hippo').length;
    const hippoSteps = result.path!.filter(m => m.type === 'hippo').length;
    console.log(`  Solvable in ${result.moves} piece slides (${hippoSteps} hippo steps, ${result.path!.length} total)`);
    console.log('  Transcript:');
    for (const move of result.path!) {
      if (move.type === 'hippo') {
        const dir = move.dr === -1 ? 'up' : move.dr === 1 ? 'down' : move.dc === -1 ? 'left' : 'right';
        console.log(`    hippo ${dir}`);
      } else {
        console.log(`    slide ${move.id} -> (${move.newRow},${move.newCol})`);
      }
    }
  } else {
    console.log(`  Not solvable within ${maxStates.toLocaleString()} states`);
  }
}

const levels = levelsJson as Array<{ name: string; csv: string }>;

if (levelName && levelName !== 'all') {
  const entry = levels.find(l => l.name === levelName);
  if (!entry) { console.error(`Level ${levelName} not found`); process.exit(1); }
  solve(entry.name, entry.csv);
} else {
  console.log(`Solving all ${levels.length} levels...`);
  for (const entry of levels) {
    solve(entry.name, entry.csv);
  }
}
