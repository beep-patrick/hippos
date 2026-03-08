/**
 * Verify solver2 solutions by replaying transcripts step-by-step on the game engine.
 */
import { parseCsvLevel } from '../src/parseCsvLevel.js';
import { initState, moveLog, moveHippo, moveHippoObstacle, checkWin } from '../src/gameState.js';
import { solveLevel, type SolverMove } from '../src/solver2.js';
import levelsJson from '../src/levels/levels.generated.json' assert { type: 'json' };

const levels = levelsJson as Array<{ name: string; csv: string }>;
let allOk = true;

for (const entry of levels) {
  const level = parseCsvLevel(entry.name, `Level ${entry.name}`, entry.csv);
  const result = solveLevel(level);

  if (!result.solvable) {
    console.log(`Level ${entry.name}: FAIL - solver says not solvable`);
    allOk = false;
    continue;
  }

  // Replay transcript on the game engine
  const state = initState(level);
  let ok = true;
  let stepIdx = 0;

  for (const move of result.path!) {
    stepIdx++;
    if (move.type === 'hippo') {
      const success = moveHippo(state, move.dr, move.dc);
      if (!success) {
        console.log(`Level ${entry.name}: FAIL at step ${stepIdx} - hippo move (${move.dr},${move.dc}) rejected by game engine`);
        console.log(`  Hippo at (${state.hippoPos.row},${state.hippoPos.col})`);
        ok = false;
        break;
      }
    } else if (move.type === 'log') {
      const success = moveLog(state, move.id, move.newRow, move.newCol);
      if (!success) {
        console.log(`Level ${entry.name}: FAIL at step ${stepIdx} - log ${move.id} move to (${move.newRow},${move.newCol}) rejected`);
        ok = false;
        break;
      }
    } else {
      const success = moveHippoObstacle(state, move.id, move.newRow, move.newCol);
      if (!success) {
        console.log(`Level ${entry.name}: FAIL at step ${stepIdx} - obstacle ${move.id} move to (${move.newRow},${move.newCol}) rejected`);
        ok = false;
        break;
      }
    }
  }

  if (ok) {
    const won = checkWin(state);
    if (won) {
      console.log(`Level ${entry.name}: OK (${result.moves} slides, ${result.path!.length} total steps)`);
    } else {
      console.log(`Level ${entry.name}: FAIL - transcript completed but win condition not met`);
      console.log(`  Hippo at (${state.hippoPos.row},${state.hippoPos.col}), mama at (${level.mamaPos.row},${level.mamaPos.col})`);
      ok = false;
    }
  }

  if (!ok) allOk = false;
}

console.log(allOk ? '\nAll levels verified!' : '\nSome levels FAILED verification');
process.exit(allOk ? 0 : 1);
