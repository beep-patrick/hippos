/**
 * All-in-one level design tool: parse -> visualize -> solve -> verify.
 *
 * Usage:
 *   npx tsx scripts/test-level.ts path/to/level.csv        # test a CSV file
 *   npx tsx scripts/test-level.ts 3                          # test existing level by name
 *   npx tsx scripts/test-level.ts all                        # test all existing levels
 *   npx tsx scripts/test-level.ts path/to/level.csv 1000000  # custom max states
 */
import { parseCsvLevel } from '../src/parseCsvLevel.js';
import { initState, moveLog, moveHippo, moveHippoObstacle, checkWin } from '../src/gameState.js';
import { solveLevel, type SolverMove } from '../src/solver.js';
import type { Level } from '../src/types.js';
import { renderAscii, levelInfo } from './visualize-level.js';
import { loadAllLevels, findLevel } from './load-levels.js';

// ---------------------------------------------------------------------------
// Verification: replay transcript through game engine
// ---------------------------------------------------------------------------

function verify(level: Level, path: SolverMove[]): { ok: boolean; error?: string } {
  const state = initState(level);
  for (let i = 0; i < path.length; i++) {
    const move = path[i];
    if (move.type === 'hippo') {
      if (!moveHippo(state, move.dr, move.dc)) {
        const dir = move.dr === -1 ? 'up' : move.dr === 1 ? 'down' : move.dc === -1 ? 'left' : 'right';
        return { ok: false, error: `Step ${i + 1}: hippo ${dir} rejected at (${state.hippoPos.row},${state.hippoPos.col})` };
      }
    } else if (move.type === 'log') {
      if (!moveLog(state, move.id, move.newRow, move.newCol)) {
        return { ok: false, error: `Step ${i + 1}: slide ${move.id} to (${move.newRow},${move.newCol}) rejected` };
      }
    } else {
      if (!moveHippoObstacle(state, move.id, move.newRow, move.newCol)) {
        return { ok: false, error: `Step ${i + 1}: slide ${move.id} to (${move.newRow},${move.newCol}) rejected` };
      }
    }
  }
  if (!checkWin(state)) {
    return { ok: false, error: `Transcript completed but hippo at (${state.hippoPos.row},${state.hippoPos.col}) does not satisfy win condition` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Difficulty assessment
// ---------------------------------------------------------------------------

function assessDifficulty(moveCount: number, path: SolverMove[]): string {
  const movedPieces = new Set(path.filter(m => m.type !== 'hippo').map(m => (m as any).id));
  const hippoSteps = path.filter(m => m.type === 'hippo').length;

  let interleaveCount = 0;
  let lastType: 'hippo' | 'piece' = 'hippo';
  for (const m of path) {
    const type = m.type === 'hippo' ? 'hippo' : 'piece';
    if (type !== lastType) { interleaveCount++; lastType = type; }
  }

  let tier: string;
  if (moveCount <= 2) tier = 'Tutorial';
  else if (moveCount <= 5) tier = 'Beginner';
  else if (moveCount <= 8) tier = 'Easy';
  else if (moveCount <= 15) tier = 'Medium';
  else if (moveCount <= 25) tier = 'Hard';
  else tier = 'Expert';

  const parts = [
    `Difficulty: ${tier} (${moveCount} piece slides)`,
    `Pieces moved: ${movedPieces.size}`,
    `Hippo steps: ${hippoSteps}`,
    `Interleave switches: ${interleaveCount} (higher = more interesting)`,
  ];

  if (interleaveCount <= 1 && moveCount > 3)
    parts.push('NOTE: Hippo never moves between slides — may feel like pure Rush Hour');
  if (movedPieces.size === 1 && moveCount > 1)
    parts.push('NOTE: Only one piece moves — consider adding dependencies');

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Main test function
// ---------------------------------------------------------------------------

function testLevel(name: string, level: Level, maxStates: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Level: ${name}`);
  console.log('='.repeat(60));
  console.log();
  console.log(levelInfo(level));
  console.log();
  console.log(renderAscii(level));
  console.log();

  console.log('Solving...');
  const t0 = Date.now();
  const result = solveLevel(level, { maxStates });
  const elapsed = Date.now() - t0;

  console.log(`States explored: ${result.statesExplored.toLocaleString()} (${elapsed}ms)`);

  if (!result.solvable) {
    console.log('\nRESULT: NOT SOLVABLE');
    if (result.statesExplored >= maxStates) {
      console.log(`(Hit state limit of ${maxStates.toLocaleString()} — might be solvable with higher limit)`);
    }
    return;
  }

  console.log(`\nSOLUTION: ${result.moves} piece slides, ${result.path!.length} total steps`);
  console.log();

  console.log(assessDifficulty(result.moves!, result.path!));
  console.log();

  console.log('Transcript:');
  if (result.transcript) {
    for (const entry of result.transcript) {
      if (entry.action === 'hippo') {
        console.log(`  Move hippo to (${entry.target.row},${entry.target.col})`);
      } else {
        const name = entry.piece.replace('log-', '').replace('obstacle-', '');
        console.log(`  Slide ${name} ${entry.direction} ${entry.distance}`);
      }
    }
  }

  console.log();
  const v = verify(level, result.path!);
  if (v.ok) {
    console.log('VERIFIED: Transcript replays correctly through game engine');
  } else {
    console.log(`VERIFICATION FAILED: ${v.error}`);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npx tsx scripts/test-level.ts <level-name|path.csv|all> [maxStates]');
  process.exit(1);
}

const maxStates = Number(process.argv[3] ?? 500_000);

if (arg === 'all') {
  for (const entry of loadAllLevels()) {
    const level = parseCsvLevel(entry.name, entry.name, entry.csv);
    testLevel(entry.name, level, maxStates);
  }
} else {
  const entry = findLevel(arg);
  if (!entry) {
    console.error(`Level "${arg}" not found.`);
    process.exit(1);
  }
  const level = parseCsvLevel(entry.name, entry.name, entry.csv);
  testLevel(entry.name, level, maxStates);
}
